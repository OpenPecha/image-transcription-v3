import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { AnnotatorContributionRow } from '@/types'
import { AnnotatorContributionTableRow } from './annotator-contribution-row'
import {
  contributionTableClass,
  contributionTableHeadCellClass,
  contributionTableUsernameHeadCellClass,
  contributionTableWrapperClass,
} from './contribution-table-styles'

export interface AnnotatorContributionTableProps {
  rows: AnnotatorContributionRow[]
  baselineByUserId: Map<string, AnnotatorContributionRow>
  filterActive: boolean
}

export function AnnotatorContributionTable({
  rows,
  baselineByUserId,
  filterActive,
}: AnnotatorContributionTableProps) {
  const { t } = useTranslation('admin')

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        {t('userContributions.noAnnotators')}
      </p>
    )
  }

  return (
    <div className={contributionTableWrapperClass}>
      <table className={cn(contributionTableClass, 'min-w-[960px]')}>
        <thead>
          <tr className="text-left">
            <th className={cn(contributionTableUsernameHeadCellClass, 'text-left')}>
              {t('userContributions.tables.annotator.username')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.annotator.tasksAnnotated')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.annotator.tasksReviewed')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.annotator.rejectedCount')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.annotator.rejectedPercent')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.annotator.unrejectedPercent')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.annotator.finalCharCount')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.annotator.charDiff')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.annotator.charPercentDiff')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AnnotatorContributionTableRow
              key={row.user_id}
              filterActive={filterActive}
              display={row}
              baseline={baselineByUserId.get(row.user_id) ?? row}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
