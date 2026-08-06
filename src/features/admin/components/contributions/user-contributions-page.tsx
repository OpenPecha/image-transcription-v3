import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { LoadingSpinner } from '@/components/common'
import { useGetGroups } from '@/features/admin/api/group'
import { ADMIN_FEATURE_AVAILABILITY } from '@/features/admin/lib/admin-feature-availability'
import {
  decodeAdminPeriodsParam,
  encodeAdminPeriodsMap,
  parseAdminExpandedIds,
  serializeAdminExpandedIds,
  USER_CONTRIB_ADMIN_EXPAND,
  USER_CONTRIB_ADMIN_PERIODS,
} from '@/lib/user-contributions-url'
import { AdminFeatureUnavailable } from '../admin-feature-unavailable'
import { AdminGroupContributionRow } from './admin-group-contribution-row'

export function UserContributionsPage() {
  const { t } = useTranslation('admin')

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('userContributions.title')}</h1>
        <p className="text-muted-foreground">{t('userContributions.description')}</p>
      </div>

      {ADMIN_FEATURE_AVAILABILITY.contributions ? (
        <AdminContributionsBody />
      ) : (
        <AdminFeatureUnavailable
          title={t('featureAvailability.contributionsTitle')}
          description={t('featureAvailability.contributionsDescription')}
        />
      )}
    </div>
  )
}

function AdminContributionsBody() {
  const { t } = useTranslation('admin')
  const { data: groups = [], isLoading: groupsLoading, isError: groupsError } = useGetGroups()
  const [searchParams, setSearchParams] = useSearchParams()

  const periodsMap = useMemo(
    () => decodeAdminPeriodsParam(searchParams.get(USER_CONTRIB_ADMIN_PERIODS)),
    [searchParams]
  )

  const expandedSet = useMemo(() => {
    const ids = parseAdminExpandedIds(searchParams.get(USER_CONTRIB_ADMIN_EXPAND))
    return new Set(ids)
  }, [searchParams])

  const setExpanded = useCallback(
    (groupId: string, open: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const ids = parseAdminExpandedIds(next.get(USER_CONTRIB_ADMIN_EXPAND))
          const set = new Set(ids)
          if (open) set.add(groupId)
          else set.delete(groupId)
          const ser = serializeAdminExpandedIds([...set])
          if (ser) next.set(USER_CONTRIB_ADMIN_EXPAND, ser)
          else next.delete(USER_CONTRIB_ADMIN_EXPAND)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setPeriodForGroup = useCallback(
    (groupId: string, period: { start: string; end: string }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const map = decodeAdminPeriodsParam(next.get(USER_CONTRIB_ADMIN_PERIODS))
          map[groupId] = period
          next.set(USER_CONTRIB_ADMIN_PERIODS, encodeAdminPeriodsMap(map))
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  if (groupsLoading) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (groupsError) {
    return <p className="text-muted-foreground">{t('userContributions.groupsLoadError')}</p>
  }

  if (groups.length === 0) {
    return <p className="text-muted-foreground">{t('userContributions.noGroups')}</p>
  }

  return (
    <div className="min-w-0 space-y-3">
      <p className="text-sm text-muted-foreground">{t('userContributions.adminExpandHint')}</p>
      {groups.map((group) => (
        <AdminGroupContributionRow
          key={group.id}
          groupId={group.id}
          groupName={group.name}
          isOpen={expandedSet.has(group.id)}
          onOpenChange={(open) => setExpanded(group.id, open)}
          appliedPeriod={periodsMap[group.id]}
          onApplyPeriod={(period) => setPeriodForGroup(group.id, period)}
        />
      ))}
    </div>
  )
}
