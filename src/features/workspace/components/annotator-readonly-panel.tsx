import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { buildAnnotatorSlotReferenceSegments } from '../utils/reference-highlight-stats'
import { buildActReviewerReferenceSegments } from '../utils/tdiff-reference-segments'
export type ReadonlyPanelHighlightMode = 'annotator-slot' | 'act-reviewer'

interface AnnotatorReadonlyPanelProps {
  value: string
  /** Other slot transcript used to highlight differing regions. */
  otherValue?: string
  /** True for slot 1 (A); false for slot 2 (B). */
  isPrimarySlot?: boolean
  optionIndex?: number
  /** Comparison transcript with `<t-diff>` tags — preferred for highlight boundaries. */
  comparisonTranscript?: string
  highlightMode?: ReadonlyPanelHighlightMode
  placeholder: string
  fontFamily: string
  fontSize: number
}

export function AnnotatorReadonlyPanel({
  value,
  otherValue = '',
  isPrimarySlot = true,
  optionIndex,
  comparisonTranscript,
  highlightMode = 'annotator-slot',
  placeholder,
  fontFamily,
  fontSize,
}: AnnotatorReadonlyPanelProps) {
  const segments = useMemo(() => {
    if (!value.trim()) return []

    if (highlightMode === 'act-reviewer' && comparisonTranscript) {
      return buildActReviewerReferenceSegments(comparisonTranscript, value)
    }

    const resolvedOptionIndex = optionIndex !== undefined ? optionIndex : (isPrimarySlot ? 0 : 1)

    return buildAnnotatorSlotReferenceSegments({
      value,
      otherValue,
      optionIndex: resolvedOptionIndex,
      comparisonTranscript,
    })
  }, [value, otherValue, isPrimarySlot, optionIndex, comparisonTranscript, highlightMode])
  const sharedStyle = { fontFamily, fontSize: `${fontSize}px`, lineHeight: 1.8 }

  if (!value.trim()) {
    return (
      <div className="flex flex-1 flex-col min-h-0">
        <div
          className="flex flex-1 items-center justify-center p-5 text-sm text-muted-foreground"
          style={sharedStyle}
        >
          {placeholder}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto bg-card p-5">
        <p
          className="whitespace-pre-wrap text-foreground select-text"
          style={sharedStyle}
        >
          {segments.map((seg, index) =>
            seg.type === 'highlight' ? (
              <mark
                key={index}
                className={cn(
                  'rounded px-0.5',
                  'bg-amber-200/80 text-amber-950 ring-1 ring-amber-300/80',
                  'dark:bg-amber-900/50 dark:text-amber-100 dark:ring-amber-700/80'
                )}
              >
                {seg.text}
              </mark>
            ) : (
              <span key={index}>{seg.text}</span>
            )
          )}
        </p>
      </div>
    </div>
  )
}
