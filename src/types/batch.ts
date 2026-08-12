// Batch from list endpoint
export interface Batch {
  id: string
  name: string
  created: string
  group_id: string
  group_name: string
}

// Individual task from batch export endpoint
export type BatchExportTask = {
  file_number: string
  image_url: string
  orientation: 'landscape' | 'portrait'
  state: BatchTaskState
  final_transcript: string | null
}

// Response from batch export endpoint
export type BatchExportResponse = {
  batch_name: string
  tasks: BatchExportTask[]
}

// Task state for batch task view
export type BatchTaskState =
  | 'pending'
  | 'annotated_a'
  | 'annotated_b'
  | 'annotated'
  | 'reviewed'
  | 'trashed'

// Individual task from batch tasks endpoint
export interface BatchTask {
  task_id: string
  task_name: string
  task_url: string
  task_transcript: string
  state: BatchTaskState
  orientation?: 'landscape' | 'portrait'
  /** @deprecated ITV2 uses slot-specific username fields below */
  username?: string | null
  annotator_a_username?: string | null
  annotator_b_username?: string | null
  annotator_c_username?: string | null
  /** Single ITv3 reviewer username (API may still send as reviewer_a_username). */
  reviewer_a_username?: string | null
  trashed_by?: string | null
  annotation_a_rejection_count?: number
  annotation_b_rejection_count?: number
  annotation_c_rejection_count?: number
  review_a_rejection_count?: number
}

// Task returned from application-wide task search
export interface BatchTaskSearchResult {
  task_id: string
  task_name: string
  task_url: string
  orientation?: 'landscape' | 'portrait'
  state: BatchTaskState
  annotator_a_username?: string | null
  annotator_b_username?: string | null
  annotator_c_username?: string | null
  reviewer_a_username?: string | null
  trashed_by?: string | null
  batch_id: string
  batch_name: string
  initial_transcript: string | null
  annotation_transcript_order_1: string | null
  annotation_transcript_order_2: string | null
  annotation_transcript_order_3: string | null
  reviewed_transcript_order_1: string | null
  annotation_a_rejection_count?: number
  annotation_b_rejection_count?: number
  annotation_c_rejection_count?: number
  review_a_rejection_count?: number
}

export type BatchTaskParticipantRole =
  | 'annotator_a'
  | 'annotator_b'
  | 'annotator_c'
  | 'reviewer'

export const BATCH_TASK_PARTICIPANT_ROLE_LABEL_KEYS = {
  annotator_a: 'annotator1',
  annotator_b: 'annotator2',
  annotator_c: 'annotator3',
  reviewer: 'reviewer',
} as const satisfies Record<
  BatchTaskParticipantRole,
  'annotator1' | 'annotator2' | 'annotator3' | 'reviewer'
>

const PARTICIPANT_TRANSCRIPT_PRIORITY: BatchTaskParticipantRole[] = [
  'reviewer',
  'annotator_c',
  'annotator_b',
  'annotator_a',
]

/** Returns the transcript submitted by a specific participant role. */
export function getBatchTaskSearchParticipantTranscript(
  task: BatchTaskSearchResult,
  role: BatchTaskParticipantRole
): string | null {
  const transcriptByRole: Record<BatchTaskParticipantRole, string | null> = {
    annotator_a: task.annotation_transcript_order_1,
    annotator_b: task.annotation_transcript_order_2,
    annotator_c: task.annotation_transcript_order_3,
    reviewer: task.reviewed_transcript_order_1,
  }

  const value = transcriptByRole[role]?.trim()
  return value || null
}

/** Returns the most progressed participant role that has a transcript. */
export function getDefaultBatchTaskSearchParticipantRole(
  task: BatchTaskSearchResult
): BatchTaskParticipantRole | null {
  for (const role of PARTICIPANT_TRANSCRIPT_PRIORITY) {
    if (getBatchTaskSearchParticipantTranscript(task, role)) {
      return role
    }
  }

  return null
}

/** Returns the most progressed transcript available for a search result. */
export function getBatchTaskSearchTranscript(
  task: BatchTaskSearchResult
): string | null {
  const defaultRole = getDefaultBatchTaskSearchParticipantRole(task)
  if (defaultRole) {
    return getBatchTaskSearchParticipantTranscript(task, defaultRole)
  }

  return task.initial_transcript?.trim() || null
}

// Per-state task counts returned by the report endpoints
export type BatchStateCounts = Record<BatchTaskState, number>

// Batch with stats from report endpoint
export interface BatchReport extends Omit<Batch, 'group_name'>, BatchStateCounts {
  total_tasks: number
}

/** Per-group rollup from GET /batch/application/{app}/reports (`id` = group name). */
export type ApplicationBatchReport = {
  id: string
  name: string
  created: string
  group_id: string
  total_tasks: number
} & BatchStateCounts

// Individual task in upload JSON
export interface BatchUploadTask {
  name: string
  url: string
  transcript?: string | null
  orientation?: 'landscape' | 'portrait' | null
}

// Request payload for batch upload
export interface BatchUploadRequest {
  batch_name: string
  group_id: string
  tasks: BatchUploadTask[]
}

// Stats configuration for display
export const BATCH_STATS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-slate-100 text-slate-700',
    barColor: 'bg-slate-200',
    textColor: 'text-slate-700',
    order: 0,
  },
  annotated_a: {
    label: 'Annotated A',
    color: 'bg-sky-100 text-sky-700',
    barColor: 'bg-sky-300',
    textColor: 'text-sky-900',
    order: 1,
  },
  annotated_b: {
    label: 'Annotated B',
    color: 'bg-blue-100 text-blue-700',
    barColor: 'bg-blue-400',
    textColor: 'text-white',
    order: 2,
  },
  annotated: {
    label: 'Annotated',
    color: 'bg-indigo-100 text-indigo-700',
    barColor: 'bg-indigo-500',
    textColor: 'text-white',
    order: 3,
  },
  reviewed: {
    label: 'Reviewed',
    color: 'bg-emerald-100 text-emerald-700',
    barColor: 'bg-emerald-500',
    textColor: 'text-white',
    order: 4,
  },
  trashed: {
    label: 'Trashed',
    color: 'bg-red-100 text-red-700',
    barColor: 'bg-rose-500',
    textColor: 'text-white',
    order: 5,
    isHatched: true,
  },
} as const satisfies Record<BatchTaskState, unknown>

export type BatchStatKey = keyof typeof BATCH_STATS_CONFIG

// Workflow statuses (excluding trashed)
export const WORKFLOW_STATS: BatchStatKey[] = [
  'pending',
  'annotated_a',
  'annotated_b',
  'annotated',
  'reviewed',
]

