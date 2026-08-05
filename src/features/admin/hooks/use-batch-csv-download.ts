import { useState, useCallback } from 'react'

import { ADMIN_FEATURE_AVAILABILITY } from '@/features/admin/lib/admin-feature-availability'
import { exportBatch } from '../api/batch'
import { exportBatchTasksToCsv } from '../utils/batch-csv-export'

type UseBatchCsvDownloadOptions = {
  batchId: string
  onError?: (error: Error) => void
}

type UseBatchCsvDownloadReturn = {
  download: () => Promise<void>
  isDownloading: boolean
  isAvailable: boolean
}

/**
 * Hook to download batch export data as CSV
 *
 * Fetches batch export data and triggers CSV download
 * Uses batch_name from API response for the filename
 */
export function useBatchCsvDownload({
  batchId,
  onError,
}: UseBatchCsvDownloadOptions): UseBatchCsvDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false)

  const download = useCallback(async () => {
    if (!ADMIN_FEATURE_AVAILABILITY.batchExport || !batchId || isDownloading) return

    setIsDownloading(true)

    try {
      const response = await exportBatch(batchId)

      if (response.tasks.length === 0) {
        onError?.(new Error('No tasks to export'))
        return
      }

      exportBatchTasksToCsv(response.tasks, response.batch_name)
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to download batch export')
      onError?.(errorMessage)
    } finally {
      setIsDownloading(false)
    }
  }, [batchId, isDownloading, onError])

  return {
    download,
    isDownloading,
    isAvailable: ADMIN_FEATURE_AVAILABILITY.batchExport,
  }
}
