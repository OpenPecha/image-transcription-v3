import { APPLICATION_NAME } from '@/lib/constant'

const isImageTranscriptionV3 = APPLICATION_NAME === 'imagetranscriptionv3'

export const ADMIN_FEATURE_AVAILABILITY = {
  batchTaskListing: !isImageTranscriptionV3,
  batchTaskSearch: !isImageTranscriptionV3,
  batchExport: !isImageTranscriptionV3,
  contributions: !isImageTranscriptionV3,
} as const
