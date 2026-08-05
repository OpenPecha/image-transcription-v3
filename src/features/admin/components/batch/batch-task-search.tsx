import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ADMIN_FEATURE_AVAILABILITY } from '@/features/admin/lib/admin-feature-availability'
import { cn } from '@/lib/utils'
import { BATCH_STATS_CONFIG, type BatchTaskSearchResult, type BatchTaskState } from '@/types'
import {
  MIN_SEARCH_LENGTH,
  useSearchApplicationTasks,
} from '../../api/batch/search-application-tasks'
import { TaskSearchPreviewDialog } from './task-search-preview-dialog'

export function BatchTaskSearch() {
  const { t } = useTranslation(['admin', 'common'])

  if (!ADMIN_FEATURE_AVAILABILITY.batchTaskSearch) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('featureAvailability.batchTaskSearchUnavailable')}
      </p>
    )
  }

  return <AvailableBatchTaskSearch />
}

function AvailableBatchTaskSearch() {
  const { t } = useTranslation(['admin', 'common'])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showMinCharsHint, setShowMinCharsHint] = useState(false)
  const [selectedTask, setSelectedTask] = useState<BatchTaskSearchResult | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const trimmedSubmittedQuery = submittedQuery.trim()
  const { data: results = [], isFetching, isError } =
    useSearchApplicationTasks(submittedQuery)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setShowMinCharsHint(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasSearched = trimmedSubmittedQuery.length >= MIN_SEARCH_LENGTH
  const showDropdown = isOpen && (showMinCharsHint || hasSearched)

  const handleSearch = () => {
    const trimmed = query.trim()

    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setShowMinCharsHint(true)
      setIsOpen(true)
      return
    }

    setShowMinCharsHint(false)
    setSubmittedQuery(trimmed)
    setIsOpen(true)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearch()
    }
  }

  const handleSelectTask = (task: BatchTaskSearchResult) => {
    setSelectedTask(task)
    setPreviewOpen(true)
    setIsOpen(false)
  }

  const handlePreviewOpenChange = (open: boolean) => {
    setPreviewOpen(open)
    if (!open) {
      setSelectedTask(null)
    }
  }

  return (
    <>
      <div ref={containerRef} className="relative w-full sm:max-w-md">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('batches.searchTasks')}
              className="h-9 pl-9"
              aria-label={t('batches.searchTasks')}
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            onClick={handleSearch}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {t('search', { ns: 'common' })}
          </Button>
        </div>

        {showDropdown && (
          <div
            className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md"
            role="listbox"
          >
            {showMinCharsHint && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {t('batches.searchMinChars', { count: MIN_SEARCH_LENGTH })}
              </p>
            )}

            {!showMinCharsHint && isFetching && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.loading')}
              </div>
            )}

            {!showMinCharsHint && !isFetching && isError && (
              <p className="px-3 py-3 text-sm text-destructive">
                {t('batches.searchFailed')}
              </p>
            )}

            {!showMinCharsHint && !isFetching && !isError && results.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                {t('batches.searchNoResults')}
              </p>
            )}

            {!showMinCharsHint &&
              !isFetching &&
              results.map((task) => {
                const stateConfig = BATCH_STATS_CONFIG[task.state as BatchTaskState]

                return (
                  <button
                    key={task.task_id}
                    type="button"
                    role="option"
                    className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-accent"
                    onClick={() => handleSelectTask(task)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{task.task_name}</p>
                      {task.batch_name && (
                        <p className="truncate text-xs text-muted-foreground">
                          {task.batch_name}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
                        stateConfig?.color || 'bg-muted text-muted-foreground'
                      )}
                    >
                      {stateConfig?.label || task.state}
                    </span>
                  </button>
                )
              })}
          </div>
        )}
      </div>

      <TaskSearchPreviewDialog
        task={selectedTask}
        open={previewOpen}
        onOpenChange={handlePreviewOpenChange}
      />
    </>
  )
}
