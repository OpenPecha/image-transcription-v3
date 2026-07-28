import {
  isAnnotatorATaskState,
  isAnnotatorBTaskState,
  isAnnotatorCTaskState,
  isReviewerATaskState,
  isReviewerBTaskState,
  isTaskAtOrPastFinalReview,
  type AssignedTask,
  type RejectionCommentRecord,
  type RejectionHistoryEntry,
  type RejectionHistoryTarget,
  type TaskRejectionComments,
} from '@/types'
import { rejectionCount } from '@/lib/rejection-counts'
import {
  isAnnotatorRole,
  isFinalReviewerRole,
  isReviewerRole,
} from '@/features/workspace/workspace-role-config'
import { normalizeUserRole } from '@/types'

export type RejectionHistoryTargetLabelKey =
  | 'rejectionHistory.target.annotatorA'
  | 'rejectionHistory.target.annotatorB'
  | 'rejectionHistory.target.annotatorC'
  | 'rejectionHistory.target.reviewerA'
  | 'rejectionHistory.target.reviewerB'

const TARGET_LABEL_KEY: Record<RejectionHistoryTarget, RejectionHistoryTargetLabelKey> = {
  annotator_a: 'rejectionHistory.target.annotatorA',
  annotator_b: 'rejectionHistory.target.annotatorB',
  annotator_c: 'rejectionHistory.target.annotatorC',
  reviewer_a: 'rejectionHistory.target.reviewerA',
  reviewer_b: 'rejectionHistory.target.reviewerB',
}

export function getRejectionHistoryTargetLabelKey(
  target: RejectionHistoryTarget
): RejectionHistoryTargetLabelKey {
  return TARGET_LABEL_KEY[target]
}

const TARGET_SORT_ORDER: RejectionHistoryTarget[] = [
  'annotator_a',
  'annotator_b',
  'annotator_c',
  'reviewer_a',
  'reviewer_b',
]

function sortTargets(targets: RejectionHistoryTarget[]): RejectionHistoryTarget[] {
  return [...targets].sort(
    (a, b) => TARGET_SORT_ORDER.indexOf(a) - TARGET_SORT_ORDER.indexOf(b)
  )
}

function sortEntriesNewestFirst(entries: RejectionHistoryEntry[]): RejectionHistoryEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  )
}

function recordsToEntries(
  records: RejectionCommentRecord[] | undefined,
  target: RejectionHistoryTarget
): RejectionHistoryEntry[] {
  if (!records?.length) return []

  return sortEntriesNewestFirst(
    records
      .filter((record) => record.comment.trim().length > 0)
      .map((record) => ({
        created: record.created,
        targets: [target],
        comments: [record.comment],
      }))
  )
}

/** Merge same-timestamp rejections (e.g. reject both) into one timeline row. */
function mergeTimeline(entries: RejectionHistoryEntry[]): RejectionHistoryEntry[] {
  const grouped = new Map<string, RejectionHistoryEntry>()

  for (const entry of entries) {
    const existing = grouped.get(entry.created)

    if (!existing) {
      grouped.set(entry.created, {
        created: entry.created,
        targets: [...entry.targets],
        comments: [...entry.comments],
      })
      continue
    }

    for (const target of entry.targets) {
      if (!existing.targets.includes(target)) {
        existing.targets.push(target)
      }
    }

    for (const comment of entry.comments) {
      const trimmed = comment.trim()
      if (trimmed && !existing.comments.some((item) => item.trim() === trimmed)) {
        existing.comments.push(comment)
      }
    }
  }

  return sortEntriesNewestFirst(
    Array.from(grouped.values()).map((entry) => ({
      ...entry,
      targets: sortTargets(entry.targets),
    }))
  )
}

function slotEntries(
  task: TaskRejectionComments,
  slot: 'A' | 'B' | 'C',
  target: RejectionHistoryTarget
): RejectionHistoryEntry[] {
  const records = slot === 'A' ? task.comment_A : slot === 'B' ? task.comment_B : task.comment_C
  return recordsToEntries(records, target)
}

function getAnnotatorVisibleEntries(
  task: AssignedTask
): RejectionHistoryEntry[] {
  if (isTaskAtOrPastFinalReview(task.state)) return []

  if (isAnnotatorATaskState(task.state)) {
    return slotEntries(task, 'A', 'annotator_a')
  }

  if (isAnnotatorBTaskState(task.state)) {
    return slotEntries(task, 'B', 'annotator_b')
  }

  if (isAnnotatorCTaskState(task.state)) {
    return slotEntries(task, 'C', 'annotator_c')
  }

  return []
}

function getReviewerVisibleEntries(task: AssignedTask): RejectionHistoryEntry[] {
  const isReviewerA = isReviewerATaskState(task.state)
  const isReviewerB = isReviewerBTaskState(task.state)
  if (!isReviewerA && !isReviewerB) return []

  const returnedToReviewer = rejectionCount(task.rejection_count) > 0

  if (returnedToReviewer || isTaskAtOrPastFinalReview(task.state)) {
    return isReviewerA
      ? slotEntries(task, 'A', 'reviewer_a')
      : slotEntries(task, 'B', 'reviewer_b')
  }

  return mergeTimeline([
    ...slotEntries(task, 'A', 'annotator_a'),
    ...slotEntries(task, 'B', 'annotator_b'),
    ...slotEntries(task, 'C', 'annotator_c'),
  ])
}

function getFinalReviewerVisibleEntries(task: AssignedTask): RejectionHistoryEntry[] {
  if (task.state !== 'finalising') return []

  return mergeTimeline([
    ...slotEntries(task, 'A', 'reviewer_a'),
    ...slotEntries(task, 'B', 'reviewer_b'),
  ])
}

/** Visible rejection history for the current assignee, newest first. */
export function getVisibleRejectionHistory(
  task: AssignedTask,
  role: string | undefined
): RejectionHistoryEntry[] {
  const normalized = normalizeUserRole(role)

  if (isAnnotatorRole(normalized)) {
    return mergeTimeline(getAnnotatorVisibleEntries(task))
  }

  if (isReviewerRole(normalized)) {
    return getReviewerVisibleEntries(task)
  }

  if (isFinalReviewerRole(normalized)) {
    return getFinalReviewerVisibleEntries(task)
  }

  return []
}

export function hasVisibleRejectionHistory(
  task: AssignedTask,
  role: string | undefined
): boolean {
  return getVisibleRejectionHistory(task, role).length > 0
}

/** Hide slot label when the viewer is reading feedback on their own work. */
export function shouldShowRejectionTargetLabel(
  task: AssignedTask,
  role: string | undefined,
  target: RejectionHistoryTarget
): boolean {
  const normalized = normalizeUserRole(role)

  if (isAnnotatorRole(normalized)) {
    if (isAnnotatorATaskState(task.state) && target === 'annotator_a') return false
    if (isAnnotatorBTaskState(task.state) && target === 'annotator_b') return false
    if (isAnnotatorCTaskState(task.state) && target === 'annotator_c') return false
    return true
  }

  if (isReviewerRole(normalized)) {
    const returnedToReviewer = rejectionCount(task.rejection_count) > 0
    const viewingOwnReviewerFeedback =
      returnedToReviewer || isTaskAtOrPastFinalReview(task.state)

    if (viewingOwnReviewerFeedback) {
      if (isReviewerATaskState(task.state) && target === 'reviewer_a') return false
      if (isReviewerBTaskState(task.state) && target === 'reviewer_b') return false
    }

    return true
  }

  return true
}
