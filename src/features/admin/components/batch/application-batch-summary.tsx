import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BatchItem, BatchItemSkeleton } from './batch-item'
import { getFinalizedPercentage } from './progress-bar/progress-bar.utils'
import {
  WORKFLOW_STATS,
  type ApplicationBatchReport,
  type Batch,
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
  batches?: Batch[]
  isLoading: boolean
  isBatchesLoading?: boolean
  isError?: boolean
}

export function ApplicationBatchSummary({
  report,
  batches = [],
  isLoading,
  isBatchesLoading = false,
  isError = false,
}: ApplicationBatchSummaryProps) {
  const { t } = useTranslation('admin')
  const [isExpanded, setIsExpanded] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-4">
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
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
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
  const batchCount = batches.length

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="text-sm font-semibold tracking-tight capitalize">
            {report.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('batches.finalized', { percentage: reviewedPercent })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
            {t('batches.batchCount', { count: batchCount })}
          </span>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>

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

      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t pt-4">
            {isBatchesLoading ? (
              [...Array(2)].map((_, i) => <BatchItemSkeleton key={i} />)
            ) : batchCount === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                {t('batches.noBatchesInGroup')}
              </p>
            ) : (
              batches.map((batch) => <BatchItem key={batch.id} batch={batch} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
