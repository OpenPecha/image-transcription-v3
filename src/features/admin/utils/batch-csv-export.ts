import Papa from 'papaparse'

import type { BatchExportTask } from '@/types'

/**
 * CSV column headers mapping to BatchExportTask fields
 * Order determines column order in exported CSV
 */
const CSV_COLUMNS = [
  { key: 'file_number', header: 'File Number' },
  { key: 'image_url', header: 'Image URL' },
  { key: 'orientation', header: 'Orientation' },
  { key: 'state', header: 'Status' },
  { key: 'final_transcript', header: 'Final Transcript' },
  { key: 'annotator_1_text', header: 'Annotator 1 Text' },
  { key: 'annotator_2_text', header: 'Annotator 2 Text' },
  { key: 'annotator_3_text', header: 'Annotator 3 Text' },
  { key: 'annotator_1_assigned', header: 'Annotator 1 Assigned' },
  { key: 'annotator_1_submitted', header: 'Annotator 1 Submitted' },
  { key: 'annotator_2_assigned', header: 'Annotator 2 Assigned' },
  { key: 'annotator_2_submitted', header: 'Annotator 2 Submitted' },
  { key: 'annotator_3_assigned', header: 'Annotator 3 Assigned' },
  { key: 'annotator_3_submitted', header: 'Annotator 3 Submitted' },
  { key: 'reviewer_assigned', header: 'Reviewer Assigned' },
  { key: 'reviewer_submitted', header: 'Reviewer Submitted' },
  { key: 'annotation_a_rejection_count', header: 'Annotation A Rejection Count' },
  { key: 'annotation_b_rejection_count', header: 'Annotation B Rejection Count' },
  { key: 'annotation_c_rejection_count', header: 'Annotation C Rejection Count' },
  { key: 'changed_assignee_slots', header: 'Changed Assignee Slots' },
  { key: 'final_char_count', header: 'Final Char Count' },
  { key: 'annotator_1_total_char_difference', header: 'Annotator 1 Total Char Difference' },
  { key: 'annotator_1_char_percent_diff', header: 'Annotator 1 Char Percent Diff' },
  { key: 'annotator_2_total_char_difference', header: 'Annotator 2 Total Char Difference' },
  { key: 'annotator_2_char_percent_diff', header: 'Annotator 2 Char Percent Diff' },
  { key: 'annotator_3_total_char_difference', header: 'Annotator 3 Total Char Difference' },
  { key: 'annotator_3_char_percent_diff', header: 'Annotator 3 Char Percent Diff' },
  { key: 'reviewer_total_char_difference', header: 'Reviewer Total Char Difference' },
  { key: 'annotator_group_similarity_ratio', header: 'Annotator Group Similarity Ratio' },
  { key: 'annotator_group_diff_percentage', header: 'Annotator Group Diff Percentage' },
  { key: 'annotator_group_min_similarity_ratio', header: 'Annotator Group Min Similarity Ratio' },
] as const satisfies ReadonlyArray<{ key: keyof BatchExportTask; header: string }>

type MissingExportCsvColumns = Exclude<
  keyof BatchExportTask,
  (typeof CSV_COLUMNS)[number]['key']
>
type AssertAllExportFieldsMapped = [MissingExportCsvColumns] extends [never] ? true : never
const _allExportFieldsMapped: AssertAllExportFieldsMapped = true
void _allExportFieldsMapped

/**
 * Transforms a BatchExportTask to a CSV row with all fields
 * Null values are converted to empty strings
 */
function transformTaskToCsvRow(task: BatchExportTask): Record<string, string | number> {
  const row: Record<string, string | number> = {}

  for (const { key, header } of CSV_COLUMNS) {
    const value = task[key]
    row[header] = value ?? ''
  }

  return row
}

/**
 * Sanitizes filename by removing invalid characters
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'batch-export'
}

/**
 * Triggers a browser download for the given content
 */
function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Exports batch tasks to CSV and triggers download
 *
 * @param tasks - Array of batch export tasks to export
 * @param batchName - Name of the batch (used for filename)
 */
export function exportBatchTasksToCsv(tasks: BatchExportTask[], batchName: string): void {
  if (tasks.length === 0) {
    return
  }

  const csvRows = tasks.map(transformTaskToCsvRow)
  const headers = CSV_COLUMNS.map(({ header }) => header)

  const csvContent = Papa.unparse(csvRows, {
    columns: headers,
    quotes: true,
    newline: '\n',
  })

  const filename = `${sanitizeFilename(batchName)}.csv`
  downloadFile(csvContent, filename)
}
