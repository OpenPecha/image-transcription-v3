import { parseTDiff, type Segment } from './parse-tdiff'
import {
  diffReviewerPrimaryUntilExpectedConsumed,
  findStackAnchorPosition,
  pushReferenceSegment,
  type ReferenceSegment,
} from './stack-reference-segments'

const T_DIFF_MARKUP = /<t-diff\s+data=/i

export function hasTDiffMarkup(text: string): boolean {
  return T_DIFF_MARKUP.test(text)
}

function pushSegment(
  segments: ReferenceSegment[],
  type: ReferenceSegment['type'],
  text: string
): void {
  if (!text) return
  const last = segments[segments.length - 1]
  if (last && last.type === type) {
    last.text += text
    return
  }
  segments.push({ type, text })
}

/**
 * Build reference-tab segments from the comparison transcript (`<t-diff>` markup).
 * Plain text stays unhighlighted; each differing s1/s2 pair is highlighted per slot.
 */
export function buildTDiffReferenceSegments(
  comparisonTranscript: string,
  optionIndex: number
): ReferenceSegment[] {
  const parsed = parseTDiff(comparisonTranscript)
  const segments: ReferenceSegment[] = []

  for (const seg of parsed) {
    if (seg.type === 'text') {
      pushSegment(segments, 'default', seg.content)
      continue
    }

    const slotText = seg.options[optionIndex] ?? ''
    const isDifferent = seg.options.some((opt, idx) => idx !== optionIndex && opt !== slotText)

    if (!isDifferent) {
      pushSegment(segments, 'default', slotText)
    } else {
      pushSegment(segments, 'highlight', slotText)
    }
  }

  return segments
}

function findNextTextSegment(parsed: Segment[], fromIndex: number) {
  for (let i = fromIndex; i < parsed.length; i++) {
    const seg = parsed[i]
    if (seg?.type === 'text') return seg
  }
  return null
}

/** Trim an over-captured `<t-diff>` gap down to the best annotator option match. */
export function normalizeTdiffPreviousChoice(
  rawGap: string,
  options: string[]
): string {
  if (!rawGap) return rawGap
  if (options.includes(rawGap)) return rawGap

  const byLength = [...options].sort((a, b) => b.length - a.length)
  for (const option of byLength) {
    if (option && rawGap.includes(option)) return option
  }

  return rawGap
}

function extractRawTdiffGap(
  reviewerTranscript: string,
  reviewerPos: number,
  nextText: { content: string } | null
): { rawGap: string; gapEnd: number } {
  let gapEnd = reviewerTranscript.length

  if (nextText) {
    const anchorPos = findStackAnchorPosition(
      reviewerTranscript,
      reviewerPos,
      nextText.content
    )
    if (anchorPos >= 0) gapEnd = anchorPos
  }

  return {
    rawGap: reviewerTranscript.slice(reviewerPos, gapEnd),
    gapEnd,
  }
}

/**
 * Highlight reviewer text that fills annotator `<t-diff>` gaps and any custom edits
 * inside ACT plain-text regions (including local reviewer diffs with no `<t-diff>` tag).
 */
export function buildActReviewerReferenceSegments(
  comparisonTranscript: string,
  reviewerTranscript: string
): ReferenceSegment[] {
  if (!reviewerTranscript.trim()) return []

  const parsed = parseTDiff(comparisonTranscript)
  if (parsed.length === 0) {
    return [{ type: 'default', text: reviewerTranscript }]
  }

  const hasOnlyDiffSegments =
    parsed.every((seg) => seg.type === 'diff') && hasTDiffMarkup(comparisonTranscript)
  if (hasOnlyDiffSegments) {
    return [{ type: 'highlight', text: reviewerTranscript }]
  }

  const segments: ReferenceSegment[] = []
  let reviewerPos = 0

  for (let i = 0; i < parsed.length; i++) {
    const seg = parsed[i]
    if (!seg) continue

    if (seg.type === 'text') {
      const { segments: chunkSegments, endPos } = diffReviewerPrimaryUntilExpectedConsumed(
        reviewerTranscript,
        reviewerPos,
        seg.content
      )
      for (const chunk of chunkSegments) {
        pushReferenceSegment(segments, chunk.type, chunk.text)
      }
      reviewerPos = endPos
      continue
    }

    const nextText = findNextTextSegment(parsed, i + 1)
    const { rawGap, gapEnd } = extractRawTdiffGap(
      reviewerTranscript,
      reviewerPos,
      nextText
    )
    const normalized = normalizeTdiffPreviousChoice(rawGap, seg.options)
    if (normalized) {
      pushReferenceSegment(segments, 'highlight', normalized)
    }
    reviewerPos = gapEnd
  }

  if (reviewerPos < reviewerTranscript.length) {
    pushReferenceSegment(
      segments,
      'highlight',
      reviewerTranscript.slice(reviewerPos)
    )
  }

  return segments
}
