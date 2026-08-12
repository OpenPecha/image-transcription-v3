import { useQuery } from '@tanstack/react-query'
import type { ApplicationBatchReport } from '@/types'
import { apiClient } from '@/lib/axios'
import { batchKeys } from './batch-keys'

const getApplicationBatchReport = async (
  applicationName: string
): Promise<ApplicationBatchReport[]> => {
  const response = (await apiClient.get(
    `/batch/application/${applicationName}/reports`
  )) as ApplicationBatchReport[] | ApplicationBatchReport | null

  if (Array.isArray(response)) return response
  return response ? [response] : []
}

export const useGetApplicationBatchReport = (applicationName: string) => {
  return useQuery({
    queryKey: batchKeys.applicationReport(applicationName),
    queryFn: () => getApplicationBatchReport(applicationName),
    enabled: !!applicationName,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  })
}
