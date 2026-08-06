/**
 * Slot reject scope for ITV3 submit=false (reviewer in `reviewing` only):
 * - 1 = Annotator A
 * - 2 = Annotator B
 * - 3 = Annotator C
 * - 4 = all annotators
 */
export type RejectTarget = 1 | 2 | 3 | 4

export const REJECT_TARGET_ANNOTATOR_A = 1 as const
export const REJECT_TARGET_ANNOTATOR_B = 2 as const
export const REJECT_TARGET_ANNOTATOR_C = 3 as const
export const REJECT_TARGET_ALL_ANNOTATORS = 4 as const
