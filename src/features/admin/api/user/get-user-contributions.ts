import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { APPLICATION_NAME } from '@/lib/constant'
import { emptyContributionReport } from '@/lib/user-contribution-report'
import type { UserContributionFilters, UserContributionReportResponse } from '@/types'
import { userKeys } from './user-keys'

const getUserContributions = async (
  userId: string,
  filters: UserContributionFilters
): Promise<UserContributionReportResponse> => {
  const params = new URLSearchParams()
  params.append('start_date', filters.start_date)
  params.append('end_date', filters.end_date)

  const response = (await apiClient.get(
    `/tasks/${APPLICATION_NAME}/${userId}/contributions?${params.toString()}`
  )) as UserContributionReportResponse

  if (!response || !Array.isArray(response.tasks)) {
    return emptyContributionReport()
  }

  return {
    tasks: response.tasks,
    contribution_summary: response.contribution_summary ?? {
      annotator: null,
      reviewer: null,
    },
  }
}

export const useGetUserContributions = (
  userId: string,
  filters: UserContributionFilters,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: userKeys.contributions(userId, filters),
    queryFn: () => getUserContributions(userId, filters),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    enabled: enabled && !!userId && !!filters.start_date && !!filters.end_date,
  })
}
