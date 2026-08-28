/** Per-task row from the ITv3 user contributions report endpoint. */
export interface Itv3ContributionTask {
  task_id: string
  name: string
  batch_name: string
  updated_time: string
  role: Itv3ContributionRole
  /** Annotator slot order (1, 2, or 3); null for the reviewer row. */
  order: 1 | 2 | 3 | null
  rejection_count: number
  final_char_count: number | null
  /** Annotator only: Lev(Ai, accepted review transcript). Null on reviewer rows. */
  total_char_difference: number | null
  char_percent_diff: number | null
  /** Reviewer only: min(Lev(A1, Ri), Lev(A2, Ri), Lev(A3, Ri)). */
  review_total_char_difference: number | null
  /** Reviewer only: annotation-slot rejections made on this task. */
  rejections_made: number | null
  own_version_count: number | null
  own_version_sum: number | null
  selected_option_count: number | null
  selected_option_sum: number | null
  modified_option_count: number | null
  modified_option_sum: number | null
}

export type Itv3ContributionRole = 'annotator' | 'reviewer'

/** Aggregated annotation work for a date range. Absent when the user never annotated. */
export interface Itv3AnnotatorContributionSummary {
  total_count: number
  tasks_annotated: number
  /** Annotated tasks that later reached `reviewed`. Not review work by this user. */
  tasks_reviewed: number
  rejected_count: number
  rejected_percent: number
  unrejected_tasks_percent: number
  final_char_count: number
  total_char_difference: number
  char_percent_diff: number
}

/** Aggregated review work for a date range. Absent when the user never reviewed. */
export interface Itv3ReviewerContributionSummary {
  total_count: number
  tasks_reviewed: number
  /** In ITv3 the review transcript is the terminal output, so this is its length. */
  final_char_count: number
  review_total_char_difference: number
  rejections_made_count: number
  rejections_made_percent: number
  unrejected_tasks_percent: number
  own_version_count: number
  own_version_sum: number
  selected_option_count: number
  selected_option_sum: number
  modified_option_count: number
  modified_option_sum: number
}

/**
 * Role blocks are independent: a user who both annotated and reviewed in the
 * range gets both, and each is null when that kind of work is absent.
 */
export interface Itv3ContributionSummary {
  annotator: Itv3AnnotatorContributionSummary | null
  reviewer: Itv3ReviewerContributionSummary | null
}

export interface UserContributionReportResponse {
  tasks: Itv3ContributionTask[]
  contribution_summary: Itv3ContributionSummary
}
