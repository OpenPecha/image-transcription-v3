import { useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { GripHorizontal, GripVertical, Send, Trash2 } from 'lucide-react'
import { ImageCanvas } from './image-canvas'
import { WorkspaceSidebar } from './workspace-sidebar'
import { TrashConfirmationDialog } from './trash-confirmation-dialog'
import { TaskConfirmationDialog } from './task-confirmation-dialog'
import { RejectAnnotatorDialog } from './reject-annotator-dialog'
import { RejectAnnotatorBar } from './reject-annotator-bar'
import { EditorOverlay } from './editor-overlay'
import { EditorToolbar } from './editor-toolbar'
import { EmptyTasksState } from './empty-tasks-state'
import { DiffResolver, type DiffResolverHandle } from './diff-resolver'
import { LookupDictionaryPanel } from './lookup-dictionary-panel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth'
import { useUIStore } from '@/store/use-ui-store'
import { FONT_FAMILY_MAP } from './constant'
import {
  parseTDiff,
  resolveSegments,
  resolveSegmentsPreview,
  allDiffsResolved,
  applyDiffSelections,
  loadDiffDraftSelections,
  saveDiffDraftSelections,
  saveSegmentDraft,
  loadSegmentDraft,
  clearDiffDraft,
  insertLocalDiff,
  removeLocalDiff,
  getNextDiffId,
  isDuplicateReviewerInput,
  type Segment,
  type DiffSelection,
  type LocalDiffTarget,
} from '../utils/parse-tdiff'
import {
  useGetAssignedTask,
  useSubmitTask,
  useTrashTask,
  useApproveTask,
} from '../api'
import { loadNonEmptyTextDraft, useLocalDraft, useRejectAnnotatorFlow } from '../hooks'
import {
  getWorkspaceRoleCaps,
  isAnnotatorRole,
  isApprovableTaskState,
  isWorkspaceEditable,
  canReviewerRejectAnnotators,
} from '../workspace-role-config'
import { cn } from '@/lib/utils'
import {
  isEditableTaskState,
  canAnnotatorTrashTask,
  getAnnotatorBaselineTranscript,
} from '@/types'

function WorkspaceMainShell({
  dictionaryEnabled,
  children,
}: {
  dictionaryEnabled: boolean
  children: ReactNode
}) {
  return (
    <main className="ml-60 flex h-dvh max-h-dvh min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      <LookupDictionaryPanel enabled={dictionaryEnabled} />
    </main>
  )
}

export function WorkspaceEditor() {
  const { t } = useTranslation('workspace')
  const { t: tCommon } = useTranslation('common')
  const { currentUser } = useAuth()
  const { addToast, editorFontFamily, editorFontSize } = useUIStore()

  const [text, setText] = useState('')
  const [originalOcrText, setOriginalOcrText] = useState('')
  const [splitPosition, setSplitPosition] = useState(55)
  const [isDragging, setIsDragging] = useState(false)
  const [trashDialogOpen, setTrashDialogOpen] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [segments, setSegments] = useState<Segment[]>([])
  const [hasTextSelection, setHasTextSelection] = useState(false)
  const [baseTranscript, setBaseTranscript] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const diffResolverRef = useRef<DiffResolverHandle>(null)
  const textPanelRef = useRef<HTMLDivElement>(null)

  const {
    data: task,
    isLoading,
    isFetching,
    refetch,
  } = useGetAssignedTask(currentUser?.id)

  const submitTask = useSubmitTask(currentUser?.id)
  const trashTask = useTrashTask(currentUser?.id)
  const approveTask = useApproveTask(currentUser?.id)

  const roleCaps = getWorkspaceRoleCaps(currentUser?.role)
  const isAnnotator = isAnnotatorRole(currentUser?.role)
  const dictionaryEnabled = roleCaps?.dictionaryEnabled ?? false
  const usesApproveAction = roleCaps?.usesApproveAction ?? false
  const canTrash = isAnnotator && task ? canAnnotatorTrashTask(task.state) : false
  const usesDiffResolver = roleCaps?.usesDiffResolver ?? false
  const hasDiffSegments = segments.some((seg) => seg.type === 'diff')
  const hasAnnotatorDiffs = useMemo(
    () => parseTDiff(baseTranscript).some((seg) => seg.type === 'diff'),
    [baseTranscript]
  )
  const resolvedText = useMemo(() => resolveSegments(segments), [segments])
  const previewText = useMemo(() => resolveSegmentsPreview(segments), [segments])

  const { clearDraft } = useLocalDraft({
    taskId: task?.task_id ?? null,
    text,
    delay: 500,
    enabled: !usesDiffResolver,
  })

  const clearAllDrafts = useCallback(() => {
    clearDraft()
    if (task) {
      clearDiffDraft(task.task_id)
    }
  }, [clearDraft, task])

  const canEdit = task ? isWorkspaceEditable(task.state, currentUser?.role) : false
  const canRejectAnnotators =
    !!task && canReviewerRejectAnnotators(task.state, currentUser?.role) && canEdit

  const rejectAnnotatorFlow = useRejectAnnotatorFlow({
    task,
    userId: currentUser?.id,
    enabled: canRejectAnnotators,
    clearDrafts: clearAllDrafts,
    addToast,
  })

  const canActOnTask = task
    ? usesApproveAction
      ? isApprovableTaskState(task.state, currentUser?.role)
      : isEditableTaskState(task.state)
    : false
  const isMutating =
    submitTask.isPending ||
    trashTask.isPending ||
    approveTask.isPending ||
    rejectAnnotatorFlow.isRejecting
  const isLoadingNextTask = isFetching && !isLoading
  const showOverlay = isLoadingNextTask || isMutating

  const canApprove = useMemo(() => {
    if (!usesApproveAction || !canActOnTask || isMutating) return false
    if (!usesDiffResolver || !hasDiffSegments) return true
    return allDiffsResolved(segments)
  }, [usesApproveAction, canActOnTask, isMutating, usesDiffResolver, hasDiffSegments, segments])

  const transcriptForSubmit = usesDiffResolver ? resolvedText : text

  // Sync editor state when the assigned task changes
  useEffect(() => {
    if (!task) {
      setText('')
      setOriginalOcrText('')
      setSegments([])
      return
    }

    const transcript = usesDiffResolver
      ? (task.task_transcript ?? '')
      : getAnnotatorBaselineTranscript(task)

    const parsed = parseTDiff(transcript)
    const usesResolver = usesDiffResolver

    let nextSegments = parsed
    if (usesResolver) {
      const savedSegments = loadSegmentDraft(task.task_id, transcript)
      if (savedSegments) {
        nextSegments = savedSegments
      } else if (parsed.some((seg) => seg.type === 'diff')) {
        const savedSelections = loadDiffDraftSelections(task.task_id)
        if (savedSelections) {
          nextSegments = applyDiffSelections(parsed, savedSelections)
        }
      }
    }

    setSegments(nextSegments)
    setBaseTranscript(transcript)
    setOriginalOcrText(transcript)
    setHasTextSelection(false)

    if (usesResolver) {
      setText(resolveSegmentsPreview(nextSegments))
    } else {
      const draft = loadNonEmptyTextDraft(task.task_id)
      setText(draft ?? transcript)
    }
  }, [
    task?.task_id,
    task?.task_transcript,
    task?.initial_transcript,
    task?.state,
    usesDiffResolver,
  ])

  // Reset split position when image orientation changes
  useEffect(() => {
    if (task?.orientation) {
      setSplitPosition(50)
    }
  }, [task?.orientation])

  const handleRestoreOriginal = useCallback(() => {
    setText(originalOcrText)
  }, [originalOcrText])

  const persistSegments = useCallback(
    (next: Segment[]) => {
      if (!task) return
      saveDiffDraftSelections(task.task_id, next)
      saveSegmentDraft(task.task_id, next, baseTranscript)
    },
    [task, baseTranscript]
  )

  const handleResolveDiff = useCallback(
    (diffId: number, selected: DiffSelection) => {
      setSegments((prev) => {
        const next = prev.map((seg) => {
          if (seg.type !== 'diff' || seg.id !== diffId) return seg
          if (
            selected.kind === 'custom' &&
            isDuplicateReviewerInput(seg, selected.value)
          ) {
            return seg
          }
          const customDraft =
            selected.kind === 'preset' && !seg.customDraftEdited
              ? (seg.options[selected.index] ?? seg.customDraft)
              : seg.customDraft
          return { ...seg, selected, customDraft, confirmed: true }
        })
        persistSegments(next)
        return next
      })
    },
    [persistSegments]
  )

  const handleUpdateCustomDraft = useCallback(
    (diffId: number, value: string) => {
      setSegments((prev) => {
        const next = prev.map((seg) =>
          seg.type === 'diff' && seg.id === diffId
            ? {
                ...seg,
                customDraft: value,
                customDraftEdited: true,
                selected: { kind: 'custom' as const, value },
                confirmed: false,
              }
            : seg
        )
        persistSegments(next)
        return next
      })
    },
    [persistSegments]
  )

  const handleCreateLocalDiff = useCallback(
    (target: LocalDiffTarget): number | null => {
      const diffId = getNextDiffId(segments)
      const next = insertLocalDiff(segments, target, diffId)
      if (!next) return null

      setSegments(next)
      persistSegments(next)
      return diffId
    },
    [segments, persistSegments]
  )

  const handleEditSelection = useCallback(() => {
    diffResolverRef.current?.editSelection()
  }, [])

  const handleDeleteLocalDiff = useCallback(
    (diffId: number) => {
      setSegments((prev) => {
        const next = removeLocalDiff(prev, diffId)
        if (!next) return prev
        persistSegments(next)
        return next
      })
    },
    [persistSegments]
  )

  const handleSubmit = useCallback(() => {
    if (!task || !currentUser) return

    submitTask.mutate(
      { task_id: task.task_id, user_id: currentUser.id!, transcript: transcriptForSubmit, submit: true },
      {
        onSuccess: () => {
          clearAllDrafts()
          setSubmitDialogOpen(false)
          addToast({
            title: t('toast.submitted'),
            description: t('toast.submittedDescription'),
            variant: 'success',
          })
        },
        onError: (error: Error) => {
          addToast({
            title: t('toast.submitFailed'),
            description: error.message,
            variant: 'destructive',
          })
        },
      }
    )
  }, [task, currentUser, transcriptForSubmit, submitTask, clearAllDrafts, addToast, t])

  const handleTrash = useCallback(() => {
    if (!task || !currentUser) return

    trashTask.mutate(
      { task_id: task.task_id, user_id: currentUser.id!, submit: false },
      {
        onSuccess: () => {
          clearAllDrafts()
          setTrashDialogOpen(false)
          addToast({ title: t('toast.trashed'), variant: 'default' })
        },
        onError: (error: Error) => {
          addToast({
            title: t('toast.trashFailed'),
            description: error.message,
            variant: 'destructive',
          })
        },
      }
    )
  }, [task, currentUser, trashTask, clearAllDrafts, addToast, t])

  const handleApprove = useCallback(() => {
    if (!task || !currentUser) return

    approveTask.mutate(
      {
        task_id: task.task_id,
        user_id: currentUser.id!,
        transcript: transcriptForSubmit,
        approve: true,
      },
      {
        onSuccess: () => {
          clearAllDrafts()
          setApproveDialogOpen(false)
          addToast({
            title: t('toast.approved'),
            description: t('toast.approvedDescription'),
            variant: 'success',
          })
        },
        onError: (error: Error) => {
          addToast({
            title: t('toast.approveFailed'),
            description: error.message,
            variant: 'destructive',
          })
        },
      }
    )
  }, [task, currentUser, transcriptForSubmit, approveTask, clearAllDrafts, addToast, t])

  const isHorizontalLayout = task?.orientation === 'portrait' && !usesDiffResolver

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      const container = e.currentTarget as HTMLElement
      const rect = container.getBoundingClientRect()

      const position = isHorizontalLayout
        ? ((e.clientX - rect.left) / rect.width) * 100
        : ((e.clientY - rect.top) / rect.height) * 100

      setSplitPosition(Math.max(20, Math.min(80, position)))
    },
    [isDragging, isHorizontalLayout]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-dvh max-h-dvh overflow-hidden bg-background">
        <WorkspaceSidebar
          task={null}
          onRefresh={() => refetch()}
          isLoading={true}
        />
        <WorkspaceMainShell dictionaryEnabled={dictionaryEnabled}>
          <div className="flex flex-1 items-center justify-center">
            <Skeleton className="m-4 h-full w-full rounded-lg" />
          </div>
        </WorkspaceMainShell>
      </div>
    )
  }

  if (!task) {
    const noApplicationMessage = !currentUser?.application
      ? 'You have no application assigned. Please contact your administrator.'
      : undefined

    return (
      <div className="flex h-dvh max-h-dvh overflow-hidden bg-background">
        <WorkspaceSidebar
          task={null}
          onRefresh={() => refetch()}
          isLoading={isLoading || isFetching}
        />
        <WorkspaceMainShell dictionaryEnabled={dictionaryEnabled}>
          <EmptyTasksState
            onRefresh={() => refetch()}
            isLoading={isLoading}
            message={noApplicationMessage}
          />
        </WorkspaceMainShell>
      </div>
    )
  }

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-background">
      <WorkspaceSidebar
        task={task}
        onRefresh={() => refetch()}
        isLoading={isFetching}
      />

      <WorkspaceMainShell dictionaryEnabled={dictionaryEnabled}>
        <div
          className={cn(
            'relative flex flex-1 overflow-hidden',
            isHorizontalLayout ? 'flex-row' : 'flex-col'
          )}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <EditorOverlay
            show={showOverlay}
            message={isMutating ? t('loading.processing') : t('loading.loadingNext')}
          />

          <div
            className={cn(
              'relative z-0 overflow-hidden flex-shrink-0',
              isHorizontalLayout ? 'border-r border-border h-full' : 'border-b border-border w-full'
            )}
            style={
              isHorizontalLayout
                ? { width: `calc(${splitPosition}% - 6px)` }
                : { height: `${splitPosition}%` }
            }
          >
            <ImageCanvas imageUrl={task.task_url} />
          </div>

          <div
            className={cn(
              'flex-shrink-0 flex items-center justify-center bg-border/80 transition-colors select-none',
              isHorizontalLayout
                ? 'w-3 cursor-col-resize hover:bg-primary/40'
                : 'h-2 cursor-row-resize hover:bg-primary/50',
              isDragging && 'bg-primary/60'
            )}
            onMouseDown={handleMouseDown}
          >
            {isHorizontalLayout ? (
              <GripVertical className="h-6 w-4 text-muted-foreground/70" />
            ) : (
              <GripHorizontal className="h-3 w-5 text-muted-foreground" />
            )}
          </div>

          <div
            ref={textPanelRef}
            className={cn(
              'relative z-0 overflow-hidden bg-muted/30 flex-1 flex flex-col min-h-0',
              isHorizontalLayout ? 'h-full' : 'w-full'
            )}
          >
            {usesDiffResolver ? (
              <DiffResolver
                ref={diffResolverRef}
                key={task.task_id}
                segments={segments}
                onResolveDiff={handleResolveDiff}
                onUpdateCustomDraft={handleUpdateCustomDraft}
                onCreateLocalDiff={handleCreateLocalDiff}
                onDeleteLocalDiff={handleDeleteLocalDiff}
                onTextSelectionChange={setHasTextSelection}
                previewText={previewText}
                referenceTranscript1={task.task_transcript_1 ?? ''}
                referenceTranscript2={task.task_transcript_2 ?? ''}
                referenceTranscript3={task.task_transcript_3 ?? ''}
                comparisonTranscript={baseTranscript}
                fontFamily={editorFontFamily}
                fontSize={editorFontSize}
                noAnnotatorDiffs={!hasAnnotatorDiffs}
                isEmptyTranscript={!baseTranscript.trim()}
                referenceTabs={roleCaps?.referenceTabs ?? 'none'}
                menuBoundaryRef={textPanelRef}
                toolbar={
                  <EditorToolbar
                    onRestoreOriginal={handleRestoreOriginal}
                    hasOriginalContent={false}
                    isDisabled={!canEdit || showOverlay}
                    showDiffShortcuts
                    canEditSelection={hasTextSelection && canEdit && !showOverlay}
                    onEditSelection={handleEditSelection}
                  />
                }
              />
            ) : (
              <>
                <EditorToolbar
                  onRestoreOriginal={handleRestoreOriginal}
                  hasOriginalContent={
                    isAnnotator &&
                    originalOcrText.length > 0 &&
                    text !== originalOcrText
                  }
                  isDisabled={!canEdit || showOverlay}
                  showDiffShortcuts={false}
                  canEditSelection={false}
                  onEditSelection={handleEditSelection}
                />
                <textarea
                  id="editor-textarea"
                  name="editor-textarea"
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  readOnly={!canEdit || showOverlay}
                  placeholder={t('editor.placeholder')}
                  className={cn(
                    'flex-1 w-full resize-none bg-card p-5',
                    'text-foreground placeholder:text-placeholder',
                    'focus:outline-none focus:ring-0',
                    'transition-all duration-200',
                    (!canEdit || showOverlay) && 'cursor-default opacity-80'
                  )}
                  style={{
                    fontFamily: FONT_FAMILY_MAP[editorFontFamily],
                    fontSize: `${editorFontSize}px`,
                    lineHeight: 1.6,
                  }}
                  spellCheck={false}
                />
              </>
            )}
          </div>
        </div>

        <footer className="shrink-0 grid grid-cols-3 items-center border-t border-border bg-card px-6 py-3">
          <div className="flex items-center" />

          <div className="flex items-center justify-center gap-3">
            {isAnnotator && (
              <>
                <Button
                  variant="success"
                  onClick={() => setSubmitDialogOpen(true)}
                  disabled={showOverlay || !canEdit}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitTask.isPending ? t('actions.submitting') : t('actions.submit')}
                </Button>
                {canTrash && (
                  <Button
                    variant="destructive"
                    onClick={() => setTrashDialogOpen(true)}
                    disabled={showOverlay || !canEdit}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('actions.trash')}
                  </Button>
                )}
              </>
            )}

            {canRejectAnnotators && (
              <RejectAnnotatorBar
                onOpen={rejectAnnotatorFlow.openRejectDialog}
                disabled={showOverlay}
              />
            )}

            {usesApproveAction && (
              <Button
                variant="success"
                onClick={() => setApproveDialogOpen(true)}
                disabled={!canApprove}
              >
                <Send className="h-4 w-4 mr-2" />
                {approveTask.isPending ? t('actions.approving') : t('actions.approve')}
              </Button>
            )}
          </div>

          <div className="flex justify-end" />
        </footer>
      </WorkspaceMainShell>

      <TrashConfirmationDialog
        open={trashDialogOpen}
        onOpenChange={setTrashDialogOpen}
        onConfirm={handleTrash}
        onCancel={() => setTrashDialogOpen(false)}
        isLoading={trashTask.isPending}
        taskName={task.task_name}
      />

      <RejectAnnotatorDialog {...rejectAnnotatorFlow.dialogProps} />

      <TaskConfirmationDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        onConfirm={handleSubmit}
        onCancel={() => setSubmitDialogOpen(false)}
        isLoading={submitTask.isPending}
        title={t('dialogs.submit.title')}
        description={t('dialogs.submit.description', { taskName: task.task_name })}
        confirmLabel={t('dialogs.submit.confirm')}
        cancelLabel={tCommon('actions.cancel')}
        loadingLabel={t('loading.processing')}
        variant="success"
        icon={Send}
      />

      <TaskConfirmationDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        onConfirm={handleApprove}
        onCancel={() => setApproveDialogOpen(false)}
        isLoading={approveTask.isPending}
        title={t('dialogs.approve.title')}
        description={t('dialogs.approve.description', { taskName: task.task_name })}
        confirmLabel={t('dialogs.approve.confirm')}
        cancelLabel={tCommon('actions.cancel')}
        loadingLabel={t('loading.processing')}
        variant="success"
        icon={Send}
      />
    </div>
  )
}
