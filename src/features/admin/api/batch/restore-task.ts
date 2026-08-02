import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { batchKeys } from './batch-keys'
import { APPLICATION_NAME } from '@/lib/constant'
import type { ApplicationBatchReport, BatchReport, BatchTask } from '@/types'

interface RestoreTaskParams {
  taskId: string
  batchId: string
}

const restoreTask = async ({ taskId }: RestoreTaskParams): Promise<void> => {
  return apiClient.post(`/tasks/${APPLICATION_NAME}/${taskId}/restore`)
}

/** Update TanStack Query cache locally after a successful restore — no refetch. */
export function applyRestoreTaskCache(
  queryClient: QueryClient,
  batchId: string,
  taskId: string
): void {
  queryClient.setQueryData<BatchTask[]>(
    batchKeys.tasks(batchId, { state: 'trashed' }),
    (old) => old?.filter((task) => task.task_id !== taskId) ?? old
  )

  queryClient.setQueryData<BatchTask[]>(
    batchKeys.tasks(batchId, { state: 'all' }),
    (old) =>
      old?.map((task) =>
        task.task_id === taskId ? { ...task, state: 'pending' as const } : task
      ) ?? old
  )

  queryClient.setQueryData<BatchReport>(batchKeys.report(batchId), (old) => {
    if (!old) return old
    return {
      ...old,
      trashed: Math.max(0, old.trashed - 1),
      pending: old.pending + 1,
    }
  })

  queryClient.setQueryData<ApplicationBatchReport>(
    batchKeys.applicationReport(APPLICATION_NAME),
    (old) => {
      if (!old) return old
      return {
        ...old,
        trashed: Math.max(0, old.trashed - 1),
        pending: old.pending + 1,
      }
    }
  )
}

export const useRestoreTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restoreTask,
    onSuccess: (_, { batchId, taskId }) => {
      applyRestoreTaskCache(queryClient, batchId, taskId)
    },
  })
}
