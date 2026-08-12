import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Package, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useGetApplicationBatchReport, useGetBatches } from '../../api/batch'
import { APPLICATION_NAME } from '@/lib/constant'
import { ApplicationBatchSummary } from './application-batch-summary'
import { BatchItem, BatchItemSkeleton } from './batch-item'
import { BatchUploadDialog } from './batch-upload-dialog'
import { BatchTaskSearch } from './batch-task-search'

export function BatchList() {
  const { t } = useTranslation('admin')
  const { data: batches = [], isLoading: isBatchesLoading } = useGetBatches()
  const {
    data: applicationReports = [],
    isLoading: isApplicationReportLoading,
    isError: isApplicationReportError,
  } = useGetApplicationBatchReport(APPLICATION_NAME)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const reportIds = new Set(applicationReports.map((report) => report.id))
  const ungroupedBatches = batches.filter(
    (batch) => !reportIds.has(batch.group_name)
  )

  const isEmpty =
    !isApplicationReportLoading &&
    !isBatchesLoading &&
    applicationReports.length === 0 &&
    batches.length === 0

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('batches.cardTitle')}
          </CardTitle>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <BatchTaskSearch />
            <Button onClick={() => setUploadDialogOpen(true)} size="sm" className="shrink-0">
              <Upload className="mr-2 h-4 w-4" />
              {t('batches.uploadBatch')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isEmpty ? (
            <EmptyState onUploadClick={() => setUploadDialogOpen(true)} />
          ) : isApplicationReportError ? (
            <p className="py-4 text-sm text-muted-foreground">
              {t('batches.failedToLoadStats')}
            </p>
          ) : (
            <div className="space-y-4">
              {isApplicationReportLoading ? (
                <>
                  <ApplicationBatchSummary report={undefined} isLoading={true} />
                  <ApplicationBatchSummary report={undefined} isLoading={true} />
                </>
              ) : (
                applicationReports.map((report) => (
                  <ApplicationBatchSummary
                    key={report.id}
                    report={report}
                    batches={batches.filter(
                      (batch) => batch.group_name === report.id
                    )}
                    isLoading={false}
                    isBatchesLoading={isBatchesLoading}
                  />
                ))
              )}

              {!isApplicationReportLoading && ungroupedBatches.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-sm font-semibold tracking-tight">
                    {t('batches.ungrouped')}
                  </div>
                  {isBatchesLoading ? (
                    [...Array(2)].map((_, i) => <BatchItemSkeleton key={i} />)
                  ) : (
                    ungroupedBatches.map((batch) => (
                      <BatchItem key={batch.id} batch={batch} />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <BatchUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </>
  )
}

function EmptyState({ onUploadClick }: { onUploadClick: () => void }) {
  const { t } = useTranslation('admin')

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{t('batches.noBatches')}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {t('batches.noBatchesDescription')}
      </p>
      <Button onClick={onUploadClick} className="mt-4" size="sm">
        <Upload className="mr-2 h-4 w-4" />
        {t('batches.uploadFirstBatch')}
      </Button>
    </div>
  )
}
