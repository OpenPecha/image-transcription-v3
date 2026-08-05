import type { BatchTaskParticipantRole } from '@/types/batch'
import { normalizeUserRole, UserRole } from '@/types/user'

/** Rejection count fields shared by assign and batch task responses. */
export interface TaskRejectionCounts {
  rejection_count?: number
  annotation_a_rejection_count?: number
  annotation_b_rejection_count?: number
  annotation_c_rejection_count?: number
  review_a_rejection_count?: number
  review_b_rejection_count?: number
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
  reviewer_a: 'review_a_rejection_count',
  reviewer_b: 'review_b_rejection_count',
  final_reviewer: null,
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

export interface WorkspaceRejectionUpstreamItem {
  labelKey: 'diffResolver.annotator1' | 'diffResolver.annotator2' | 'diffResolver.annotator3' | 'diffResolver.reviewer1' | 'diffResolver.reviewer2'
  count: number
}

export interface WorkspaceRejectionDisplay {
  returnedCount?: number
  upstream: WorkspaceRejectionUpstreamItem[]
}

/** Role-scoped rejection summary for the workspace sidebar. */
export function getWorkspaceRejectionDisplay(
  task: TaskRejectionCounts,
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
        { labelKey: 'diffResolver.annotator1' as const, count: task.annotation_a_rejection_count },
        { labelKey: 'diffResolver.annotator2' as const, count: task.annotation_b_rejection_count },
        { labelKey: 'diffResolver.annotator3' as const, count: task.annotation_c_rejection_count },
      ] satisfies Array<{ labelKey: WorkspaceRejectionUpstreamItem['labelKey']; count: number | undefined }>
    )
      .map((item) => ({ ...item, count: rejectionCount(item.count) }))
      .filter((item) => item.count > 0)

    if (returned <= 0 && upstream.length === 0) return null
    return {
      returnedCount: returned > 0 ? returned : undefined,
      upstream,
    }
  }

  if (normalized === UserRole.FinalReviewer) {
    const upstream: WorkspaceRejectionUpstreamItem[] = (
      [
        { labelKey: 'diffResolver.reviewer1' as const, count: task.review_a_rejection_count },
        { labelKey: 'diffResolver.reviewer2' as const, count: task.review_b_rejection_count },
      ] satisfies Array<{ labelKey: WorkspaceRejectionUpstreamItem['labelKey']; count: number | undefined }>
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
