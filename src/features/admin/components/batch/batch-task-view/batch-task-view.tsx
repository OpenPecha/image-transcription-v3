import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ADMIN_FEATURE_AVAILABILITY } from '@/features/admin/lib/admin-feature-availability'
import { cn } from '@/lib/utils'
import { BATCH_STATS_CONFIG, type BatchTask, type BatchTaskState } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useUIStore } from '@/store/use-ui-store'
import { useGetBatchTasks, useRestoreTask, useGetBatchReport } from '../../../api/batch'
import { useBatchCsvDownload } from '../../../hooks/use-batch-csv-download'
import { TaskListSidebar } from './task-list-sidebar'
import { TaskPreview } from './task-preview'
import { UnavailableBatchTaskView } from './unavailable-batch-task-view'

const STATE_OPTION_KEYS: Array<{ value: BatchTaskState | 'all'; key: string }> = [
  { value: 'all', key: 'batches.states.all' },
  { value: 'pending', key: 'batches.states.pending' },
  { value: 'annotated_a', key: 'batches.states.annotated_a' },
  { value: 'annotated_b', key: 'batches.states.annotated_b' },
  { value: 'annotated', key: 'batches.states.annotated' },
  { value: 'reviewed', key: 'batches.states.reviewed' },
  { value: 'trashed', key: 'batches.states.trashed' },
]

export function BatchTaskView() {
  if (!ADMIN_FEATURE_AVAILABILITY.batchTaskListing) {
    return <UnavailableBatchTaskView />
  }

  return <AvailableBatchTaskView />
}

function AvailableBatchTaskView() {
  const { t } = useTranslation('admin')
  const { batchId } = useParams<{ batchId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToast } = useUIStore()

  // Get state filter from URL, default to 'all'
  const stateFilter = (searchParams.get('state') as BatchTaskState | 'all') || 'all'
  const taskIdFromUrl = searchParams.get('task_id')


  // API hooks
  const { data: report, isLoading: isLoadingReport } = useGetBatchReport(batchId!, true)
  const { data: tasks = [], isLoading: isLoadingTasks } = useGetBatchTasks(batchId!, stateFilter)
  const restoreTask = useRestoreTask()
  const restoringRef = useRef(false)

  // CSV download hook
  const { download: downloadCsv, isDownloading } = useBatchCsvDownload({
    batchId: batchId!,
    onError: (error) => {
      addToast({
        title: t('batches.downloadFailed'),
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Set selected task from URL or first task
  const selectedTask = useMemo(() => {
    if (tasks.length === 0) return null;
    
    if (taskIdFromUrl) {
      const taskFromUrl = tasks.find((t) => t.task_id === taskIdFromUrl);
      if (taskFromUrl) return taskFromUrl;
    }
    
    return tasks[0];
  }, [tasks, taskIdFromUrl]);

  // Update URL when task is selected
  const handleSelectTask = useCallback(
    (task: BatchTask) => {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('task_id', task.task_id)
      setSearchParams(newSearchParams)
    },
    [searchParams, setSearchParams]
  )

  // Handle state filter change
  const handleStateChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        prev.set('state', value)
        prev.delete('task_id') // Reset task selection when filter changes
        return prev
      })
    },
    [setSearchParams]
  )

  // Handle restore
  const handleRestore = useCallback(() => {
    if (!selectedTask || !batchId || restoringRef.current || restoreTask.isPending) return

    const { task_id: taskId, task_name: taskName } = selectedTask
    restoringRef.current = true

    restoreTask.mutate(
      { taskId, batchId },
      {
        onSuccess: () => {
          setSearchParams((prev) => {
            prev.delete('task_id')
            return prev
          })
          addToast({
            title: t('batches.taskRestored'),
            description: t('batches.taskRestoredDescription', { name: taskName }),
            variant: 'success',
          })
        },
        onError: (error: Error) => {
          addToast({
            title: t('batches.restoreFailed'),
            description: error.message,
            variant: 'destructive',
          })
        },
        onSettled: () => {
          restoringRef.current = false
        },
      }
    )
  }, [selectedTask, batchId, restoreTask, addToast, t, setSearchParams])

  // Get task count for current filter
  const getTaskCount = useCallback(
    (state: BatchTaskState | 'all') => {
      if (!report) return null
      if (state === 'all') return report.total_tasks
      return report[state]
    },
    [report]
  )

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/batches')}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('batches.back')}
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            {isLoadingReport ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              <h1 className="text-xl font-semibold">{report?.name || t('batches.batchTasks')}</h1>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Task count */}
          <span className="text-sm text-muted-foreground">
            {isLoadingTasks ? (
              <Skeleton className="h-5 w-20 inline-block" />
            ) : (
              t('batches.tasks', { count: tasks.length })
            )}
          </span>

          {/* State filter */}
          <Select value={stateFilter} onValueChange={handleStateChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('batches.filterByState')} />
            </SelectTrigger>
            <SelectContent>
              {STATE_OPTION_KEYS.map((option) => {
                const count = getTaskCount(option.value)
                const config = option.value !== 'all' 
                  ? BATCH_STATS_CONFIG[option.value] 
                  : null
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span>{t(option.key)}</span>
                      {count !== null && (
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            config?.color || 'bg-muted text-muted-foreground'
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {/* Download CSV */}
          <Button
            variant="outline"
            size="icon"
            onClick={downloadCsv}
            disabled={isDownloading || isLoadingReport}
            className="h-9 w-9"
            title={t('batches.downloadCsv')}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex border border-border rounded-lg overflow-hidden bg-background">
        {/* Task List Sidebar */}
        <div className="w-64 shrink-0">
          <TaskListSidebar
            tasks={tasks}
            selectedTaskId={selectedTask?.task_id || null}
            onSelectTask={handleSelectTask}
            isLoading={isLoadingTasks}
          />
        </div>

        {/* Task Preview */}
        <div className="flex-1 min-w-0">
          <TaskPreview
            task={selectedTask}
            onRestore={handleRestore}
            isRestoring={restoreTask.isPending}
            isLoading={isLoadingTasks && !selectedTask}
          />
        </div>
      </div>
    </div>
  )
}

