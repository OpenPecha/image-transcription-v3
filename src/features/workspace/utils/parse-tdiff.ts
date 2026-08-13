export type TextSegment = { type: 'text'; content: string }

export type DiffSelection =
  | { kind: 'preset'; index: number }
  | { kind: 'custom'; value: string }

export type DiffSegment = {
  type: 'diff'
  id: number
  options: string[]
  selected: DiffSelection | null
  customDraft: string
  /** True once the reviewer manually edits the custom input field. */
  customDraftEdited?: boolean
  /** True once the user explicitly confirms a choice; defaults start false. */
  confirmed: boolean
  isLocal?: boolean
}

/** Annotator option labels: A, B, C, … */
export function getAnnotatorOptionLabel(index: number): string {
  if (index < 0 || index > 25) return String(index + 1)
  return String.fromCharCode(65 + index)
}

/** Unique option text with every annotator slot that produced it. */
export type DiffOptionGroup = {
  text: string
  slotIndexes: number[]
}

/**
 * Groups identical option strings so the reviewer UI can show one row
 * with combined labels (e.g. A + C) instead of duplicate choices.
 */
export function groupDiffOptions(options: string[]): DiffOptionGroup[] {
  const groups: DiffOptionGroup[] = []
  const textToGroupIndex = new Map<string, number>()

  options.forEach((text, slotIndex) => {
    const existingIndex = textToGroupIndex.get(text)
    if (existingIndex !== undefined) {
      groups[existingIndex].slotIndexes.push(slotIndex)
      return
    }
    textToGroupIndex.set(text, groups.length)
    groups.push({ text, slotIndexes: [slotIndex] })
  })

  return groups
}

export function isPresetGroupSelected(
  seg: DiffSegment,
  group: DiffOptionGroup
): boolean {
  if (seg.selected?.kind !== 'preset') return false
  return group.slotIndexes.includes(seg.selected.index)
}

export type Segment = TextSegment | DiffSegment

function extractOptionsFromParsed(parsed: Record<string, unknown>): string[] {
  return Object.keys(parsed)
    .filter((key) => /^s\d+$/.test(key))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
    .map((key) => String(parsed[key] ?? ''))
}

export function getDiffProposedValue(seg: DiffSegment): string {
  if (!seg.selected) return seg.options[0] ?? ''
  if (seg.selected.kind === 'preset') {
    return seg.options[seg.selected.index] ?? ''
  }
  return seg.selected.value
}

export function getDiffResolvedValue(seg: DiffSegment): string {
  if (!isDiffResolved(seg)) return ''
  return getDiffProposedValue(seg)
}

export function formatDiffDisplay(text: string): string {
  if (text === '') return '∅'
  return text.replace(/\n/g, ' ↵ ')
}

export function isDuplicateReviewerInput(
  seg: DiffSegment,
  value: string = seg.customDraft
): boolean {
  return seg.options.some((option) => option === value)
}

export function isDiffResolved(seg: DiffSegment): boolean {
  if (seg.confirmed !== true) return false
  if (seg.selected?.kind === 'custom' && isDuplicateReviewerInput(seg)) {
    return false
  }
  return true
}

/**
 * Splits raw transcript into segments. Each diff defaults to annotator A (preset index 0).
 */
