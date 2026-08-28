import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  formatReportNumber,
  formatReportPercent,
  formatReportSignedNumber,
} from '@/lib/user-contribution-report'
import type { AnnotatorContributionRow } from '@/types'
import { ContributionMetricCell } from './contribution-metric-cell'
import { contributionTableBodyCellClass, contributionTableUsernameBodyCellClass } from './contribution-table-styles'

export interface AnnotatorContributionRowProps {
  filterActive: boolean
  display: AnnotatorContributionRow
  baseline: AnnotatorContributionRow
}

export function AnnotatorContributionTableRow({
  filterActive,
  display,
  baseline,
}: AnnotatorContributionRowProps) {
  const annotatedCell: ReactNode = filterActive ? (
    <ContributionMetricCell
      count={display.tasks_annotated}
      denominator={baseline.tasks_annotated}
      filterActive
    />
  ) : (
    <span className="tabular-nums">{baseline.tasks_annotated}</span>
  )

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
      <td className={cn(contributionTableBodyCellClass, 'text-right')}>{annotatedCell}</td>
      <td className={cn(contributionTableBodyCellClass, 'text-right')}>{reviewedCell}</td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {row.rejected_count}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportPercent(row.rejected_percent)}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportPercent(row.unrejected_tasks_percent)}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportNumber(row.final_char_count)}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportSignedNumber(row.total_char_difference)}
      </td>
      <td className={cn(contributionTableBodyCellClass, 'text-right tabular-nums')}>
        {formatReportPercent(row.char_percent_diff)}
      </td>
    </tr>
  )
}
