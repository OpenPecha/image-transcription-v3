import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { ReviewerContributionRow } from '@/types'
import { ReviewerContributionTableRow } from './reviewer-contribution-row'
import {
  contributionTableClass,
  contributionTableHeadCellClass,
  contributionTableUsernameHeadCellClass,
  contributionTableWrapperClass,
} from './contribution-table-styles'

export interface ReviewerContributionTableProps {
  rows: ReviewerContributionRow[]
  baselineByUserId: Map<string, ReviewerContributionRow>
  filterActive: boolean
}

export function ReviewerContributionTable({
  rows,
  baselineByUserId,
  filterActive,
}: ReviewerContributionTableProps) {
  const { t } = useTranslation('admin')

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        {t('userContributions.noReviewers')}
      </p>
    )
  }

  return (
    <div className={contributionTableWrapperClass}>
      <table className={cn(contributionTableClass, 'min-w-[1024px]')}>
        <thead>
          <tr className="text-left">
            <th className={cn(contributionTableUsernameHeadCellClass, 'text-left')}>
              {t('userContributions.tables.reviewer.username')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.reviewer.tasksReviewed')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.reviewer.unrejectedPercent')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.reviewer.finalCharCount')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.reviewer.reviewCharDiff')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.reviewer.rejectionsMade')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.reviewer.rejectionsMadePercent')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.reviewer.ownVersion')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.reviewer.selectedOption')}
            </th>
            <th className={cn(contributionTableHeadCellClass, 'text-right')}>
              {t('userContributions.tables.reviewer.modifiedOption')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ReviewerContributionTableRow
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
