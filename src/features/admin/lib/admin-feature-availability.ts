import { APPLICATION_NAME } from '@/lib/constant'

const isImageTranscriptionV3 = APPLICATION_NAME === 'imagetranscriptionv3'

/**
 * Soft-gate admin surfaces that the V3 backend still lacks.
 * Listing, search, CSV export, group contributions, and per-group batch reports
 * are available. Per-user contribution reports are not implemented for ITv3 yet.
 */
export const ADMIN_FEATURE_AVAILABILITY = {
  batchTaskListing: true,
  batchTaskSearch: true,
  groupContributions: true,
  userContributions: !isImageTranscriptionV3,
} as const
