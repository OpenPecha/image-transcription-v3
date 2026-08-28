import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  formatReportCountSum,
  formatReportNumber,
  formatReportPercent,
  formatReportSignedNumber,
} from '@/lib/user-contribution-report'
import type { ReviewerContributionRow } from '@/types'
import { ContributionMetricCell } from './contribution-metric-cell'
import { contributionTableBodyCellClass, contributionTableUsernameBodyCellClass } from './contribution-table-styles'

export interface ReviewerContributionRowProps {
  filterActive: boolean
  display: ReviewerContributionRow
  baseline: ReviewerContributionRow
}

export function ReviewerContributionTableRow({
  filterActive,
  display,
  baseline,
}: ReviewerContributionRowProps) {
  const reviewedCell: ReactNode = filterActive ? (
    <ContributionMetricCell
      count={display.tasks_reviewed}
      denominator={baseline.tasks_reviewed}
      filterActive
    />
  ) : (
    <span className="tabular-nums">{baseline.tasks_reviewed}</span>
  )

  const row = filterActive ? display : baseline

  return (
    <tr>
      <td className={contributionTableUsernameBodyCellClass} title={display.username}>
        {display.username}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right')}>{reviewedCell}</td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportPercent(row.unrejected_tasks_percent)}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportNumber(row.final_char_count)}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportSignedNumber(row.review_total_char_difference)}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {row.rejections_made_count}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportPercent(row.rejections_made_percent)}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportCountSum(row.own_version_count, row.own_version_sum)}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportCountSum(row.selected_option_count, row.selected_option_sum)}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportCountSum(row.modified_option_count, row.modified_option_sum)}
      </td>
    </tr>
  )
}
