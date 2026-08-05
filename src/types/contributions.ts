import type {
  Itv3AnnotatorContributionSummary,
  Itv3FinalReviewerContributionSummary,
  Itv3ReviewerContributionSummary,
} from './user-contribution-report'

/** Query params for GET /contributions/{application_name}/{group_id}/summary */
export interface ContributionSummaryQueryParams {
  start_date: string
  end_date: string
}

export interface AnnotatorContributionRow extends Itv3AnnotatorContributionSummary {
  user_id: string
  username: string
}

export interface ReviewerContributionRow extends Itv3ReviewerContributionSummary {
  user_id: string
  username: string
}

export interface FinalReviewerContributionRow extends Itv3FinalReviewerContributionSummary {
  user_id: string
  username: string
}

export interface GroupContributionSummaryResponse {
  application: string
  group_id: string
  group_name: string
  annotator: AnnotatorContributionRow[]
  reviewer: ReviewerContributionRow[]
  final_reviewer: FinalReviewerContributionRow[]
}
