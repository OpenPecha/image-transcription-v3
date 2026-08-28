import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  formatReportCountSum,
  formatReportNumber,
  formatReportPercent,
  formatReportSignedNumber,
  getContributionSlotLabelKey,
} from '@/lib/user-contribution-report'
import { useGetUserContributions } from '../../api/user'
import { UserReportSummary } from './user-report-summary'
import type { Itv3ContributionTask, User } from '@/types'

interface UserReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)

  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const contributionTableHeadCellClass =
  'sticky top-[-20px] z-20 bg-muted px-4 py-2.5 font-medium shadow-[0_1px_0_0_hsl(var(--border))]'

export function UserReportDialog({ open, onOpenChange, user }: UserReportDialogProps) {
  const { t } = useTranslation('admin')
  const defaultRange = useMemo(() => getDefaultDateRange(), [])

  const [startDate, setStartDate] = useState(defaultRange.start_date)
  const [endDate, setEndDate] = useState(defaultRange.end_date)
  const [appliedFilters, setAppliedFilters] = useState(defaultRange)

  const { data: report, isLoading } = useGetUserContributions(
    user.id ?? '',
    appliedFilters,
    open
  )

  const tasks = useMemo(() => report?.tasks ?? [], [report])

  const annotatorTasks = useMemo(
    () => tasks.filter((task) => task.role === 'annotator'),
    [tasks]
  )
  const reviewerTasks = useMemo(
    () => tasks.filter((task) => task.role === 'reviewer'),
    [tasks]
  )

  const handleApplyFilter = () => {
    setAppliedFilters({
      start_date: startDate,
      end_date: endDate,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilter()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90dvh,920px)] max-h-[92dvh] w-[min(96vw,80rem)] max-w-[80rem] flex-col gap-0 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {t('users.report.title')} - {user.username}
          </DialogTitle>
          <DialogDescription>{t('users.report.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-end gap-3 border-b pb-4 pt-4">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="start-date" className="text-xs">
              {t('users.report.startDate')}
            </Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 bg-muted/80 pl-9"
              />
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="end-date" className="text-xs">
              {t('users.report.endDate')}
            </Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 bg-muted/80 pl-9"
              />
            </div>
          </div>
          <Button onClick={handleApplyFilter} size="sm" className="h-9">
            {t('users.report.apply')}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto pt-4">
          <div className="flex flex-col gap-4">
            <UserReportSummary
              summary={report?.contribution_summary}
              isLoading={isLoading}
            />

            <h4 className="text-sm font-medium">{t('users.report.contributions')}</h4>

            {isLoading ? (
              <div className="rounded-lg border">
                <ContributionsTableSkeleton colCount={8} />
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-lg border">
                <EmptyContributions />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {annotatorTasks.length > 0 ? (
                  <TaskSection title={t('users.report.summary.annotationSection')}>
                    <AnnotatorContributionsTable tasks={annotatorTasks} />
                  </TaskSection>
                ) : null}

                {reviewerTasks.length > 0 ? (
                  <TaskSection title={t('users.report.summary.reviewSection')}>
                    <ReviewerContributionsTable tasks={reviewerTasks} />
                  </TaskSection>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TaskSectionProps {
  title: string
  children: React.ReactNode
}

function TaskSection({ title, children }: TaskSectionProps) {
  return (
    <section className="space-y-2">
      <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h5>
      <div className="rounded-lg border">{children}</div>
    </section>
  )
}

interface ContributionsTableProps {
  tasks: Itv3ContributionTask[]
}

function AnnotatorContributionsTable({ tasks }: ContributionsTableProps) {
  const { t } = useTranslation('admin')

  return (
    <table className="w-full min-w-max text-sm">
      <thead>
        <tr>
          <th className={cn(contributionTableHeadCellClass, 'text-left')}>
            {t('users.report.table.imageName')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-left')}>
            {t('users.report.table.batch')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-left')}>
            {t('users.report.table.slot')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.rejections')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.finalChars')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.charDiff')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.percentDiff')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.date')}
          </th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.task_id} className="border-t transition-colors hover:bg-muted/30">
            <td className="max-w-[220px] truncate px-4 py-2.5" title={task.name}>
              {task.name}
            </td>
            <td className="px-4 py-2.5">
              <BatchBadge name={task.batch_name} />
            </td>
            <td className="px-4 py-2.5 text-xs">
              {t(`users.report.table.slots.${getContributionSlotLabelKey(task)}`)}
            </td>
            <td className="px-4 py-2.5 text-right font-mono text-xs">
              <RejectionCell count={task.rejection_count} />
            </td>
            <td className="px-4 py-2.5 text-right font-mono text-xs">
              {formatReportNumber(task.final_char_count)}
            </td>
            <td className="px-4 py-2.5 text-right font-mono text-xs">
              {formatReportSignedNumber(task.total_char_difference)}
            </td>
            <td className="px-4 py-2.5 text-right font-mono text-xs">
              {formatReportPercent(task.char_percent_diff)}
            </td>
            <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
              {formatDateTime(task.updated_time)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ReviewerContributionsTable({ tasks }: ContributionsTableProps) {
  const { t } = useTranslation('admin')

  return (
    <table className="w-full min-w-max text-sm">
      <thead>
        <tr>
          <th className={cn(contributionTableHeadCellClass, 'text-left')}>
            {t('users.report.table.imageName')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-left')}>
            {t('users.report.table.batch')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.summary.rejectionsMade')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.finalChars')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.reviewCharDiff')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.ownVersion')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.selectedOption')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.modifiedOption')}
          </th>
          <th className={cn(contributionTableHeadCellClass, 'text-right')}>
            {t('users.report.table.date')}
          </th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.task_id} className="border-t transition-colors hover:bg-muted/30">
            <td className="max-w-[220px] truncate px-4 py-2.5" title={task.name}>
              {task.name}
            </td>
            <td className="px-4 py-2.5">
              <BatchBadge name={task.batch_name} />
            </td>
            <td className="px-4 py-2.5 text-right font-mono text-xs">
              <RejectionCell count={task.rejections_made ?? 0} />
            </td>
            <td className="px-4 py-2.5 text-right font-mono text-xs">
              {formatReportNumber(task.final_char_count)}
            </td>
            <td className="px-4 py-2.5 text-right font-mono text-xs">
              {formatReportSignedNumber(task.review_total_char_difference)}
            </td>
            <td className="px-4 py-2.5 text-right font-mono text-xs">
              {formatReportCountSum(task.own_version_count, task.own_version_sum)}
            </td>
            <td className="px-4 py-2.5 text-right font-mono text-xs">
              {formatReportCountSum(task.selected_option_count, task.selected_option_sum)}
            </td>
            <td className="px-4 py-2.5 text-right font-mono text-xs">
              {formatReportCountSum(task.modified_option_count, task.modified_option_sum)}
            </td>
            <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
              {formatDateTime(task.updated_time)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BatchBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
      {name}
    </span>
  )
}

function RejectionCell({ count }: { count: number }) {
  if (count <= 0) {
    return <span className="text-muted-foreground">0</span>
  }

  return <span className="font-semibold tabular-nums text-[rgb(255,1,1)]">{count}</span>
}

function EmptyContributions() {
  const { t } = useTranslation('admin')

  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium">{t('users.report.noContributions')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('users.report.noContributionsHint')}
      </p>
    </div>
  )
}

function ContributionsTableSkeleton({ colCount }: { colCount: number }) {
  return (
    <div className="space-y-0">
      <div
        className="grid gap-4 bg-muted/50 px-3 py-2"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {[...Array(colCount)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="grid gap-4 border-t px-3 py-2"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {[...Array(colCount)].map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}
