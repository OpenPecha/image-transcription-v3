import { useQuery } from '@tanstack/react-query'
import { ADMIN_FEATURE_AVAILABILITY } from '@/features/admin/lib/admin-feature-availability'
import { apiClient } from '@/lib/axios'
import { type BatchTask, type BatchTaskState } from '@/types'
import { batchKeys } from './batch-keys'

interface GetBatchTasksParams {
  batchId: string
  state?: BatchTaskState | 'all'
}

const getBatchTasks = async ({ batchId, state }: GetBatchTasksParams): Promise<BatchTask[]> => {
  const params = state && state !== 'all' ? { state } : {}
  return apiClient.get(`/batch/${batchId}/tasks`, { params })
}

export const useGetBatchTasks = (batchId: string, state?: BatchTaskState | 'all') => {
  return useQuery({
    queryKey: batchKeys.tasks(batchId, { state: state ?? 'all' }),
    queryFn: () => getBatchTasks({ batchId, state }),
    enabled: ADMIN_FEATURE_AVAILABILITY.batchTaskListing && !!batchId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

