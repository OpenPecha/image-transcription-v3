import { useTranslation } from 'react-i18next'
import type { GroupContributionSummaryResponse } from '@/types'
import { AnnotatorContributionTable } from './annotator-contribution-table'
import { ReviewerContributionTable } from './reviewer-contribution-table'

export type ContributionSummaryTablesProps = {
  baseline: GroupContributionSummaryResponse
  filtered: GroupContributionSummaryResponse | null
  filterActive: boolean
}

export function ContributionSummaryTables({
  baseline,
  filtered,
  filterActive,
}: ContributionSummaryTablesProps) {
  const { t } = useTranslation('admin')

  const annotBaselineById = new Map(
    baseline.annotator.map((row) => [row.user_id, row] as const)
  )
  const revBaselineById = new Map(
    baseline.reviewer.map((row) => [row.user_id, row] as const)
  )

  const annotRows = filterActive && filtered ? filtered.annotator : baseline.annotator
  const revRows = filterActive && filtered ? filtered.reviewer : baseline.reviewer

  return (
    <div className="min-w-0 space-y-6">
      <section className="min-w-0 space-y-2">
        <h3 className="text-sm font-semibold">{t('userContributions.annotatorsSection')}</h3>
        <AnnotatorContributionTable
          rows={annotRows}
          baselineByUserId={annotBaselineById}
          filterActive={filterActive}
        />
      </section>

      <section className="min-w-0 space-y-2">
        <h3 className="text-sm font-semibold">{t('userContributions.reviewersSection')}</h3>
        <ReviewerContributionTable
          rows={revRows}
          baselineByUserId={revBaselineById}
          filterActive={filterActive}
        />
      </section>
    </div>
  )
}
