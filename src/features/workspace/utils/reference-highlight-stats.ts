import { buildStackReferenceSegments, type ReferenceSegment } from './stack-reference-segments'
import { buildTDiffReferenceSegments, hasTDiffMarkup } from './tdiff-reference-segments'

export type ReferenceHighlightStats = {
  characterLength: number
  highlightLength: number
  diffPercent: number
}

export function buildAnnotatorSlotReferenceSegments({
  value,
  otherValue,
  optionIndex,
  comparisonTranscript,
}: {
  value: string
  otherValue: string
  optionIndex: number
  comparisonTranscript?: string
}): ReferenceSegment[] {
  if (!value.trim()) return []

  if (!otherValue.trim()) return [{ type: 'default', text: value }]

  if (comparisonTranscript && hasTDiffMarkup(comparisonTranscript)) {
    return buildTDiffReferenceSegments(comparisonTranscript, optionIndex)
  }

  return buildStackReferenceSegments(value, otherValue, optionIndex === 0)
}

export function computeReferenceHighlightStats(
  segments: ReferenceSegment[]
): ReferenceHighlightStats {
  let characterLength = 0
  let highlightLength = 0

  for (const seg of segments) {
    characterLength += seg.text.length
    if (seg.type === 'highlight') {
      highlightLength += seg.text.length
    }
  }

  const diffPercent =
    characterLength > 0 ? (highlightLength / characterLength) * 100 : 0

  return { characterLength, highlightLength, diffPercent }
}
