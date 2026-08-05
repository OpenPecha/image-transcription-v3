import {
  useRef,
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  cloneElement,
  isValidElement,
  type ReactNode,
  type RefObject,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CheckCircle2, ChevronDown, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { DiffSelection, LocalDiffTarget, Segment, DiffSegment } from '../utils/parse-tdiff'
import {
  formatDiffDisplay,
  getAnnotatorOptionLabel,
  getDiffProposedValue,
  isDiffResolved,
  isDuplicateReviewerInput,
  countPresetResolutionChoices,
} from '../utils/parse-tdiff'
import { parseTextSegmentSelection } from '../utils/text-selection'
import { FONT_FAMILY_MAP } from './constant'
import type { EditorFontFamily } from '@/store/use-ui-store'
import { AnnotatorReadonlyPanel } from './annotator-readonly-panel'
import type { EditorToolbarInjectedProps } from './editor-toolbar'
import type { ReferenceTabsMode } from '../workspace-role-config'
import {
  buildAnnotatorSlotReferenceSegments,
  computeReferenceHighlightStats,
} from '../utils/reference-highlight-stats'

export type DiffResolverHandle = {
  editSelection: () => boolean
}

interface DiffResolverProps {
  segments: Segment[]
  onResolveDiff: (diffId: number, selection: DiffSelection) => void
  onUpdateCustomDraft: (diffId: number, value: string) => void
  onCreateLocalDiff: (target: LocalDiffTarget) => number | null
  onDeleteLocalDiff: (diffId: number) => void
  onTextSelectionChange: (hasSelection: boolean) => void
  previewText: string
  referenceTranscript1: string
  referenceTranscript2: string
  referenceTranscript3?: string
  /** Comparison transcript with `<t-diff>` tags for reference-tab highlights. */
  comparisonTranscript?: string
  fontFamily: EditorFontFamily
  fontSize: number
  /** True when the base transcript has no annotator `<t-diff>` tags. */
  noAnnotatorDiffs?: boolean
  isEmptyTranscript?: boolean
  /** Rendered directly under the tab bar (e.g. editor toolbar). */
  toolbar?: ReactNode
  /** Keeps diff choice menus inside the text panel, below the image. */
  menuBoundaryRef?: RefObject<HTMLElement | null>
  /** Read-only reference tabs: annotators (Reviewer A/B) or reviewers (Final Reviewer). */
  referenceTabs?: ReferenceTabsMode
  /** Prior reviewer submission shown when reassigned after final-reviewer rejection. */
  reviewerTranscript?: string
}

function ReadOnlyTranscriptPanel({
  value,
  placeholder,
  fontFamily,
  fontSize,
}: {
  value: string
  placeholder: string
  fontFamily: string
  fontSize: number
}) {
  return (
    <textarea
      readOnly
      aria-readonly
      value={value}
      className="flex-1 w-full resize-none bg-card p-5 text-foreground focus:outline-none focus:ring-0 border-none select-text cursor-default"
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: 1.8,
      }}
      placeholder={placeholder}
    />
  )
}

