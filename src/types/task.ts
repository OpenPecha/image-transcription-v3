// Task status following the state machine
export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  AwaitingReview = 'awaiting_review',
  InReview = 'in_review',
  AwaitingFinalReview = 'awaiting_final_review',
  FinalReview = 'final_review',
  Completed = 'completed',
  Rejected = 'rejected',
}

// Actions that can be recorded in task history
export enum TaskAction {
  Created = 'created',
  Assigned = 'assigned',
  Started = 'started',
  Submitted = 'submitted',
  ClaimedForReview = 'claimed_for_review',
  Approved = 'approved',
  Rejected = 'rejected',
  ClaimedForFinalReview = 'claimed_for_final_review',
  FinalApproved = 'final_approved',
  FinalRejected = 'final_rejected',
  Reassigned = 'reassigned',
  TextUpdated = 'text_updated',
}

// Task history entry for audit trail
export interface TaskHistoryEntry {
  id: string
  action: TaskAction
  userId: string
  userName: string
  timestamp: Date
  comment?: string
  previousStatus?: TaskStatus
  newStatus?: TaskStatus
}

// Main task interface
export interface Task {
  id: string
  imageUrl: string
  imageId?: string
  imageOrder?: number
  noisyText: string
  correctedText: string
  status: TaskStatus
  groupId?: string
  batchName?: string
  assignedTo?: string
  assignedToName?: string
  reviewerId?: string
  reviewerName?: string
  finalReviewerId?: string
  finalReviewerName?: string
  history: TaskHistoryEntry[]
  createdAt: Date
  updatedAt: Date
}

// Task upload JSON schema
export interface TaskUploadItem {
  name: string
  url: string
  transcript: string
}

// Bulk create request/response
export interface BulkCreateTasksRequest {
  tasks: TaskUploadItem[]
  group: string
  batchName: string
}

export interface BulkCreateTasksResponse {
  success: boolean
  created: number
  failed: number
  errors: Array<{ index: number; message: string }>
  tasks: Task[]
}

// Task assignment request
export interface AssignTaskRequest {
  taskId: string
  userId: string
}

// Task orientation type
export type TaskOrientation = 'landscape' | 'portrait'

// ITV3 task states returned by the assign endpoint
export type AssignedTaskState =
  | 'pending'
  | 'annotating'
  | 'half_annotated'
  | 'annotating_b'
  | 'annotating_c'
  | 'annotated'
  | 'reviewing'
  | 'half_reviewed'
  | 'reviewing_b'
  | 'reviewed'
  | 'finalising'
  | 'finalised'
  | 'trashed'

export const ITV3_EDITABLE_TASK_STATES = [
  'annotating',
  'annotating_b',
  'annotating_c',
  'reviewing',
  'reviewing_b',
] as const satisfies readonly AssignedTaskState[]

/** Reviewer A/B slots — approve/submit is allowed only in these states. */
export const ITV3_REVIEWER_APPROVABLE_STATES = [
  'reviewing',
  'reviewing_b',
] as const satisfies readonly AssignedTaskState[]

/** Final Reviewer slot — approve/submit is allowed only in this state. */
export const ITV3_FINAL_REVIEWER_APPROVABLE_STATES = [
  'finalising',
] as const satisfies readonly AssignedTaskState[]

export function isEditableTaskState(state: AssignedTaskState): boolean {
  return (ITV3_EDITABLE_TASK_STATES as readonly string[]).includes(state)
}

/** Annotator A slot — only this slot may trash/reject a task. */
export function isAnnotatorATaskState(state: AssignedTaskState): boolean {
  return state === 'annotating'
}

/** Annotator B slot — receives baseline OCR via initial_transcript, cannot trash. */
export function isAnnotatorBTaskState(state: AssignedTaskState): boolean {
  return state === 'annotating_b'
}

/** Annotator C slot — receives baseline OCR via initial_transcript, cannot trash. */
export function isAnnotatorCTaskState(state: AssignedTaskState): boolean {
  return state === 'annotating_c'
}

export function canAnnotatorTrashTask(state: AssignedTaskState): boolean {
  return isAnnotatorATaskState(state)
}

/** Baseline text shown in the annotator editor (Annotator B is double-blind from Annotator A). */
export function getAnnotatorBaselineTranscript(task: AssignedTask): string {
  if (isAnnotatorBTaskState(task.state) || isAnnotatorCTaskState(task.state)) {
    return (task.initial_transcript?.trim() || task.task_transcript) ?? ''
  }
  return task.task_transcript ?? ''
}

