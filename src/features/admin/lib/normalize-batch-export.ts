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
    final_char_count: raw.final_char_count ?? null,
    annotator_1_total_char_difference: raw.annotator_1_total_char_difference ?? null,
    annotator_1_char_percent_diff: raw.annotator_1_char_percent_diff ?? null,
    annotator_2_total_char_difference: raw.annotator_2_total_char_difference ?? null,
    annotator_2_char_percent_diff: raw.annotator_2_char_percent_diff ?? null,
    annotator_3_total_char_difference: raw.annotator_3_total_char_difference ?? null,
    annotator_3_char_percent_diff: raw.annotator_3_char_percent_diff ?? null,
    reviewer_total_char_difference: raw.reviewer_total_char_difference ?? null,
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
