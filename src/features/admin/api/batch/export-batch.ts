import { ADMIN_FEATURE_AVAILABILITY } from '@/features/admin/lib/admin-feature-availability'
import { apiClient } from '@/lib/axios'
import { APPLICATION_NAME } from '@/lib/constant'
import type { BatchExportResponse } from '@/types'

/**
 * Fetches batch export data for CSV generation
 *
 * @param batchId - The batch ID to export
 * @returns Promise with batch name and tasks (file, image, orientation, final transcript)
 */
export const exportBatch = async (batchId: string): Promise<BatchExportResponse> => {
  if (!ADMIN_FEATURE_AVAILABILITY.batchExport) {
    throw new Error('Batch export is not available for Image Transcription V3 yet')
  }

  return apiClient.get(`/batch/${APPLICATION_NAME}/${batchId}/export`)
}
