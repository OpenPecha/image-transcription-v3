import type {
  Itv3AnnotatorContributionSummary,
  Itv3ContributionRole,
  Itv3ContributionTask,
  Itv3ReviewerContributionSummary,
  UserContributionReportResponse,
} from '@/types/user-contribution-report'

type RawRecord = Record<string, unknown>

const toNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const toNullableNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const toText = (value: unknown): string => (typeof value === 'string' ? value : '')

const asRecord = (value: unknown): RawRecord | null =>
  typeof value === 'object' && value !== null ? (value as RawRecord) : null

function normalizeRole(value: unknown): Itv3ContributionRole {
  return value === 'reviewer' ? 'reviewer' : 'annotator'
}

function normalizeOrder(value: unknown): 1 | 2 | 3 | null {
  return value === 1 || value === 2 || value === 3 ? value : null
}

function normalizeTask(raw: RawRecord): Itv3ContributionTask {
  return {
    task_id: toText(raw.task_id),
    name: toText(raw.name),
    batch_name: toText(raw.batch_name),
    updated_time: toText(raw.updated_time),
    role: normalizeRole(raw.role),
    order: normalizeOrder(raw.order),
    rejection_count: toNumber(raw.rejection_count),
    final_char_count: toNullableNumber(raw.final_char_count),
    total_char_difference: toNullableNumber(raw.total_char_difference),
    char_percent_diff: toNullableNumber(raw.char_percent_diff),
    review_total_char_difference: toNullableNumber(raw.review_total_char_difference),
    rejections_made: toNullableNumber(raw.rejections_made),
    own_version_count: toNullableNumber(raw.own_version_count),
    own_version_sum: toNullableNumber(raw.own_version_sum),
    selected_option_count: toNullableNumber(raw.selected_option_count),
    selected_option_sum: toNullableNumber(raw.selected_option_sum),
    modified_option_count: toNullableNumber(raw.modified_option_count),
    modified_option_sum: toNullableNumber(raw.modified_option_sum),
  }
}

function normalizeAnnotatorSummary(
  value: unknown
): Itv3AnnotatorContributionSummary | null {
  const raw = asRecord(value)
  if (!raw) return null

  return {
    total_count: toNumber(raw.total_count),
    tasks_annotated: toNumber(raw.tasks_annotated),
    tasks_reviewed: toNumber(raw.tasks_reviewed),
    rejected_count: toNumber(raw.rejected_count),
    rejected_percent: toNumber(raw.rejected_percent),
    unrejected_tasks_percent: toNumber(raw.unrejected_tasks_percent),
    final_char_count: toNumber(raw.final_char_count),
    total_char_difference: toNumber(raw.total_char_difference),
    char_percent_diff: toNumber(raw.char_percent_diff),
  }
}

function normalizeReviewerSummary(
  value: unknown
): Itv3ReviewerContributionSummary | null {
  const raw = asRecord(value)
  if (!raw) return null

  return {
    total_count: toNumber(raw.total_count),
    tasks_reviewed: toNumber(raw.tasks_reviewed),
    final_char_count: toNumber(raw.final_char_count),
    review_total_char_difference: toNumber(raw.review_total_char_difference),
    rejections_made_count: toNumber(raw.rejections_made_count),
    rejections_made_percent: toNumber(raw.rejections_made_percent),
    unrejected_tasks_percent: toNumber(raw.unrejected_tasks_percent),
    own_version_count: toNumber(raw.own_version_count),
    own_version_sum: toNumber(raw.own_version_sum),
    selected_option_count: toNumber(raw.selected_option_count),
    selected_option_sum: toNumber(raw.selected_option_sum),
    modified_option_count: toNumber(raw.modified_option_count),
    modified_option_sum: toNumber(raw.modified_option_sum),
  }
}

/**
 * Normalize the raw contributions payload. Each role block stays independent so
 * a user who both annotated and reviewed keeps two separate sets of totals.
 */
export function normalizeUserContributionReport(
  response: unknown
): UserContributionReportResponse {
  const raw = asRecord(response)
  if (!raw) return emptyContributionReport()

  const summary = asRecord(raw.contribution_summary)
  const tasks = Array.isArray(raw.tasks) ? raw.tasks : []

  return {
    tasks: tasks
      .map(asRecord)
      .filter((task): task is RawRecord => task !== null)
      .map(normalizeTask),
    contribution_summary: {
      annotator: normalizeAnnotatorSummary(summary?.annotator),
      reviewer: normalizeReviewerSummary(summary?.reviewer),
    },
  }
}

export function emptyContributionReport(): UserContributionReportResponse {
  return {
    tasks: [],
    contribution_summary: {
      annotator: null,
      reviewer: null,
    },
  }
}

export function formatReportNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString()
}

export function formatReportSignedNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString()}`
}

export function formatReportPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
}

export function formatReportCountSum(
  count: number | null | undefined,
  sum: number | null | undefined
): string {
  if (count == null && sum == null) return '—'
  return `${formatReportNumber(count ?? 0)} / ${formatReportNumber(sum ?? 0)}`
}

export function getContributionSlotLabelKey(
  task: Pick<Itv3ContributionTask, 'role' | 'order'>
): 'annotatorA' | 'annotatorB' | 'annotatorC' | 'reviewer' {
  if (task.role === 'reviewer') return 'reviewer'
  if (task.order === 2) return 'annotatorB'
  if (task.order === 3) return 'annotatorC'
  return 'annotatorA'
}
