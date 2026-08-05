import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowRight, Eye } from 'lucide-react'
import { ADMIN_FEATURE_AVAILABILITY } from '@/features/admin/lib/admin-feature-availability'
import { cn } from '@/lib/utils'

type BatchStatsFooterProps = {
  batchId: string
  trashedCount: number
  finalizedPercentage: number
}

export function BatchStatsFooter({
  batchId,
  trashedCount,
  finalizedPercentage,
}: BatchStatsFooterProps) {
  const { t } = useTranslation('admin')
  const canViewTasks = ADMIN_FEATURE_AVAILABILITY.batchTaskListing

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{t('batches.status')}:</span>
          <span
            className={cn(
              'font-semibold',
              finalizedPercentage === 100
                ? 'text-emerald-600'
                : finalizedPercentage > 50
                  ? 'text-cyan-600'
                  : 'text-slate-600'
            )}
          >
            {t('batches.finalized', { percentage: finalizedPercentage })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {trashedCount > 0 &&
          (canViewTasks ? (
            <Link
              to={`/admin/batch/${batchId}?state=trashed`}
              className="inline-flex items-center gap-1.5 text-rose-600 transition-colors hover:text-rose-700"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-medium">
                {t('batches.trashed', { count: trashedCount })}
              </span>
            </Link>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-rose-600/60"
              title={t('featureAvailability.batchTasksTitle')}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-medium">
                {t('batches.trashed', { count: trashedCount })}
              </span>
            </span>
          ))}

        {canViewTasks ? (
          <Link
            to={`/admin/batch/${batchId}`}
            className="inline-flex items-center gap-1 font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            <Eye className="h-3.5 w-3.5" />
            {t('batches.viewTasks')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span
            className="inline-flex items-center gap-1 font-medium text-muted-foreground"
            title={t('featureAvailability.batchTasksTitle')}
          >
            <Eye className="h-3.5 w-3.5" />
            {t('batches.viewTasks')}
          </span>
        )}
      </div>
    </div>
  )
}
