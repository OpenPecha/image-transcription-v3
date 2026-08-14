import { APPLICATION_NAME } from '@/lib/constant'

const isImageTranscriptionV3 = APPLICATION_NAME === 'imagetranscriptionv3'

/**
 * Soft-gate admin surfaces that the V3 backend still lacks.
 * Listing, search, group contributions, and per-group batch reports are available.
 * CSV export and per-user contribution reports are not implemented for ITv3 yet.
 */
export const ADMIN_FEATURE_AVAILABILITY = {
  batchTaskListing: true,
  batchTaskSearch: true,
  batchExport: !isImageTranscriptionV3,
  groupContributions: true,
  userContributions: !isImageTranscriptionV3,
} as const
