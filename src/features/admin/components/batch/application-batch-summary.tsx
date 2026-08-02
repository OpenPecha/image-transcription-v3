import { Skeleton } from '@/components/ui/skeleton'
import {
  BATCH_STATS_CONFIG,
  WORKFLOW_STATS,
  type ApplicationBatchReport,
  type BatchStatKey,
} from '@/types'

const SUMMARY_STAT_KEYS: BatchStatKey[] = [...WORKFLOW_STATS, 'trashed']

// Total card plus one card per state
const SUMMARY_CARD_COUNT = SUMMARY_STAT_KEYS.length + 1
const SUMMARY_GRID_CLASS = 'grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7'

function percent(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

interface ApplicationBatchSummaryProps {
  report: ApplicationBatchReport | undefined
  isLoading: boolean
}

export function ApplicationBatchSummary({ report, isLoading }: ApplicationBatchSummaryProps) {
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

  if (!report) return null

  const total = report.total_tasks
  const stats = [
    { label: 'Total', value: total, meta: '100%' },
    ...SUMMARY_STAT_KEYS.map((key) => ({
      label: BATCH_STATS_CONFIG[key].label,
      value: report[key],
      meta: `${percent(report[key], total)}%`,
    })),
  ]

  return (
    <div className="space-y-3 pb-4">
      <div className="space-y-0.5">
        <div className="text-sm font-semibold tracking-tight capitalize">
          {report.name}
        </div>
      </div>
      <div className={SUMMARY_GRID_CLASS}>
        {stats.map((item) => (
          <div key={item.label} className="rounded-lg border bg-card px-3 py-2">
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

