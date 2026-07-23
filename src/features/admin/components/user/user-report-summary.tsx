import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatReportCountSum,
  formatReportNumber,
  formatReportPercent,
  formatReportSignedNumber,
  getSummaryRejectedCount,
  getSummaryRejectedPercent,
  getSummaryRejectionsMadeCount,
  getSummaryRejectionsMadePercent,
  getSummaryUnrejectedTasksPercent,
  type Itv3ReportRoleSummary,
} from '@/lib/user-contribution-report'
import {
  UserRole,
  normalizeUserRole,
  type Itv3AnnotatorContributionSummary,
  type Itv3FinalReviewerContributionSummary,
  type Itv3ReviewerContributionSummary,
} from '@/types'

interface UserReportSummaryProps {
  role: UserRole | string | undefined
  summary: Itv3ReportRoleSummary | null
  isLoading: boolean
}

interface StatCard {
  value: string | number
  label: string
  bg: string
}

const STAT_CARD_BG = {
  emerald: 'bg-emerald-100 dark:bg-emerald-950/55 border border-emerald-200/80 dark:border-emerald-900/60',
  sky: 'bg-sky-100 dark:bg-sky-950/55 border border-sky-200/80 dark:border-sky-900/60',
  red: 'bg-red-100 dark:bg-red-950/55 border border-red-200/80 dark:border-red-900/60',
  violet: 'bg-violet-100 dark:bg-violet-950/55 border border-violet-200/80 dark:border-violet-900/60',
  blue: 'bg-blue-100 dark:bg-blue-950/55 border border-blue-200/80 dark:border-blue-900/60',
  amber: 'bg-amber-100 dark:bg-amber-950/55 border border-amber-200/80 dark:border-amber-900/60',
  orange: 'bg-orange-100 dark:bg-orange-950/55 border border-orange-200/80 dark:border-orange-900/60',
} as const

function isAnnotatorSummary(
  summary: Itv3ReportRoleSummary
): summary is Itv3AnnotatorContributionSummary {
  return 'tasks_annotated' in summary
}

function isReviewerSummary(
  summary: Itv3ReportRoleSummary
): summary is Itv3ReviewerContributionSummary {
  return 'tasks_reviewed' in summary || 'review_char_count' in summary
}

function isFinalReviewerSummary(
  summary: Itv3ReportRoleSummary
): summary is Itv3FinalReviewerContributionSummary {
  return 'tasks_finalised' in summary
}

