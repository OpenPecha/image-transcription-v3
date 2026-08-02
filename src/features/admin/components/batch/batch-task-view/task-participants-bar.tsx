import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getParticipantRejectionCount, type TaskRejectionCounts } from '@/lib/rejection-counts'
import type { BatchTask, BatchTaskParticipantRole } from '@/types'

type TaskParticipantInfo = Pick<
  BatchTask,
  | 'state'
  | 'trashed_by'
  | 'annotator_a_username'
  | 'annotator_b_username'
  | 'annotator_c_username'
  | 'reviewer_a_username'
> &
  TaskRejectionCounts

type ParticipantSlot = {
  label: string
  value: string
  role: BatchTaskParticipantRole
  rejectionCount?: number
}

type ParticipantRows = {
  row1: ParticipantSlot[]
  row2: ParticipantSlot[]
  row3: ParticipantSlot[]
}

function hasParticipantName(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function buildParticipantRows(
  task: TaskParticipantInfo,
  labels: { annotator1: string; annotator2: string; annotator3: string; reviewer: string }
): ParticipantRows | null {
  const slotRejection = (role: BatchTaskParticipantRole) =>
    getParticipantRejectionCount(task, role)

  const row1: ParticipantSlot[] = []
  const row2: ParticipantSlot[] = []
  const row3: ParticipantSlot[] = []

  if (hasParticipantName(task.annotator_a_username)) {
    row1.push({
      label: labels.annotator1,
      value: task.annotator_a_username,
      role: 'annotator_a',
      rejectionCount: slotRejection('annotator_a'),
    })
  }
  if (hasParticipantName(task.reviewer_a_username)) {
    row1.push({
      label: labels.reviewer,
      value: task.reviewer_a_username,
      role: 'reviewer',
      rejectionCount: slotRejection('reviewer'),
    })
  }
  if (hasParticipantName(task.annotator_b_username)) {
    row2.push({
      label: labels.annotator2,
      value: task.annotator_b_username,
      role: 'annotator_b',
      rejectionCount: slotRejection('annotator_b'),
    })
  }
  if (hasParticipantName(task.annotator_c_username)) {
    row3.push({
      label: labels.annotator3,
      value: task.annotator_c_username,
      role: 'annotator_c',
      rejectionCount: slotRejection('annotator_c'),
    })
  }

  if (row1.length === 0 && row2.length === 0 && row3.length === 0) return null
  return { row1, row2, row3 }
}

type ParticipantCellProps = ParticipantSlot & {
  isSelected?: boolean
  isInteractive?: boolean
  hasTranscript?: boolean
  onSelect?: () => void
}

function ParticipantCell({
  label,
  value,
  rejectionCount,
  isSelected,
  isInteractive,
  hasTranscript,
  onSelect,
}: ParticipantCellProps) {
  const content = (
    <>
      <div className="flex items-center gap-1.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        {rejectionCount !== undefined && rejectionCount > 0 && (
          <span className="text-xs font-semibold tabular-nums text-[rgb(255,1,1)]">
            {rejectionCount}
          </span>
        )}
      </div>
      <p
        className={cn(
          'truncate text-sm font-medium',
          hasTranscript === false ? 'text-muted-foreground' : 'text-foreground'
        )}
      >
        {value}
      </p>
    </>
  )

  if (!isInteractive || !onSelect) {
    return <div className="min-w-0">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!hasTranscript}
      className={cn(
        'min-w-0 rounded-md px-2 py-1 text-left transition-colors',
        hasTranscript && 'cursor-pointer hover:bg-accent',
        !hasTranscript && 'cursor-default opacity-60',
        isSelected && hasTranscript && 'bg-accent ring-1 ring-ring'
      )}
    >
      {content}
    </button>
  )
}

type ParticipantRowProps = {
  slots: ParticipantSlot[]
  selectedRole?: BatchTaskParticipantRole | null
  isInteractive?: boolean
  getTranscriptForRole?: (role: BatchTaskParticipantRole) => string | null
  onSelectRole?: (role: BatchTaskParticipantRole) => void
}

function ParticipantRow({
  slots,
  selectedRole,
  isInteractive,
  getTranscriptForRole,
  onSelectRole,
}: ParticipantRowProps) {
  if (slots.length === 0) return null

  return (
    <div className="grid grid-cols-3 gap-x-6 gap-y-1">
      {slots.map((slot) => {
        const hasTranscript = getTranscriptForRole
          ? Boolean(getTranscriptForRole(slot.role))
          : undefined

        return (
          <ParticipantCell
            key={slot.role}
            label={slot.label}
            value={slot.value}
            role={slot.role}
            rejectionCount={slot.rejectionCount}
            isSelected={selectedRole === slot.role}
            isInteractive={isInteractive}
            hasTranscript={hasTranscript}
            onSelect={
              onSelectRole && hasTranscript
                ? () => onSelectRole(slot.role)
                : undefined
            }
          />
        )
      })}
    </div>
  )
}

type TaskParticipantsBarProps = {
  task: TaskParticipantInfo
  selectedRole?: BatchTaskParticipantRole | null
  onSelectRole?: (role: BatchTaskParticipantRole) => void
  getTranscriptForRole?: (role: BatchTaskParticipantRole) => string | null
}

export function TaskParticipantsBar({
  task,
  selectedRole,
  onSelectRole,
  getTranscriptForRole,
}: TaskParticipantsBarProps) {
  const { t } = useTranslation('admin')
  const isInteractive = Boolean(onSelectRole && getTranscriptForRole)

  if (task.state === 'trashed') {
    if (!hasParticipantName(task.trashed_by)) return null

    return (
      <div className="flex-shrink-0 border-t border-border bg-muted/30 px-4 py-2.5">
        <p className="text-sm">
          <span className="text-muted-foreground">{t('batches.trashedBy')}: </span>
          <span className="font-medium text-foreground">{task.trashed_by}</span>
        </p>
      </div>
    )
  }

  const rows = buildParticipantRows(task, {
    annotator1: t('batches.participants.annotator1'),
    annotator2: t('batches.participants.annotator2'),
    annotator3: t('batches.participants.annotator3'),
    reviewer: t('batches.participants.reviewer'),
  })

  if (!rows) return null

  return (
    <div className="flex-shrink-0 space-y-2 border-t border-border bg-muted/30 px-4 py-2.5">
      {isInteractive && (
        <p className="text-xs text-muted-foreground">
          {t('batches.selectParticipantToViewWork')}
        </p>
      )}
      <ParticipantRow
        slots={rows.row1}
        selectedRole={selectedRole}
        isInteractive={isInteractive}
        getTranscriptForRole={getTranscriptForRole}
        onSelectRole={onSelectRole}
      />
      <ParticipantRow
        slots={rows.row2}
        selectedRole={selectedRole}
        isInteractive={isInteractive}
        getTranscriptForRole={getTranscriptForRole}
        onSelectRole={onSelectRole}
      />
      <ParticipantRow
        slots={rows.row3}
        selectedRole={selectedRole}
        isInteractive={isInteractive}
        getTranscriptForRole={getTranscriptForRole}
        onSelectRole={onSelectRole}
      />
    </div>
  )
}
