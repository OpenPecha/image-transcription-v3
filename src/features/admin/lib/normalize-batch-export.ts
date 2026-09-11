import type { BatchExportResponse, BatchExportTask } from '@/types'

/** Raw export payload may use ITv2 (`final_transcript`) or ITv3 (`review_transcript`) names. */
type BatchExportTaskApiFields = Partial<BatchExportTask> & {
  file_number: string
  image_url: string
  orientation: BatchExportTask['orientation']
  state: BatchExportTask['state']
  review_transcript?: string | null
}

export type BatchExportApiResponse = {
  batch_name: string
  tasks?: BatchExportTaskApiFields[] | null
}

function nullableString(value: string | null | undefined): string | null {
  return value ?? null
}

function nullableNumber(value: number | null | undefined): number | null {
  return value ?? null
}

function resolveFinalTranscript(raw: BatchExportTaskApiFields): string | null {
  return raw.final_transcript ?? raw.review_transcript ?? null
}

/** Normalize one export row to the frontend BatchExportTask shape. */
export function normalizeBatchExportTask(raw: BatchExportTaskApiFields): BatchExportTask {
  return {
    file_number: raw.file_number,
    image_url: raw.image_url,
    orientation: raw.orientation,
    state: raw.state,
    final_transcript: resolveFinalTranscript(raw),
    annotator_1_id: nullableString(raw.annotator_1_id),
    annotator_1_text: nullableString(raw.annotator_1_text),
    annotator_2_id: nullableString(raw.annotator_2_id),
    annotator_2_text: nullableString(raw.annotator_2_text),
    annotator_3_id: nullableString(raw.annotator_3_id),
    annotator_3_text: nullableString(raw.annotator_3_text),
    reviewer_id: nullableString(raw.reviewer_id),
    annotator_1_assigned: nullableString(raw.annotator_1_assigned),
    annotator_1_submitted: nullableString(raw.annotator_1_submitted),
    annotator_2_assigned: nullableString(raw.annotator_2_assigned),
    annotator_2_submitted: nullableString(raw.annotator_2_submitted),
    annotator_3_assigned: nullableString(raw.annotator_3_assigned),
    annotator_3_submitted: nullableString(raw.annotator_3_submitted),
    reviewer_assigned: nullableString(raw.reviewer_assigned),
    reviewer_submitted: nullableString(raw.reviewer_submitted),
    annotation_a_rejection_count: nullableNumber(raw.annotation_a_rejection_count),
    annotation_b_rejection_count: nullableNumber(raw.annotation_b_rejection_count),
    annotation_c_rejection_count: nullableNumber(raw.annotation_c_rejection_count),
    changed_assignee_slots: nullableString(raw.changed_assignee_slots),
    final_char_count: nullableNumber(raw.final_char_count),
    annotator_1_total_char_difference: nullableNumber(raw.annotator_1_total_char_difference),
    annotator_1_char_percent_diff: nullableNumber(raw.annotator_1_char_percent_diff),
    annotator_2_total_char_difference: nullableNumber(raw.annotator_2_total_char_difference),
    annotator_2_char_percent_diff: nullableNumber(raw.annotator_2_char_percent_diff),
    annotator_3_total_char_difference: nullableNumber(raw.annotator_3_total_char_difference),
    annotator_3_char_percent_diff: nullableNumber(raw.annotator_3_char_percent_diff),
    reviewer_total_char_difference: nullableNumber(raw.reviewer_total_char_difference),
    annotator_group_similarity_ratio: nullableNumber(raw.annotator_group_similarity_ratio),
    annotator_group_diff_percentage: nullableNumber(raw.annotator_group_diff_percentage),
    annotator_group_min_similarity_ratio: nullableNumber(
      raw.annotator_group_min_similarity_ratio
    ),
  }
}

/** Normalize the batch export response to the frontend BatchExportResponse shape. */
export function normalizeBatchExportResponse(
  response: BatchExportApiResponse
): BatchExportResponse {
  return {
    batch_name: response.batch_name,
    tasks: (response.tasks ?? []).map(normalizeBatchExportTask),
  }
}
