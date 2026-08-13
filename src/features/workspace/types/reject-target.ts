/**
 * Slot reject scope for ITV3 submit=false (reviewer in `reviewing` only).
 * Matches backend `ImageTranscriptionV3SubmitInput.reject_target`:
 * - 1 = Annotator A
 * - 2 = Annotator B
 * - 3 = Annotator C
 * - 4 = all annotators
 * - 5 = Annotators B + C
 * - 6 = Annotators A + B
 * - 7 = Annotators A + C
 */
export type RejectTarget = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const REJECT_TARGET_ANNOTATOR_A = 1 as const
export const REJECT_TARGET_ANNOTATOR_B = 2 as const
export const REJECT_TARGET_ANNOTATOR_C = 3 as const
export const REJECT_TARGET_ALL_ANNOTATORS = 4 as const
export const REJECT_TARGET_ANNOTATORS_BC = 5 as const
export const REJECT_TARGET_ANNOTATORS_AB = 6 as const
export const REJECT_TARGET_ANNOTATORS_AC = 7 as const

export type AnnotatorRejectSlot = 'A' | 'B' | 'C'

const SLOT_ORDER: AnnotatorRejectSlot[] = ['A', 'B', 'C']

/** Encode checkbox selections into the API `reject_target` enum. */
export function encodeRejectSlots(slots: Iterable<AnnotatorRejectSlot>): RejectTarget | null {
  const selected = new Set(slots)
  const hasA = selected.has('A')
  const hasB = selected.has('B')
  const hasC = selected.has('C')
  const count = Number(hasA) + Number(hasB) + Number(hasC)

  if (count === 0) return null
  if (hasA && hasB && hasC) return REJECT_TARGET_ALL_ANNOTATORS
  if (hasA && hasB) return REJECT_TARGET_ANNOTATORS_AB
  if (hasB && hasC) return REJECT_TARGET_ANNOTATORS_BC
  if (hasA && hasC) return REJECT_TARGET_ANNOTATORS_AC
  if (hasA) return REJECT_TARGET_ANNOTATOR_A
  if (hasB) return REJECT_TARGET_ANNOTATOR_B
  return REJECT_TARGET_ANNOTATOR_C
}

/** Decode an API `reject_target` into annotator slot checkboxes. */
export function decodeRejectTarget(target: RejectTarget): AnnotatorRejectSlot[] {
  switch (target) {
    case REJECT_TARGET_ANNOTATOR_A:
      return ['A']
    case REJECT_TARGET_ANNOTATOR_B:
      return ['B']
    case REJECT_TARGET_ANNOTATOR_C:
      return ['C']
    case REJECT_TARGET_ALL_ANNOTATORS:
      return [...SLOT_ORDER]
    case REJECT_TARGET_ANNOTATORS_BC:
      return ['B', 'C']
    case REJECT_TARGET_ANNOTATORS_AB:
      return ['A', 'B']
    case REJECT_TARGET_ANNOTATORS_AC:
      return ['A', 'C']
  }
}