/** Single rejection comment record returned on assign (comment_A / comment_B arrays). */
export interface RejectionCommentRecord {
  comment: string
  created: string
}

export type RejectionHistoryTarget =
  | 'annotator_a'
  | 'annotator_b'
  | 'annotator_c'
  | 'reviewer_a'
  | 'reviewer_b'

export interface RejectionHistoryEntry {
  created: string
  targets: RejectionHistoryTarget[]
  comments: string[]
}

export interface TaskRejectionComments {
  comment_A?: RejectionCommentRecord[]
  comment_B?: RejectionCommentRecord[]
  comment_C?: RejectionCommentRecord[]
}

const FINAL_REVIEW_PIPELINE_STATES = [
  'reviewed',
  'finalising',
  'finalised',
] as const satisfies readonly AssignedTaskState[]

export function isTaskAtOrPastFinalReview(state: AssignedTaskState): boolean {
  return (FINAL_REVIEW_PIPELINE_STATES as readonly string[]).includes(state)
}

/** Reviewer A/B slot from assign state. */
export function isReviewerATaskState(state: AssignedTaskState): boolean {
  return state === 'reviewing'
}

export function isReviewerBTaskState(state: AssignedTaskState): boolean {
  return state === 'reviewing_b'
}

// Assigned task from real backend API
export interface AssignedTask {
  task_id: string
  task_name: string
  task_url: string
  task_transcript: string
  /** Slot 1 reference transcript — Annotator A (reviewers) or Reviewer A (final reviewer). */
  task_transcript_1?: string
  /** Slot 2 reference transcript — Annotator B (reviewers) or Reviewer B (final reviewer). */
  task_transcript_2?: string
  /** Slot 3 reference transcript — Annotator C. */
  task_transcript_3?: string
  /** Reviewer's prior submission when reassigned after final-reviewer rejection. */
  reviewer_transcript?: string
  initial_transcript?: string
  state: AssignedTaskState
  batch_name: string
  group: string
  orientation?: TaskOrientation
  /** Times this assignment was returned to the current worker. */
  rejection_count?: number
  annotation_a_rejection_count?: number
  annotation_b_rejection_count?: number
  annotation_c_rejection_count?: number
  review_a_rejection_count?: number
  review_b_rejection_count?: number
  comment_A?: RejectionCommentRecord[]
  comment_B?: RejectionCommentRecord[]
  comment_C?: RejectionCommentRecord[]
}

// Task submission request
export interface SubmitTaskRequest {
  taskId: string
  correctedText: string
}

// Task review request
export interface ReviewTaskRequest {
  taskId: string
  approved: boolean
  comment?: string
}

// Dashboard statistics
export interface DashboardStats {
  pending: number
  inProgress: number
  awaitingReview: number
  completed: number
  rejected: number
  total: number
}

// Filter options for task lists
export interface TaskFilter {
  status?: TaskStatus[]
  assignedTo?: string
  reviewerId?: string
  search?: string
}

// Status display configuration
export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  [TaskStatus.Pending]: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
  [TaskStatus.InProgress]: { label: 'In Progress', color: 'bg-primary/20 text-primary' },
  [TaskStatus.AwaitingReview]: { label: 'Awaiting Review', color: 'bg-warning/20 text-warning' },
  [TaskStatus.InReview]: { label: 'In Review', color: 'bg-accent/20 text-accent' },
  [TaskStatus.AwaitingFinalReview]: { label: 'Awaiting Final Review', color: 'bg-warning/20 text-warning' },
  [TaskStatus.FinalReview]: { label: 'Final Review', color: 'bg-accent/20 text-accent' },
  [TaskStatus.Completed]: { label: 'Completed', color: 'bg-success/20 text-success' },
  [TaskStatus.Rejected]: { label: 'Rejected', color: 'bg-destructive/20 text-destructive' },
}

// Valid status transitions based on the state machine
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.Pending]: [TaskStatus.InProgress],
  [TaskStatus.InProgress]: [TaskStatus.AwaitingReview],
  [TaskStatus.AwaitingReview]: [TaskStatus.InReview],
  [TaskStatus.InReview]: [TaskStatus.AwaitingFinalReview, TaskStatus.Rejected],
  [TaskStatus.AwaitingFinalReview]: [TaskStatus.FinalReview],
  [TaskStatus.FinalReview]: [TaskStatus.Completed, TaskStatus.Rejected],
  [TaskStatus.Completed]: [],
  [TaskStatus.Rejected]: [TaskStatus.InProgress],
}