export function parseTDiff(raw: string): Segment[] {
  if (!raw) return []

  const segments: Segment[] = []
  const regex = /<t-diff\s+data=(['"])(.*?)\1\s*(?:\/>|><\/t-diff>)/g

  let lastIndex = 0
  let match
  let id = 0

  while ((match = regex.exec(raw)) !== null) {
    const matchIndex = match.index
    const matchText = match[0]
    const jsonData = match[2]

    if (matchIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: raw.substring(lastIndex, matchIndex),
      })
    }

    try {
      const decodedJson = jsonData
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')

      const parsed = JSON.parse(decodedJson) as Record<string, unknown>
      const options = extractOptionsFromParsed(parsed)
      segments.push({
        type: 'diff',
        id: id++,
        options,
        selected: options.length > 0 ? { kind: 'preset', index: 0 } : null,
        customDraft: options[0] ?? '',
        customDraftEdited: false,
        confirmed: false,
      })
    } catch {
      segments.push({
        type: 'text',
        content: matchText,
      })
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < raw.length) {
    segments.push({
      type: 'text',
      content: raw.substring(lastIndex),
    })
  }

  return segments
}

export function resolveSegments(segments: Segment[]): string {
  return segments
    .map((seg) => {
      if (seg.type === 'text') {
        return seg.content
      }
      return isDiffResolved(seg) ? getDiffProposedValue(seg) : ''
    })
    .join('')
}

/** Preview text including unconfirmed defaults (annotator A). */
export function resolveSegmentsPreview(segments: Segment[]): string {
  return segments
    .map((seg) => {
      if (seg.type === 'text') {
        return seg.content
      }
      return getDiffProposedValue(seg)
    })
    .join('')
}

export function allDiffsResolved(segments: Segment[]): boolean {
  return segments.every((seg) => seg.type !== 'diff' || isDiffResolved(seg))
}

/**
 * Count confirmed preset resolutions for slots A/B/C (indexes 0/1/2).
 * Custom choices are excluded. When several slots share the chosen text
 * (grouped option), each matching slot is credited.
 */
export function countPresetResolutionChoices(
  diffSegments: DiffSegment[]
): { countA: number; countB: number; countC: number } {
  let countA = 0
  let countB = 0
  let countC = 0

  for (const seg of diffSegments) {
    if (!isDiffResolved(seg) || seg.selected?.kind !== 'preset') continue
    const selectedText = seg.options[seg.selected.index]
    if (selectedText === undefined) continue

    seg.options.forEach((option, index) => {
      if (option !== selectedText) return
      if (index === 0) countA++
      else if (index === 1) countB++
      else if (index === 2) countC++
    })
  }

  return { countA, countB, countC }
}

export function getNextDiffId(segments: Segment[]): number {
  return segments.reduce(
    (max, seg) => (seg.type === 'diff' ? Math.max(max, seg.id) : max),
    -1
  ) + 1
}

export type LocalDiffTarget = {
  segmentIndex: number
  start: number
  end: number
  text: string
}

export function insertLocalDiff(
  segments: Segment[],
  target: LocalDiffTarget,
  diffId: number
): Segment[] | null {
  const segment = segments[target.segmentIndex]
  if (segment?.type !== 'text') return null

  const selectedText = segment.content.slice(target.start, target.end)
  if (!selectedText || selectedText !== target.text) return null

  const before = segment.content.slice(0, target.start)
  const after = segment.content.slice(target.end)
  const diffSegment: DiffSegment = {
    type: 'diff',
    id: diffId,
    options: [selectedText],
    selected: { kind: 'custom', value: selectedText },
    customDraft: selectedText,
    customDraftEdited: true,
    confirmed: false,
    isLocal: true,
  }

  const next: Segment[] = []
  for (let i = 0; i < segments.length; i++) {
    if (i !== target.segmentIndex) {
      next.push(segments[i])
      continue
    }
    if (before) next.push({ type: 'text', content: before })
    next.push(diffSegment)
    if (after) next.push({ type: 'text', content: after })
  }

  return next
}

function coalesceAdjacentText(segments: Segment[]): Segment[] {
  const result: Segment[] = []
  for (const seg of segments) {
    const prev = result[result.length - 1]
    if (seg.type === 'text' && prev?.type === 'text') {
      result[result.length - 1] = { type: 'text', content: prev.content + seg.content }
    } else {
      result.push(seg)
    }
  }
  return result
}

export function removeLocalDiff(segments: Segment[], diffId: number): Segment[] | null {
  const index = segments.findIndex((seg) => seg.type === 'diff' && seg.id === diffId)
  if (index === -1) return null

  const diff = segments[index] as DiffSegment
  if (!diff.isLocal) return null

  const restored = diff.options[0] ?? ''
  const result: Segment[] = []

  for (let i = 0; i < segments.length; i++) {
    if (i !== index) {
      result.push(segments[i])
      continue
    }

    const prev = result[result.length - 1]
    const next = segments[i + 1]

    if (prev?.type === 'text') {
      result[result.length - 1] = { type: 'text', content: prev.content + restored }
    } else {
      result.push({ type: 'text', content: restored })
    }

    if (next?.type === 'text') {
      const last = result[result.length - 1] as TextSegment
      result[result.length - 1] = { type: 'text', content: last.content + next.content }
      i++
    }
  }

  return coalesceAdjacentText(result)
}

const DIFF_DRAFT_KEY_PREFIX = 'draft_task_diff_'
const SEGMENT_DRAFT_KEY_PREFIX = 'draft_task_segments_'

export function getDiffDraftKey(taskId: string): string {
  return `${DIFF_DRAFT_KEY_PREFIX}${taskId}`
}

type LegacyDraftSelection = 's1' | 's2' | null

type StoredDiffDraft =
  | LegacyDraftSelection
  | DiffSelection
  | null
  | {
      selected: DiffSelection | null
      customDraft?: string
    }

type DiffDraftEntry = {
  selected: DiffSelection | null
  customDraft: string
  customDraftEdited?: boolean
  confirmed: boolean
}

function inferCustomDraftEdited(
  seg: DiffSegment,
  selected: DiffSelection | null,
  customDraft: string
): boolean {
  if (selected?.kind === 'custom') return true
  if (selected?.kind === 'preset') {
    return customDraft !== (seg.options[selected.index] ?? '')
  }
  return customDraft !== (seg.options[0] ?? '')
}

function normalizeDraftSelection(value: unknown): DiffSelection | null {
  if (value === null || value === undefined) return null
  if (value === 's1') return { kind: 'preset', index: 0 }
  if (value === 's2') return { kind: 'preset', index: 1 }
  if (typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  if ('selected' in record) {
    return normalizeDraftSelection(record.selected)
  }

  const selection = value as Partial<DiffSelection>
  if (selection.kind === 'preset' && typeof selection.index === 'number') {
    return { kind: 'preset', index: selection.index }
  }
  if (selection.kind === 'custom' && typeof selection.value === 'string') {
    return { kind: 'custom', value: selection.value }
  }
  return null
}

function normalizeDraftEntry(value: unknown): DiffDraftEntry {
  const selected = normalizeDraftSelection(value)
  if (value !== null && typeof value === 'object' && 'selected' in value) {
    const record = value as {
      selected: unknown
      customDraft?: unknown
      customDraftEdited?: unknown
      confirmed?: unknown
    }
    const customDraft =
      typeof record.customDraft === 'string'
        ? record.customDraft
        : selected?.kind === 'custom'
          ? selected.value
          : ''
    const confirmed =
      typeof record.confirmed === 'boolean' ? record.confirmed : selected !== null
    const customDraftEdited =
      typeof record.customDraftEdited === 'boolean' ? record.customDraftEdited : undefined
    return { selected, customDraft, customDraftEdited, confirmed }
  }

  return {
    selected,
    customDraft: selected?.kind === 'custom' ? selected.value : '',
    customDraftEdited: selected?.kind === 'custom' ? true : undefined,
    confirmed: selected !== null,
  }
}

export function loadDiffDraftSelections(
  taskId: string
): Record<number, DiffDraftEntry> | null {
  try {
    const stored = localStorage.getItem(getDiffDraftKey(taskId))
    if (!stored) return null

    const parsed = JSON.parse(stored) as Record<string, StoredDiffDraft>
    const drafts: Record<number, DiffDraftEntry> = {}

    for (const [key, value] of Object.entries(parsed)) {
      drafts[Number(key)] = normalizeDraftEntry(value)
    }

    return drafts
  } catch {
    return null
  }
}

export function saveDiffDraftSelections(taskId: string, segments: Segment[]): void {
  const drafts = segments.reduce(
    (acc, seg) => {
      if (seg.type === 'diff') {
        acc[seg.id] = {
          selected: seg.selected,
          customDraft: seg.customDraft,
          customDraftEdited: seg.customDraftEdited,
          confirmed: seg.confirmed,
        }
      }
      return acc
    },
    {} as Record<number, DiffDraftEntry>
  )
  localStorage.setItem(getDiffDraftKey(taskId), JSON.stringify(drafts))
}

export function saveSegmentDraft(
  taskId: string,
  segments: Segment[],
  baseTranscript: string
): void {
  localStorage.setItem(
    `${SEGMENT_DRAFT_KEY_PREFIX}${taskId}`,
    JSON.stringify({ baseTranscript, segments })
  )
}

export function loadSegmentDraft(
  taskId: string,
  baseTranscript: string
): Segment[] | null {
  try {
    const stored = localStorage.getItem(`${SEGMENT_DRAFT_KEY_PREFIX}${taskId}`)
    if (!stored) return null

    const parsed = JSON.parse(stored) as { baseTranscript: string; segments: Segment[] }
    if (parsed.baseTranscript !== baseTranscript) return null
    return parsed.segments.map((seg) => {
      if (seg.type !== 'diff') return seg
      const diff = seg as DiffSegment
      const customDraftEdited =
        typeof diff.customDraftEdited === 'boolean'
          ? diff.customDraftEdited
          : inferCustomDraftEdited(diff, diff.selected, diff.customDraft)
      return {
        ...diff,
        customDraftEdited,
        confirmed: typeof diff.confirmed === 'boolean' ? diff.confirmed : true,
      }
    })
  } catch {
    return null
  }
}

export function clearDiffDraft(taskId: string): void {
  localStorage.removeItem(getDiffDraftKey(taskId))
  localStorage.removeItem(`${SEGMENT_DRAFT_KEY_PREFIX}${taskId}`)
}

export function applyDiffSelections(
  segments: Segment[],
  drafts: Record<number, DiffDraftEntry>
): Segment[] {
  return segments.map((seg) => {
    if (seg.type !== 'diff' || drafts[seg.id] === undefined) {
      return seg
    }

    const { selected, customDraft, confirmed, customDraftEdited } = drafts[seg.id]
    if (selected?.kind === 'preset' && selected.index >= seg.options.length) {
      return { ...seg, selected: null, customDraft, customDraftEdited: false, confirmed: false }
    }

    const resolvedCustomDraftEdited =
      customDraftEdited ?? inferCustomDraftEdited(seg, selected, customDraft)

    return {
      ...seg,
      selected,
      customDraft,
      customDraftEdited: resolvedCustomDraftEdited,
      confirmed,
    }
  })
}
