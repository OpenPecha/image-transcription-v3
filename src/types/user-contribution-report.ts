/** Per-task row from the ITV3 user contributions report endpoint. */
export interface Itv3ContributionTask {
  task_id: string
  name: string
  batch_name: string
  updated_time: string
  role: string
  order: 1 | 2 | null
  rejection_count: number
  final_char_count: number | null
  total_char_difference: number | null
  char_percent_diff: number | null
  review_char_count?: number | null
  review_total_char_difference?: number | null
  /** @deprecated Use `rejections_made_count` */
  rejections_made?: number | null
  rejections_made_count?: number | null
  own_version_count?: number | null
  own_version_sum?: number | null
  selected_option_count?: number | null
  selected_option_sum?: number | null
  modified_option_count?: number | null
  modified_option_sum?: number | null
}

/** Shared rejection / pass-rate fields on contribution summaries (API renamed in 2026-06). */
export interface Itv3ContributionRejectionMetrics {
  /** @deprecated Use `rejected_count` */
  rejection_count?: number
  rejected_count?: number
  /** @deprecated Use `rejected_percent` */
  rejection_percent?: number
  rejected_percent?: number
  /** @deprecated Use `unrejected_tasks_percent` */
  unrejected_percent?: number
  unrejected_tasks_percent?: number
}

/** Rejections initiated by the user (reviewer / final reviewer). */
export interface Itv3RejectionsMadeMetrics {
  /** @deprecated Use `rejections_made_count` */
  rejections_made?: number
  rejections_made_count?: number
  /** @deprecated Use `rejections_made_percent` */
  rejections_made_percent?: number
}

export interface Itv3AnnotatorContributionSummary extends Itv3ContributionRejectionMetrics {
  total_count: number
  tasks_annotated: number
  tasks_reviewed: number
  tasks_final_reviewed: number
  final_char_count: number
  total_char_difference: number
  char_percent_diff: number
}

export interface Itv3ReviewerContributionSummary
  extends Itv3ContributionRejectionMetrics, Itv3RejectionsMadeMetrics {
  total_count?: number
  tasks_reviewed?: number
  /** Tasks reviewed in Reviewer A (order 1) slot. */
  tasks_reviewed_as_r1?: number
  tasks_final_reviewed?: number
  final_char_count?: number
  total_char_difference?: number
  char_percent_diff?: number
  review_char_count?: number
  review_total_char_difference?: number
  own_version_count?: number
  own_version_sum?: number
  selected_option_count?: number
  selected_option_sum?: number
  modified_option_count?: number
  modified_option_sum?: number
}

export interface Itv3FinalReviewerContributionSummary
  extends Itv3ContributionRejectionMetrics, Itv3RejectionsMadeMetrics {
  total_count: number
  tasks_finalised: number
  final_char_count: number
  total_char_difference: number
  char_percent_diff: number
  own_version_count: number
  own_version_sum: number
  selected_option_count: number
  selected_option_sum: number
  modified_option_count: number
  modified_option_sum: number
}

export interface Itv3ContributionSummary {
  annotator: Itv3AnnotatorContributionSummary | null
  reviewer: Itv3ReviewerContributionSummary | null
  final_reviewer: Itv3FinalReviewerContributionSummary | null
}

export interface UserContributionReportResponse {
  tasks: Itv3ContributionTask[]
  contribution_summary: Itv3ContributionSummary
}