export function UserReportSummary({ role, summary, isLoading }: UserReportSummaryProps) {
  const { t } = useTranslation('admin')
  const normalizedRole = normalizeUserRole(role)

  const stats = useMemo((): StatCard[] => {
    if (!summary) return []

    if (normalizedRole === UserRole.Annotator && isAnnotatorSummary(summary)) {
      return [
        {
          value: summary.tasks_annotated ?? summary.total_count ?? 0,
          label: t('users.report.summary.tasksCompleted'),
          bg: STAT_CARD_BG.emerald,
        },
        {
          value: summary.tasks_reviewed ?? 0,
          label: t('users.report.summary.tasksReviewed'),
          bg: STAT_CARD_BG.blue,
        },
        {
          value: summary.tasks_final_reviewed ?? 0,
          label: t('users.report.summary.tasksFinalReviewed'),
          bg: STAT_CARD_BG.sky,
        },
        {
          value: getSummaryRejectedCount(summary),
          label: t('users.report.summary.rejectionCount'),
          bg: STAT_CARD_BG.red,
        },
        {
          value: formatReportPercent(getSummaryRejectedPercent(summary)),
          label: t('users.report.summary.rejectedPercent'),
          bg: STAT_CARD_BG.red,
        },
        {
          value: formatReportPercent(getSummaryUnrejectedTasksPercent(summary)),
          label: t('users.report.summary.unrejectedPercent'),
          bg: STAT_CARD_BG.violet,
        },
        {
          value: formatReportNumber(summary.final_char_count),
          label: t('users.report.summary.finalCharCount'),
          bg: STAT_CARD_BG.blue,
        },
        {
          value: formatReportSignedNumber(summary.total_char_difference),
          label: t('users.report.summary.charDiffVsFinal'),
          bg: STAT_CARD_BG.amber,
        },
        {
          value: formatReportPercent(summary.char_percent_diff),
          label: t('users.report.summary.charPercentDiff'),
          bg: STAT_CARD_BG.orange,
        },
      ]
    }

    if (normalizedRole === UserRole.Reviewer && isReviewerSummary(summary)) {
      return [
        {
          value: summary.tasks_reviewed ?? summary.total_count ?? 0,
          label: t('users.report.summary.tasksReviewed'),
          bg: STAT_CARD_BG.emerald,
        },
        {
          value: summary.tasks_reviewed_as_r1 ?? 0,
          label: t('users.report.summary.tasksReviewedAsR1'),
          bg: STAT_CARD_BG.emerald,
        },
        {
          value: summary.tasks_final_reviewed ?? 0,
          label: t('users.report.summary.tasksFinalReviewed'),
          bg: STAT_CARD_BG.sky,
        },
        {
          value: getSummaryRejectedCount(summary),
          label: t('users.report.summary.rejectionCount'),
          bg: STAT_CARD_BG.red,
        },
        {
          value: formatReportPercent(getSummaryRejectedPercent(summary)),
          label: t('users.report.summary.rejectedPercent'),
          bg: STAT_CARD_BG.red,
        },
        {
          value: formatReportPercent(getSummaryUnrejectedTasksPercent(summary)),
          label: t('users.report.summary.unrejectedPercent'),
          bg: STAT_CARD_BG.violet,
        },
        {
          value: formatReportNumber(summary.review_char_count),
          label: t('users.report.summary.reviewCharCount'),
          bg: STAT_CARD_BG.blue,
        },
        {
          value: formatReportSignedNumber(summary.review_total_char_difference),
          label: t('users.report.summary.reviewCharDiff'),
          bg: STAT_CARD_BG.amber,
        },
        {
          value: formatReportNumber(summary.final_char_count),
          label: t('users.report.summary.finalCharCount'),
          bg: STAT_CARD_BG.blue,
        },
        {
          value: formatReportSignedNumber(summary.total_char_difference),
          label: t('users.report.summary.charDiffVsFinal'),
          bg: STAT_CARD_BG.amber,
        },
        {
          value: formatReportPercent(summary.char_percent_diff),
          label: t('users.report.summary.charPercentDiff'),
          bg: STAT_CARD_BG.orange,
        },
        {
          value: getSummaryRejectionsMadeCount(summary),
          label: t('users.report.summary.rejectionsMade'),
          bg: STAT_CARD_BG.red,
        },
        {
          value: formatReportPercent(getSummaryRejectionsMadePercent(summary)),
          label: t('users.report.summary.rejectionsMadePercent'),
          bg: STAT_CARD_BG.red,
        },
        {
          value: formatReportCountSum(
            summary.own_version_count,
            summary.own_version_sum
          ),
          label: t('users.report.summary.ownVersion'),
          bg: STAT_CARD_BG.sky,
        },
        {
          value: formatReportCountSum(
            summary.selected_option_count,
            summary.selected_option_sum
          ),
          label: t('users.report.summary.selectedOption'),
          bg: STAT_CARD_BG.emerald,
        },
        {
          value: formatReportCountSum(
            summary.modified_option_count,
            summary.modified_option_sum
          ),
          label: t('users.report.summary.modifiedOption'),
          bg: STAT_CARD_BG.amber,
        },
      ]
    }

    if (normalizedRole === UserRole.FinalReviewer && isFinalReviewerSummary(summary)) {
      return [
        {
          value: summary.tasks_finalised ?? summary.total_count ?? 0,
          label: t('users.report.summary.tasksFinalised'),
          bg: STAT_CARD_BG.emerald,
        },
        {
          value: getSummaryRejectionsMadeCount(summary),
          label: t('users.report.summary.rejectionsMade'),
          bg: STAT_CARD_BG.red,
        },
        {
          value: formatReportPercent(getSummaryRejectionsMadePercent(summary)),
          label: t('users.report.summary.rejectionsMadePercent'),
          bg: STAT_CARD_BG.red,
        },
        {
          value: formatReportPercent(getSummaryUnrejectedTasksPercent(summary)),
          label: t('users.report.summary.unrejectedPercent'),
          bg: STAT_CARD_BG.violet,
        },
        {
          value: formatReportNumber(summary.final_char_count),
          label: t('users.report.summary.finalCharCount'),
          bg: STAT_CARD_BG.blue,
        },
        {
          value: formatReportSignedNumber(summary.total_char_difference),
          label: t('users.report.summary.charDiffVsFinal'),
          bg: STAT_CARD_BG.amber,
        },
        {
          value: formatReportPercent(summary.char_percent_diff),
          label: t('users.report.summary.charPercentDiff'),
          bg: STAT_CARD_BG.orange,
        },
        {
          value: formatReportCountSum(
            summary.own_version_count,
            summary.own_version_sum
          ),
          label: t('users.report.summary.ownVersion'),
          bg: STAT_CARD_BG.sky,
        },
        {
          value: formatReportCountSum(
            summary.selected_option_count,
            summary.selected_option_sum
          ),
          label: t('users.report.summary.selectedOption'),
          bg: STAT_CARD_BG.emerald,
        },
        {
          value: formatReportCountSum(
            summary.modified_option_count,
            summary.modified_option_sum
          ),
          label: t('users.report.summary.modifiedOption'),
          bg: STAT_CARD_BG.amber,
        },
      ]
    }

    return []
  }, [summary, normalizedRole, t])

  if (isLoading) {
    return <UserReportSummarySkeleton />
  }

  if (stats.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex min-h-[5.5rem] flex-col items-center justify-center rounded-lg px-3 py-4 ${stat.bg}`}
        >
          <span className="text-xl font-bold tabular-nums sm:text-2xl">{stat.value}</span>
          <span className="mt-1 text-center text-xs text-muted-foreground sm:text-sm">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function UserReportSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="flex min-h-[5.5rem] flex-col items-center justify-center rounded-lg bg-muted/70 px-4 py-5"
        >
          <Skeleton className="mb-2 h-7 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}
