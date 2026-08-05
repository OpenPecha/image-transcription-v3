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
  | 'half_annotated'
  | 'annotated'
  | 'half_reviewed'
  | 'reviewed'
  | 'finalised'
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
  reviewer_a_username?: string | null
  reviewer_b_username?: string | null
  final_reviewer_username?: string | null
  trashed_by?: string | null
  annotation_a_rejection_count?: number
  annotation_b_rejection_count?: number
  annotation_c_rejection_count?: number
  review_a_rejection_count?: number
  review_b_rejection_count?: number
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
  reviewer_b_username?: string | null
  final_reviewer_username?: string | null
  trashed_by?: string | null
  batch_id: string
  batch_name: string
  initial_transcript: string | null
  annotation_transcript_order_1: string | null
  annotation_transcript_order_2: string | null
  annotation_transcript_order_3: string | null
  reviewed_transcript_order_1: string | null
  reviewed_transcript_order_2: string | null
  finalised_transcript: string | null
  annotation_a_rejection_count?: number
  annotation_b_rejection_count?: number
  annotation_c_rejection_count?: number
  review_a_rejection_count?: number
  review_b_rejection_count?: number
}

export type BatchTaskParticipantRole =
  | 'annotator_a'
  | 'annotator_b'
  | 'annotator_c'
  | 'reviewer_a'
  | 'reviewer_b'
  | 'final_reviewer'

export const BATCH_TASK_PARTICIPANT_ROLE_LABEL_KEYS = {
  annotator_a: 'annotator1',
  annotator_b: 'annotator2',
  annotator_c: 'annotator3',
  reviewer_a: 'reviewer1',
  reviewer_b: 'reviewer2',
  final_reviewer: 'finalReviewer',
} as const satisfies Record<
  BatchTaskParticipantRole,
  'annotator1' | 'annotator2' | 'annotator3' | 'reviewer1' | 'reviewer2' | 'finalReviewer'
>

const PARTICIPANT_TRANSCRIPT_PRIORITY: BatchTaskParticipantRole[] = [
  'final_reviewer',
  'reviewer_b',
  'reviewer_a',
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
    reviewer_a: task.reviewed_transcript_order_1,
    reviewer_b: task.reviewed_transcript_order_2,
    final_reviewer: task.finalised_transcript,
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

// Batch with stats from report endpoint
export interface BatchReport extends Batch {
  total_tasks: number
  pending: number
  half_annotated: number
  annotated: number
  half_reviewed: number
  reviewed: number
  finalised: number
  trashed: number
}

export type ApplicationBatchReport = {
  id: string
  name: string
  created: string
  group_id: string
  total_tasks: number
  pending: number
  half_annotated: number
  annotated: number
  half_reviewed: number
  reviewed: number
  finalised: number
  trashed: number
}

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
  half_annotated: {
    label: 'Half Annotated',
    color: 'bg-sky-100 text-sky-700',
    barColor: 'bg-sky-300',
    textColor: 'text-sky-900',
    order: 1,
  },
  annotated: {
    label: 'Annotated',
    color: 'bg-blue-100 text-blue-700',
    barColor: 'bg-indigo-500',
    textColor: 'text-white',
    order: 2,
  },
  half_reviewed: {
    label: 'Half Reviewed',
    color: 'bg-amber-50 text-amber-700',
    barColor: 'bg-amber-200',
    textColor: 'text-amber-900',
    order: 3,
  },
  reviewed: {
    label: 'Reviewed',
    color: 'bg-amber-100 text-amber-700',
    barColor: 'bg-cyan-500',
    textColor: 'text-white',
    order: 4,
  },
  finalised: {
    label: 'Finalised',
    color: 'bg-emerald-100 text-emerald-700',
    barColor: 'bg-emerald-500',
    textColor: 'text-white',
    order: 5,
  },
  trashed: {
    label: 'Trashed',
    color: 'bg-red-100 text-red-700',
    barColor: 'bg-rose-500',
    textColor: 'text-white',
    order: 6,
    isHatched: true,
  },
} as const

export type BatchStatKey = keyof typeof BATCH_STATS_CONFIG

// Workflow statuses (excluding trashed)
export const WORKFLOW_STATS: BatchStatKey[] = [
  'pending',
  'half_annotated',
  'annotated',
  'half_reviewed',
  'reviewed',
  'finalised',
]

