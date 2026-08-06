import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { getFinalizedPercentage } from './progress-bar/progress-bar.utils'
import {
  WORKFLOW_STATS,
  type ApplicationBatchReport,
  type BatchStatKey,
} from '@/types'

const SUMMARY_STAT_KEYS: BatchStatKey[] = [...WORKFLOW_STATS, 'trashed']

const SUMMARY_CARD_COUNT = SUMMARY_STAT_KEYS.length + 1
const SUMMARY_GRID_CLASS = 'grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7'

function percent(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

type ApplicationBatchSummaryProps = {
  report: ApplicationBatchReport | undefined
  isLoading: boolean
  isError?: boolean
}

export function ApplicationBatchSummary({
  report,
  isLoading,
  isError = false,
}: ApplicationBatchSummaryProps) {
  const { t } = useTranslation('admin')

  if (isLoading) {
    return (
      <div className="space-y-3 pb-4">
        <Skeleton className="h-4 w-56" />
        <div className={SUMMARY_GRID_CLASS}>
          {[...Array(SUMMARY_CARD_COUNT)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <p className="pb-4 text-sm text-muted-foreground">
        {t('batches.failedToLoadStats')}
      </p>
    )
  }

  if (!report) return null

  const total = report.total_tasks
  const reviewedPercent = getFinalizedPercentage(report)
  const stats = [
    {
      key: 'total',
      label: t('batches.total'),
      value: total,
      meta: '100%',
    },
    ...SUMMARY_STAT_KEYS.map((key) => ({
      key,
      label: t(`batches.states.${key}`),
      value: report[key],
      meta: `${percent(report[key], total)}%`,
    })),
  ]

  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold tracking-tight">
          {t('batches.applicationSummaryTitle')}
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {t('batches.finalized', { percentage: reviewedPercent })}
        </div>
      </div>
      <div className={SUMMARY_GRID_CLASS}>
        {stats.map((item) => (
          <div key={item.key} className="rounded-lg border bg-card px-3 py-2">
            <div className="text-[11px] font-medium text-muted-foreground">{item.label}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-lg font-semibold tabular-nums leading-none">{item.value}</div>
              <div className="text-xs text-muted-foreground tabular-nums">{item.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
