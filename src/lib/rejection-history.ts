import {
  isAnnotatorATaskState,
  isAnnotatorBTaskState,
  isAnnotatorCTaskState,
  isReviewerTaskState,
  type AssignedTask,
  type RejectionCommentRecord,
  type RejectionHistoryEntry,
  type RejectionHistoryTarget,
  type TaskRejectionComments,
} from '@/types'
import {
  isAnnotatorRole,
  isReviewerRole,
} from '@/features/workspace/workspace-role-config'
import { normalizeUserRole } from '@/types'

export type RejectionHistoryTargetLabelKey =
  | 'rejectionHistory.target.annotatorA'
  | 'rejectionHistory.target.annotatorB'
  | 'rejectionHistory.target.annotatorC'

const TARGET_LABEL_KEY: Record<RejectionHistoryTarget, RejectionHistoryTargetLabelKey> = {
  annotator_a: 'rejectionHistory.target.annotatorA',
  annotator_b: 'rejectionHistory.target.annotatorB',
  annotator_c: 'rejectionHistory.target.annotatorC',
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

/** Merge same-timestamp rejections (e.g. reject both/all) into one timeline row. */
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

function getAnnotatorVisibleEntries(task: AssignedTask): RejectionHistoryEntry[] {
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
  if (!isReviewerTaskState(task.state)) return []

  return mergeTimeline([
    ...slotEntries(task, 'A', 'annotator_a'),
    ...slotEntries(task, 'B', 'annotator_b'),
    ...slotEntries(task, 'C', 'annotator_c'),
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
  }

  return true
}
