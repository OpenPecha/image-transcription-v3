import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { APPLICATION_NAME } from '@/lib/constant'
import type {
  ContributionSummaryQueryParams,
  GroupContributionSummaryResponse,
} from '@/types'
import { contributionKeys } from './contribution-keys'

const CONTRIBUTIONS_CACHE_MS = 30 * 60 * 1000

const emptyGroupContributionSummary = (
  groupId: string
): GroupContributionSummaryResponse => ({
  application: APPLICATION_NAME,
  group_id: groupId,
  group_name: '',
  annotator: [],
  reviewer: [],
})

export async function getGroupContributionSummary(
  groupId: string,
  params?: ContributionSummaryQueryParams
): Promise<GroupContributionSummaryResponse> {
  const search = new URLSearchParams()
  if (params) {
    search.set('start_date', params.start_date)
    search.set('end_date', params.end_date)
  }
  const qs = search.toString()

  const response = (await apiClient.get(
    `/contributions/${APPLICATION_NAME}/${encodeURIComponent(groupId)}/summary${qs ? `?${qs}` : ''}`
  )) as GroupContributionSummaryResponse

  if (!response || !Array.isArray(response.annotator)) {
    return emptyGroupContributionSummary(groupId)
  }

  return {
    application: response.application ?? APPLICATION_NAME,
    group_id: response.group_id ?? groupId,
    group_name: response.group_name ?? '',
    annotator: response.annotator ?? [],
    reviewer: response.reviewer ?? [],
  }
}

export function useGroupContributionSummaryOverall(options: {
  groupId: string | undefined
  enabled: boolean
}) {
  const { groupId, enabled } = options

  return useQuery({
    queryKey: contributionKeys.summaryOverall(groupId ?? 'none'),
    queryFn: () => getGroupContributionSummary(groupId as string),
    enabled: Boolean(groupId) && enabled,
    staleTime: CONTRIBUTIONS_CACHE_MS,
    gcTime: CONTRIBUTIONS_CACHE_MS,
    retry: 1,
  })
}

export function useGroupContributionSummaryFiltered(options: {
  groupId: string | undefined
  period: { start: string; end: string }
  enabled: boolean
}) {
  const { groupId, period, enabled } = options

  return useQuery({
    queryKey: contributionKeys.summaryFiltered(
      groupId ?? 'none',
      period.start,
      period.end
    ),
    queryFn: () =>
      getGroupContributionSummary(groupId as string, {
        start_date: period.start,
        end_date: period.end,
      }),
    enabled: Boolean(groupId) && enabled,
    staleTime: CONTRIBUTIONS_CACHE_MS,
    gcTime: CONTRIBUTIONS_CACHE_MS,
    retry: 1,
  })
}
