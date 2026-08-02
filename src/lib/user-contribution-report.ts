import type {
  Itv3AnnotatorContributionSummary,
  Itv3ContributionRejectionMetrics,
  Itv3ContributionSummary,
  Itv3RejectionsMadeMetrics,
  Itv3ReviewerContributionSummary,
  UserContributionReportResponse,
} from '@/types/user-contribution-report'
import { UserRole, normalizeUserRole } from '@/types/user'

export type Itv3ReportRoleSummary =
  | Itv3AnnotatorContributionSummary
  | Itv3ReviewerContributionSummary

export function getContributionSummaryForRole(
  summary: Itv3ContributionSummary | undefined,
  role: UserRole | string | undefined
): Itv3ReportRoleSummary | null {
  if (!summary) return null

  const normalized = normalizeUserRole(role)
  if (normalized === UserRole.Annotator) return summary.annotator
  if (normalized === UserRole.Reviewer) return summary.reviewer
  return null
}

export function getSummaryRejectedCount(
  summary: Itv3ContributionRejectionMetrics | null | undefined
): number {
  if (!summary) return 0
  return summary.rejected_count ?? summary.rejection_count ?? 0
}

export function getSummaryRejectedPercent(
  summary: Itv3ContributionRejectionMetrics | null | undefined
): number | undefined {
  if (!summary) return undefined
  return summary.rejected_percent ?? summary.rejection_percent
}

export function getSummaryUnrejectedTasksPercent(
  summary: Itv3ContributionRejectionMetrics | null | undefined
): number | undefined {
  if (!summary) return undefined
  return summary.unrejected_tasks_percent ?? summary.unrejected_percent
}

export function getSummaryRejectionsMadeCount(
  summary: Itv3RejectionsMadeMetrics | null | undefined
): number {
  if (!summary) return 0
  return summary.rejections_made_count ?? summary.rejections_made ?? 0
}

export function getSummaryRejectionsMadePercent(
  summary: (Itv3RejectionsMadeMetrics & Itv3ContributionRejectionMetrics) | null | undefined
): number | undefined {
  if (!summary) return undefined
  return summary.rejections_made_percent
}

export function getTaskRejectionsMadeCount(
  task: { rejections_made_count?: number | null; rejections_made?: number | null } | null | undefined
): number {
  if (!task) return 0
  return task.rejections_made_count ?? task.rejections_made ?? 0
}

export function emptyContributionReport(): UserContributionReportResponse {
  return {
    tasks: [],
    contribution_summary: {
      annotator: null,
      reviewer: null,
    },
  }
}

export function formatReportNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString()
}

export function formatReportSignedNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString()}`
}

export function formatReportPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
}

export function formatReportCountSum(
  count: number | null | undefined,
  sum: number | null | undefined
): string {
  if (count == null && sum == null) return '—'
  return `${formatReportNumber(count ?? 0)} / ${formatReportNumber(sum ?? 0)}`
}

export function getContributionSlotLabelKey(
  role: UserRole | string | undefined,
  order: 1 | 2 | 3 | null
): 'annotatorA' | 'annotatorB' | 'annotatorC' | 'reviewer' {
  const normalized = normalizeUserRole(role)

  if (normalized === UserRole.Reviewer || order == null) {
    return 'reviewer'
  }

  if (order === 1) return 'annotatorA'
  if (order === 2) return 'annotatorB'
  return 'annotatorC'
}
