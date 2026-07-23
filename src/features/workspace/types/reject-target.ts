/**
 * Slot reject scope for ITV3 submit=false:
 * - Reviewer in `reviewing`: 1 = Annotator A, 2 = Annotator B, 3 = both
 * - Final Reviewer in `finalising`: 1 = Reviewer A, 2 = Reviewer B, 3 = both
 */
export type RejectTarget = 1 | 2 | 3

export const REJECT_TARGET_ANNOTATOR_A = 1 as const
export const REJECT_TARGET_ANNOTATOR_B = 2 as const
export const REJECT_TARGET_REVIEWER_A = 1 as const
export const REJECT_TARGET_REVIEWER_B = 2 as const
export const REJECT_TARGET_BOTH = 3 as const