function getCustomShortcutKey(optionsCount: number): string | undefined {
  const key = optionsCount + 1
  return key <= 9 ? String(key) : undefined
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLInputElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

function moveCaretToEnd(el: HTMLTextAreaElement) {
  requestAnimationFrame(() => {
    const len = el.value.length
    el.setSelectionRange(len, len)
  })
}

type PillVariant = 'pending' | 'confirmed'

function getPillVariant(seg: DiffSegment): PillVariant {
  return isDiffResolved(seg) ? 'confirmed' : 'pending'
}

const PILL_VARIANT_CLASSES: Record<PillVariant, string> = {
  pending:
    'bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:hover:bg-amber-950/90 dark:text-amber-200',
  confirmed:
    'bg-emerald-100 border-emerald-300 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:hover:bg-emerald-950/90 dark:text-emerald-200',
}

function getWorkingAreaDisplayText(seg: DiffSegment): string {
  const value = getDiffProposedValue(seg)
  if (value === '') return '∅'
  return value
}

export const DiffResolver = forwardRef<DiffResolverHandle, DiffResolverProps>(function DiffResolver(
  {
    segments,
    onResolveDiff,
    onUpdateCustomDraft,
    onCreateLocalDiff,
    onDeleteLocalDiff,
    onTextSelectionChange,
    previewText,
    referenceTranscript1,
    referenceTranscript2,
    referenceTranscript3,
    comparisonTranscript,
    fontFamily,
    fontSize,
    noAnnotatorDiffs = false,
    isEmptyTranscript = false,
    toolbar,
    menuBoundaryRef,
    referenceTabs = 'none',
    reviewerTranscript = '',
  },
  ref
) {
  const { t } = useTranslation('workspace')
  const workingAreaRef = useRef<HTMLDivElement>(null)
  const workingAreaContainerRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<Map<number, HTMLSpanElement>>(new Map())
  const customInputRefs = useRef<Map<number, HTMLTextAreaElement>>(new Map())
  const [openDiffId, setOpenDiffId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('working')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const diffSegments = segments.filter((seg): seg is DiffSegment => seg.type === 'diff')
  const unresolvedCount = diffSegments.filter((seg) => !isDiffResolved(seg)).length
  const presetChoiceCounts = useMemo(
    () => countPresetResolutionChoices(diffSegments),
    [diffSegments]
  )
  const [menuCollisionBoundary, setMenuCollisionBoundary] = useState<Element[] | undefined>(
    undefined
  )

  useLayoutEffect(() => {
    const boundary = menuBoundaryRef?.current
    setMenuCollisionBoundary(boundary ? [boundary] : undefined)
  }, [menuBoundaryRef, segments])

  const focusDiff = useCallback((diffId: number) => {
    setTimeout(() => {
      pillRefs.current.get(diffId)?.focus()
    }, 50)
  }, [])

  const openDiffMenu = useCallback((diffId: number, focusCustom = false) => {
    setOpenDiffId(diffId)
    setTimeout(() => {
      if (focusCustom) {
        const el = customInputRefs.current.get(diffId)
        if (el) {
          el.focus()
          moveCaretToEnd(el)
        }
      } else {
        pillRefs.current.get(diffId)?.focus()
      }
    }, 50)
  }, [])

  const focusCustomInput = useCallback((diffId: number, options?: { openMenu?: boolean }) => {
    if (options?.openMenu) {
      setOpenDiffId(diffId)
    }
    setTimeout(() => {
      const el = customInputRefs.current.get(diffId)
      if (!el) return
      el.focus()
      moveCaretToEnd(el)
    }, 100)
  }, [])

  const navigateBetweenDiffs = useCallback(
    (currentDiffId: number, direction: 'prev' | 'next', options?: { keepOpen?: boolean }) => {
      const diffIds = diffSegments.map((seg) => seg.id)
      const currentIndex = diffIds.indexOf(currentDiffId)
      if (currentIndex === -1) return

      const targetId =
        direction === 'next'
          ? diffIds[(currentIndex + 1) % diffIds.length]
          : diffIds[(currentIndex - 1 + diffIds.length) % diffIds.length]

      if (targetId === undefined) return

      setOpenDiffId(options?.keepOpen ? targetId : null)

      setTimeout(() => {
        if (options?.keepOpen) {
          const el = customInputRefs.current.get(targetId)
          if (el) {
            el.focus()
            moveCaretToEnd(el)
          }
        } else {
          pillRefs.current.get(targetId)?.focus()
        }
      }, 50)
    },
    [diffSegments]
  )

  const selectPreset = useCallback(
    (diffId: number, index: number, options?: { keepOpen?: boolean }) => {
      onResolveDiff(diffId, { kind: 'preset', index })
      if (options?.keepOpen) {
        setOpenDiffId(diffId)
      } else {
        setOpenDiffId(null)
        focusDiff(diffId)
      }
    },
    [onResolveDiff, focusDiff]
  )

  const selectCustom = useCallback(
    (
      seg: DiffSegment,
      options?: { keepOpen?: boolean; focusInput?: boolean }
    ) => {
      if (isDuplicateReviewerInput(seg)) return

      onResolveDiff(seg.id, { kind: 'custom', value: seg.customDraft })
      if (options?.keepOpen) {
        setOpenDiffId(seg.id)
        if (options.focusInput) {
          focusCustomInput(seg.id)
        }
      } else {
        setOpenDiffId(null)
        focusDiff(seg.id)
      }
    },
    [onResolveDiff, focusDiff, focusCustomInput]
  )

  const editSelection = useCallback((): boolean => {
    const root = workingAreaRef.current
    if (!root) return false

    const target = parseTextSegmentSelection(root)
    if (!target) return false

    const newDiffId = onCreateLocalDiff(target)
    if (newDiffId === null) return false

    window.getSelection()?.removeAllRanges()
    openDiffMenu(newDiffId, true)
    return true
  }, [onCreateLocalDiff, openDiffMenu])

  useImperativeHandle(ref, () => ({ editSelection }), [editSelection])

  useEffect(() => {
    const syncSelection = () => {
      const root = workingAreaRef.current
      if (!root) {
        onTextSelectionChange(false)
        return
      }
      onTextSelectionChange(parseTextSegmentSelection(root) !== null)
    }

    document.addEventListener('selectionchange', syncSelection)
    return () => document.removeEventListener('selectionchange', syncSelection)
  }, [onTextSelectionChange])

  useEffect(() => {
    if (!contextMenu) return

    const closeMenu = () => setContextMenu(null)
    document.addEventListener('click', closeMenu)
    document.addEventListener('scroll', closeMenu, true)
    return () => {
      document.removeEventListener('click', closeMenu)
      document.removeEventListener('scroll', closeMenu, true)
    }
  }, [contextMenu])

  const handleWorkingAreaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'e' || e.key === 'E') {
        if (editSelection()) {
          e.preventDefault()
        }
      }
    },
    [editSelection]
  )

  const handleWorkingAreaContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const root = workingAreaRef.current
    const container = workingAreaContainerRef.current
    if (!root || !container || !parseTextSegmentSelection(root)) return

    e.preventDefault()
    const rect = container.getBoundingClientRect()
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleContextMenuEdit = useCallback(() => {
    setContextMenu(null)
    editSelection()
  }, [editSelection])

  const handlePillKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>, seg: DiffSegment) => {
      const diffId = seg.id

      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        navigateBetweenDiffs(diffId, 'next')
        return
      }
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        navigateBetweenDiffs(diffId, 'prev')
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateBetweenDiffs(diffId, 'next')
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateBetweenDiffs(diffId, 'prev')
        return
      }

      const presetIndex = Number(e.key) - 1
      if (presetIndex >= 0 && presetIndex < seg.options.length) {
        e.preventDefault()
        selectPreset(diffId, presetIndex, { keepOpen: true })
        return
      }

      const customShortcutKey = getCustomShortcutKey(seg.options.length)
      if (customShortcutKey && e.key === customShortcutKey) {
        e.preventDefault()
        if (isDuplicateReviewerInput(seg)) {
          focusCustomInput(diffId, { openMenu: true })
        } else {
          selectCustom(seg, { keepOpen: true, focusInput: true })
        }
      }
    },
    [selectPreset, selectCustom, navigateBetweenDiffs, focusCustomInput]
  )

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, seg: DiffSegment) => {
      if (isEditableTarget(e.target)) return

      const diffId = seg.id
      const presetIndex = Number(e.key) - 1

      if (presetIndex >= 0 && presetIndex < seg.options.length) {
        e.preventDefault()
        selectPreset(diffId, presetIndex, { keepOpen: true })
        return
      }

      const customShortcutKey = getCustomShortcutKey(seg.options.length)
      if (customShortcutKey && e.key === customShortcutKey) {
        e.preventDefault()
        e.stopPropagation()
        if (isDuplicateReviewerInput(seg)) {
          focusCustomInput(diffId)
        } else {
          selectCustom(seg, { keepOpen: true, focusInput: true })
        }
        return
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateBetweenDiffs(diffId, 'next', { keepOpen: true })
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateBetweenDiffs(diffId, 'prev', { keepOpen: true })
      }
    },
    [selectPreset, selectCustom, navigateBetweenDiffs, focusCustomInput]
  )

  const resolvedFontFamily = FONT_FAMILY_MAP[fontFamily]
  const showReferenceTabs = referenceTabs !== 'none'
  const showReviewerTranscriptTab = reviewerTranscript.trim().length > 0

  const referenceTabLabels = useMemo(() => {
    if (referenceTabs === 'reviewers') {
      return {
        tab1: t('diffResolver.reviewer1'),
        tab2: t('diffResolver.reviewer2'),
        tab3: undefined,
      }
    }
    return {
      tab1: t('diffResolver.annotator1'),
      tab2: t('diffResolver.annotator2'),
      tab3: referenceTranscript3 ? t('diffResolver.annotator3') : undefined,
    }
  }, [referenceTabs, referenceTranscript3, t])

  const getPresetOptionLabel = (index: number): string => {
    if (index === 0) return referenceTabLabels.tab1
    if (index === 1) return referenceTabLabels.tab2
    if (index === 2 && referenceTabLabels.tab3) return referenceTabLabels.tab3
    return t('diffResolver.optionPreset', { label: getAnnotatorOptionLabel(index) })
  }

  const presetSummaryText = useMemo(() => {
    if (!showReferenceTabs || diffSegments.length === 0) return ''
    const parts = [
      `${referenceTabLabels.tab1}: ${presetChoiceCounts.countA}`,
      `${referenceTabLabels.tab2}: ${presetChoiceCounts.countB}`,
    ]
    if (referenceTranscript3 && referenceTabLabels.tab3) {
      parts.push(`${referenceTabLabels.tab3}: ${presetChoiceCounts.countC}`)
    }
    return parts.join(' · ')
  }, [showReferenceTabs, diffSegments.length, referenceTabLabels, presetChoiceCounts, referenceTranscript3])

  const referenceHighlightStats = useMemo(() => {
    if (referenceTabs !== 'annotators') return null
    if (activeTab !== 'reference1' && activeTab !== 'reference2' && activeTab !== 'reference3') return null

    let value = ''
    let otherValue = ''
    let optionIndex = 0

    if (activeTab === 'reference1') {
      value = referenceTranscript1
      otherValue = referenceTranscript2 || (referenceTranscript3 ?? '')
      optionIndex = 0
    } else if (activeTab === 'reference2') {
      value = referenceTranscript2
      otherValue = referenceTranscript1
      optionIndex = 1
    } else if (activeTab === 'reference3') {
      value = referenceTranscript3 ?? ''
      otherValue = referenceTranscript1
      optionIndex = 2
    }

    const segments = buildAnnotatorSlotReferenceSegments({
      value,
      otherValue,
      optionIndex,
      comparisonTranscript,
    })

    return computeReferenceHighlightStats(segments)
  }, [
    activeTab,
    referenceTabs,
    referenceTranscript1,
    referenceTranscript2,
    referenceTranscript3,
    comparisonTranscript,
  ])

  const toolbarWithStats =
    toolbar && isValidElement<EditorToolbarInjectedProps>(toolbar)
      ? cloneElement(toolbar, { referenceHighlightStats })
      : toolbar

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex-1 flex flex-col h-full overflow-hidden bg-card"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card/60 px-4 py-2">
        <TabsList className="h-auto flex-wrap bg-muted/80">
          <TabsTrigger value="working" className="text-xs">
            {t('diffResolver.workingArea')}
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs">
            {t('diffResolver.preview')}
          </TabsTrigger>
          {showReferenceTabs && (
            <>
              <TabsTrigger value="reference1" className="text-xs">
                {referenceTabLabels.tab1}
              </TabsTrigger>
              <TabsTrigger value="reference2" className="text-xs">
                {referenceTabLabels.tab2}
              </TabsTrigger>
              {referenceTabLabels.tab3 && (
                <TabsTrigger value="reference3" className="text-xs">
                  {referenceTabLabels.tab3}
                </TabsTrigger>
              )}
            </>
          )}
          {showReviewerTranscriptTab && (
            <TabsTrigger value="reviewerTranscript" className="text-xs">
              {t('diffResolver.previousReview')}
            </TabsTrigger>
          )}
        </TabsList>

        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
          {presetSummaryText && (
            <span className="text-xs text-muted-foreground">
              {presetSummaryText}
            </span>
          )}
          <div className="text-xs font-semibold select-none">
            {unresolvedCount > 0 ? (
              <span className="text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-900/50">
                {t('diffResolver.unresolvedCount', { count: unresolvedCount })}
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-900/50 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                {t('diffResolver.allResolved')}
              </span>
            )}
          </div>
        </div>
      </div>

      {toolbarWithStats}

      {noAnnotatorDiffs && (
        <div
          className={cn(
            'flex shrink-0 flex-col gap-1 border-b border-border px-5 py-3',
            'bg-muted/40'
          )}
          role="status"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-success"
              aria-hidden
            />
            <p className="text-sm font-medium text-foreground">
              {t('reviewer.noDiffsToResolve')}
            </p>
          </div>
          {isEmptyTranscript && (
            <p className="pl-6 text-xs text-muted-foreground">
              {t('reviewer.pendingAlignment')}
            </p>
          )}
        </div>
      )}

      <TabsContent
        value="working"
        className="flex-1 flex flex-col min-h-0 m-0 border-none outline-none overflow-hidden"
      >
        <div
          ref={workingAreaContainerRef}
          className="relative flex flex-1 min-h-0 flex-col overflow-hidden"
        >
        <div
          ref={workingAreaRef}
          tabIndex={0}
          onKeyDown={handleWorkingAreaKeyDown}
          onContextMenu={handleWorkingAreaContextMenu}
          className="flex-1 overflow-auto p-5 select-text leading-relaxed text-foreground focus:outline-none"
          style={{
            fontFamily: resolvedFontFamily,
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
          }}
        >
          {segments.length === 0 && isEmptyTranscript ? (
            <p className="text-muted-foreground italic">{t('reviewer.emptyTranscript')}</p>
          ) : (
            segments.map((seg, idx) => {
            if (seg.type === 'text') {
              return (
                <span
                  key={`text-${idx}`}
                  data-segment-index={idx}
                  className="whitespace-pre-wrap"
                >
                  {seg.content}
                </span>
              )
            }

            const isUnresolved = !isDiffResolved(seg)
            const proposedValue = getDiffProposedValue(seg)
            const displayText = getWorkingAreaDisplayText(seg)
            const pillVariant = getPillVariant(seg)
            const customValue = seg.customDraft
            const isCustomSelected = seg.selected?.kind === 'custom'
            const isDuplicateReviewer = isDuplicateReviewerInput(seg, customValue)
            const reviewerInputLabel = t('diffResolver.reviewerInput')
            const optionsSummary = [
              ...seg.options.map(
                (option, index) =>
                  `${getPresetOptionLabel(index)}: ${option}`
              ),
              `${reviewerInputLabel}: ${customValue}`,
            ].join(' | ')
            const customShortcutKey = getCustomShortcutKey(seg.options.length)

            return (
              <DropdownMenu
                key={`diff-${seg.id}`}
                open={openDiffId === seg.id}
                onOpenChange={(open) => setOpenDiffId(open ? seg.id : null)}
              >
                <DropdownMenuTrigger asChild>
                  <span
                    role="button"
                    tabIndex={0}
                    ref={(el) => {
                      if (el) {
                        pillRefs.current.set(seg.id, el)
                      } else {
                        pillRefs.current.delete(seg.id)
                      }
                    }}
                    onKeyDown={(e) => handlePillKeyDown(e, seg)}
                    className={cn(
                      'box-decoration-clone rounded-sm border px-0.5 py-0',
                      'whitespace-pre-wrap cursor-pointer select-none',
                      'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                      PILL_VARIANT_CLASSES[pillVariant],
                      seg.isLocal && 'border-dashed'
                    )}
                    style={{ fontFamily: resolvedFontFamily }}
                    title={
                      isUnresolved
                        ? `${optionsSummary} | ${reviewerInputLabel}`
                        : `${t('diffResolver.resolved')}: ${proposedValue}`
                    }
                  >
                    {displayText}
                    <ChevronDown className="inline h-3 w-3 opacity-50 align-baseline ml-0.5" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  avoidCollisions
                  collisionBoundary={menuCollisionBoundary}
                  collisionPadding={8}
                  className="min-w-[260px] max-w-[700px] max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto shadow-lg"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  onKeyDown={(e) => handleMenuKeyDown(e, seg)}
                >
                  {seg.options.map((option, index) => {
                    const isSelected =
                      seg.selected?.kind === 'preset' && seg.selected.index === index
                    const shortcut = index < 9 ? String(index + 1) : undefined

                    return (
                      <DropdownMenuItem
                        key={index}
                        onSelect={(e) => {
                          e.preventDefault()
                          selectPreset(seg.id, index, { keepOpen: true })
                        }}
                        className="flex items-start justify-between gap-4 cursor-pointer py-2 px-3"
                      >
                        <span
                          className="min-w-0 flex-1 text-left whitespace-pre-wrap break-words"
                          style={{ fontFamily: resolvedFontFamily }}
                        >
                          {getPresetOptionLabel(index)}:{' '}
                          {formatDiffDisplay(option)}
                        </span>
                        <div className="flex shrink-0 items-start gap-2 pt-0.5">
                          {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                          {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuItem
                    disabled={isDuplicateReviewer}
                    onSelect={(e) => {
                      e.preventDefault()
                      if (isDuplicateReviewer) return
                      selectCustom(seg, { keepOpen: true, focusInput: true })
                    }}
                    className={cn(
                      'flex items-start justify-between gap-4 py-2 px-3',
                      isDuplicateReviewer
                        ? 'cursor-not-allowed text-muted-foreground opacity-60'
                        : 'cursor-pointer'
                    )}
                  >
                    <span
                      className="min-w-0 flex-1 text-left whitespace-pre-wrap break-words"
                      style={{ fontFamily: resolvedFontFamily }}
                    >
                      {reviewerInputLabel}: {formatDiffDisplay(customValue)}
                    </span>
                    <div className="flex shrink-0 items-start gap-2 pt-0.5">
                      {isCustomSelected && !isDuplicateReviewer && (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                      {customShortcutKey && (
                        <DropdownMenuShortcut>{customShortcutKey}</DropdownMenuShortcut>
                      )}
                    </div>
                  </DropdownMenuItem>
                  <div className="max-w-full border-t border-border px-3 py-2">
                    <Textarea
                      id={`diff-custom-${seg.id}`}
                      ref={(el) => {
                        if (el) {
                          customInputRefs.current.set(seg.id, el)
                        } else {
                          customInputRefs.current.delete(seg.id)
                        }
                      }}
                      value={customValue}
                      onChange={(e) => onUpdateCustomDraft(seg.id, e.target.value)}
                      placeholder={t('diffResolver.customPlaceholder')}
                      rows={2}
                      className={cn(
                        'min-h-8 h-auto max-h-24 w-full resize-y text-sm py-1.5',
                        isDuplicateReviewer &&
                          'border-muted-foreground/40 bg-muted/60 text-muted-foreground'
                      )}
                      style={{ fontFamily: resolvedFontFamily }}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (!isDuplicateReviewerInput(seg, customValue)) {
                            selectCustom(seg)
                          }
                        }
                      }}
                    />
                    {isDuplicateReviewer && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {t('diffResolver.reviewerInputDuplicate')}
                      </p>
                    )}
                  </div>
                  {seg.isLocal && (
                    <>
                      <div className="border-t border-border" />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          onDeleteLocalDiff(seg.id)
                          setOpenDiffId(null)
                        }}
                        className="cursor-pointer py-2 px-3 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('diffResolver.deleteLocalDiff')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })
          )}
        </div>

        {contextMenu && (
          <div
            className="absolute z-50 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-md"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={handleContextMenuEdit}
            >
              {t('diffResolver.editSelection')}
            </button>
          </div>
        )}
        </div>
      </TabsContent>

      <TabsContent
        value="preview"
        className="flex-1 flex flex-col min-h-0 m-0 border-none outline-none overflow-hidden"
      >
        <ReadOnlyTranscriptPanel
          value={previewText}
          placeholder={t('diffResolver.previewPlaceholder')}
          fontFamily={resolvedFontFamily}
          fontSize={fontSize}
        />
      </TabsContent>

      {showReferenceTabs && (
        <>
          <TabsContent
            value="reference1"
            className="flex-1 flex flex-col min-h-0 m-0 border-none outline-none overflow-hidden"
          >
            <AnnotatorReadonlyPanel
              value={referenceTranscript1}
              otherValue={referenceTranscript2 || referenceTranscript3}
              optionIndex={0}
              comparisonTranscript={comparisonTranscript}
              placeholder={t('diffResolver.referencePlaceholder')}
              fontFamily={resolvedFontFamily}
              fontSize={fontSize}
            />
          </TabsContent>

          <TabsContent
            value="reference2"
            className="flex-1 flex flex-col min-h-0 m-0 border-none outline-none overflow-hidden"
          >
            <AnnotatorReadonlyPanel
              value={referenceTranscript2}
              otherValue={referenceTranscript1}
              optionIndex={1}
              comparisonTranscript={comparisonTranscript}
              placeholder={t('diffResolver.referencePlaceholder')}
              fontFamily={resolvedFontFamily}
              fontSize={fontSize}
            />
          </TabsContent>

          {referenceTranscript3 && (
            <TabsContent
              value="reference3"
              className="flex-1 flex flex-col min-h-0 m-0 border-none outline-none overflow-hidden"
            >
              <AnnotatorReadonlyPanel
                value={referenceTranscript3}
                otherValue={referenceTranscript1}
                optionIndex={2}
                comparisonTranscript={comparisonTranscript}
                placeholder={t('diffResolver.referencePlaceholder')}
                fontFamily={resolvedFontFamily}
                fontSize={fontSize}
              />
            </TabsContent>
          )}
        </>
      )}

      {showReviewerTranscriptTab && (
        <TabsContent
          value="reviewerTranscript"
          className="flex-1 flex flex-col min-h-0 m-0 border-none outline-none overflow-hidden"
        >
          <AnnotatorReadonlyPanel
            value={reviewerTranscript}
            comparisonTranscript={comparisonTranscript}
            highlightMode="act-reviewer"
            placeholder={t('diffResolver.referencePlaceholder')}
            fontFamily={resolvedFontFamily}
            fontSize={fontSize}
          />
        </TabsContent>
      )}
    </Tabs>
  )
})
