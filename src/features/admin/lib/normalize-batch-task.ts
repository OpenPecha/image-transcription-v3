import type { BatchTask, BatchTaskSearchResult } from '@/types'

/** Raw batch-task payload may use ITv2 (`reviewer_a_*`) or ITv3 (`reviewer_*`) names. */
type BatchTaskApiFields = {
  reviewer_a_username?: string | null
  reviewer_username?: string | null
  reviewed_transcript_order_1?: string | null
  reviewed_transcript?: string | null
}

function resolveReviewerUsername(raw: BatchTaskApiFields): string | null | undefined {
  return raw.reviewer_a_username ?? raw.reviewer_username
}

function resolveReviewedTranscript(raw: BatchTaskApiFields): string | null {
  return raw.reviewed_transcript_order_1 ?? raw.reviewed_transcript ?? null
}

/** Normalize list/overview task items to the frontend BatchTask shape. */
export function normalizeBatchTask(
  task: BatchTask & BatchTaskApiFields
): BatchTask {
  return {
    ...task,
    reviewer_a_username: resolveReviewerUsername(task),
  }
}

/** Normalize cross-batch search items to the frontend BatchTaskSearchResult shape. */
export function normalizeBatchTaskSearchResult(
  task: BatchTaskSearchResult & BatchTaskApiFields
): BatchTaskSearchResult {
  return {
    ...task,
    reviewer_a_username: resolveReviewerUsername(task),
    reviewed_transcript_order_1: resolveReviewedTranscript(task),
  }
}
