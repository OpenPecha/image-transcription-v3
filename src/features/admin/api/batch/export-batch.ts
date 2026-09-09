import {
  normalizeBatchExportResponse,
  type BatchExportApiResponse,
} from '@/features/admin/lib/normalize-batch-export'
import { apiClient } from '@/lib/axios'
import { APPLICATION_NAME } from '@/lib/constant'
import type { BatchExportResponse } from '@/types'

/**
 * Fetches batch export data for CSV generation
 *
 * @param batchId - The batch ID to export
 * @returns Promise with batch name and tasks (file, image, orientation, state,
 *          transcripts, times, rejections, and reviewed-task character metrics)
 */
export const exportBatch = async (batchId: string): Promise<BatchExportResponse> => {
  const response = (await apiClient.get(
    `/batch/${APPLICATION_NAME}/${batchId}/export`
  )) as unknown as BatchExportApiResponse

  return normalizeBatchExportResponse(response)
}
