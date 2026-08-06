import type { BatchTaskParticipantRole } from '@/types/batch'
import type { RejectionCommentRecord } from '@/types/task'
import { normalizeUserRole, UserRole } from '@/types/user'

/** Rejection count fields shared by assign and batch task responses. */
export type TaskRejectionCounts = {
  rejection_count?: number
  annotation_a_rejection_count?: number
  annotation_b_rejection_count?: number
  annotation_c_rejection_count?: number
  review_a_rejection_count?: number
  review_b_rejection_count?: number
}

/** Assign payload may include comment arrays instead of per-slot counts. */
export type WorkspaceRejectionSource = TaskRejectionCounts & {
  comment_A?: RejectionCommentRecord[]
  comment_B?: RejectionCommentRecord[]
  comment_C?: RejectionCommentRecord[]
}

export function rejectionCount(value: number | null | undefined): number {
  return typeof value === 'number' && value >= 0 ? value : 0
}

const SLOT_REJECTION_FIELD: Record<
  BatchTaskParticipantRole,
  keyof TaskRejectionCounts | null
> = {
  annotator_a: 'annotation_a_rejection_count',
  annotator_b: 'annotation_b_rejection_count',
  annotator_c: 'annotation_c_rejection_count',
  reviewer: 'review_a_rejection_count',
}

/** Per-participant rejection count for admin batch views (undefined when not applicable). */
export function getParticipantRejectionCount(
  task: TaskRejectionCounts,
  role: BatchTaskParticipantRole
): number | undefined {
  const field = SLOT_REJECTION_FIELD[role]
  if (!field || task[field] === undefined) return undefined
  return rejectionCount(task[field])
}

export type WorkspaceRejectionUpstreamItem = {
  labelKey: 'diffResolver.annotator1' | 'diffResolver.annotator2' | 'diffResolver.annotator3'
  count: number
}

export type WorkspaceRejectionDisplay = {
  returnedCount?: number
  upstream: WorkspaceRejectionUpstreamItem[]
}

function commentLength(records: RejectionCommentRecord[] | undefined): number {
  return records?.filter((record) => record.comment.trim().length > 0).length ?? 0
}

/** Role-scoped rejection summary for the workspace sidebar. */
export function getWorkspaceRejectionDisplay(
  task: WorkspaceRejectionSource,
  role: string | undefined
): WorkspaceRejectionDisplay | null {
  const normalized = normalizeUserRole(role)
  const returned = rejectionCount(task.rejection_count)

  if (normalized === UserRole.Annotator) {
    if (returned <= 0) return null
    return { returnedCount: returned, upstream: [] }
  }

  if (normalized === UserRole.Reviewer) {
    const upstream: WorkspaceRejectionUpstreamItem[] = (
      [
        {
          labelKey: 'diffResolver.annotator1' as const,
          count:
            task.annotation_a_rejection_count ?? commentLength(task.comment_A),
        },
        {
          labelKey: 'diffResolver.annotator2' as const,
          count:
            task.annotation_b_rejection_count ?? commentLength(task.comment_B),
        },
        {
          labelKey: 'diffResolver.annotator3' as const,
          count:
            task.annotation_c_rejection_count ?? commentLength(task.comment_C),
        },
      ] satisfies Array<{
        labelKey: WorkspaceRejectionUpstreamItem['labelKey']
        count: number | undefined
      }>
    )
      .map((item) => ({ ...item, count: rejectionCount(item.count) }))
      .filter((item) => item.count > 0)

    if (returned <= 0 && upstream.length === 0) return null
    return {
      returnedCount: returned > 0 ? returned : undefined,
      upstream,
    }
  }

  return null
}
