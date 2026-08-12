import { APPLICATION_NAME } from '@/lib/constant'

const isImageTranscriptionV3 = APPLICATION_NAME === 'imagetranscriptionv3'

export const ADMIN_FEATURE_AVAILABILITY = {
  batchTaskListing: !isImageTranscriptionV3,
  batchTaskSearch: !isImageTranscriptionV3,
  batchExport: !isImageTranscriptionV3,
  /** Group contribution summaries are implemented for ITv3. */
  groupContributions: true,
  /** Per-user contribution reports are not implemented for ITv3 yet. */
  userContributions: !isImageTranscriptionV3,
} as const
