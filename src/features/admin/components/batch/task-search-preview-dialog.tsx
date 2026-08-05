import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { TaskFileName } from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ADMIN_FEATURE_AVAILABILITY } from '@/features/admin/lib/admin-feature-availability'
import { ImageCanvas } from '@/features/workspace/components/image-canvas'
import { cn } from '@/lib/utils'
import {
  BATCH_STATS_CONFIG,
  BATCH_TASK_PARTICIPANT_ROLE_LABEL_KEYS,
  getBatchTaskSearchParticipantTranscript,
  getDefaultBatchTaskSearchParticipantRole,
  type BatchTaskParticipantRole,
  type BatchTaskSearchResult,
  type BatchTaskState,
} from '@/types'
import { TaskParticipantsBar } from './batch-task-view/task-participants-bar'

interface TaskSearchPreviewDialogProps {
  task: BatchTaskSearchResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskSearchPreviewDialog({
  task,
  open,
  onOpenChange,
}: TaskSearchPreviewDialogProps) {
  const { t } = useTranslation('admin')
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<BatchTaskParticipantRole | null>(
    null
  )

  useEffect(() => {
    if (!task) {
      setSelectedRole(null)
      return
    }

    setSelectedRole(getDefaultBatchTaskSearchParticipantRole(task))
  }, [task?.task_id])

  if (!task) return null

  const stateConfig = BATCH_STATS_CONFIG[task.state as BatchTaskState]
  const transcript = selectedRole
    ? getBatchTaskSearchParticipantTranscript(task, selectedRole)
    : null
  const transcriptLabel = selectedRole
    ? t('batches.participantTranscript', {
        role: t(
          `batches.participants.${BATCH_TASK_PARTICIPANT_ROLE_LABEL_KEYS[selectedRole]}`
        ),
      })
    : t('batches.transcript')

  const handleOpenInBatch = () => {
    if (!task.batch_id) return

    onOpenChange(false)
    navigate(`/admin/batch/${task.batch_id}?task_id=${task.task_id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-3 border-b border-border px-6 py-4">
          <div className="flex items-start justify-between gap-3 pr-8">
            <DialogTitle className="sr-only">{t('batches.taskPreview')}</DialogTitle>
            <TaskFileName
              fileName={task.task_name}
              className="flex-1 min-w-0"
              textClassName="text-base font-semibold text-foreground"
              expanded
              showExpandToggle={false}
              enableContextMenu
            />
            <Badge
              className={cn(
                'shrink-0 text-[10px] px-2 py-0.5',
                stateConfig?.color || 'bg-muted text-muted-foreground'
              )}
            >
              {stateConfig?.label || task.state}
            </Badge>
          </div>
          {task.batch_name && (
            <p className="text-sm text-muted-foreground">
              {task.batch_name}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="h-64 border-b border-border bg-muted/30">
            <ImageCanvas imageUrl={task.task_url} />
          </div>

          <TaskParticipantsBar
            task={task}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            getTranscriptForRole={(role) =>
              getBatchTaskSearchParticipantTranscript(task, role)
            }
          />

          <div className="border-b border-border bg-sky-50/50 p-4 dark:bg-sky-950/20">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {transcriptLabel}
            </h4>
            <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-background p-3">
              <p
                className="whitespace-pre-wrap text-sm leading-relaxed"
                style={{
                  fontFamily: 'Monlam',
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                }}
              >
                {transcript || (
                  <span className="italic text-muted-foreground">
                    {t('batches.noWorkSubmitted')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {task.batch_id && ADMIN_FEATURE_AVAILABILITY.batchTaskListing && (
          <div className="flex justify-end border-t border-border bg-card px-6 py-3">
            <Button variant="outline" size="sm" onClick={handleOpenInBatch}>
              {t('batches.openInBatch')}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
