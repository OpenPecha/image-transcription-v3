import { useQuery } from '@tanstack/react-query'
import { ADMIN_FEATURE_AVAILABILITY } from '@/features/admin/lib/admin-feature-availability'
import { apiClient } from '@/lib/axios'
import { APPLICATION_NAME } from '@/lib/constant'
import type { BatchTaskSearchResult } from '@/types'
import { batchKeys } from './batch-keys'

const MIN_SEARCH_LENGTH = 2

const searchApplicationTasks = async (
  applicationName: string,
  taskName: string
): Promise<BatchTaskSearchResult[]> => {
  const data = (await apiClient.get<
    BatchTaskSearchResult | BatchTaskSearchResult[] | null
  >(`/batch/application/${applicationName}/tasks/search`, {
    params: { task_name: taskName },
  })) as unknown as BatchTaskSearchResult | BatchTaskSearchResult[] | null

  if (!data) return []
  return Array.isArray(data) ? data : [data]
}

export const useSearchApplicationTasks = (submittedTaskName: string) => {
  const trimmedTaskName = submittedTaskName.trim()
  const enabled =
    ADMIN_FEATURE_AVAILABILITY.batchTaskSearch &&
    trimmedTaskName.length >= MIN_SEARCH_LENGTH

  return useQuery({
    queryKey: batchKeys.taskSearch(APPLICATION_NAME, trimmedTaskName),
    queryFn: () => searchApplicationTasks(APPLICATION_NAME, trimmedTaskName),
    enabled,
    staleTime: 1000 * 30,
  })
}

export { MIN_SEARCH_LENGTH }
