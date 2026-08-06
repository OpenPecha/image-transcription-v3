import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import {
  getWorkspaceRejectionDisplay,
  type WorkspaceRejectionSource,
} from '@/lib/rejection-counts'
import {
  isAnnotatorRole,
  isReviewerRole,
} from '@/features/workspace/workspace-role-config'
import { normalizeUserRole } from '@/types'

type TaskRejectionInfoProps = {
  task: WorkspaceRejectionSource
  role: string | undefined
}

export function TaskRejectionInfo({ task, role }: TaskRejectionInfoProps) {
  const { t } = useTranslation('workspace')
  const display = getWorkspaceRejectionDisplay(task, role)

  if (!display) return null

  const normalizedRole = normalizeUserRole(role)
  const returnedLabel = isAnnotatorRole(normalizedRole)
    ? t('sidebar.rejection.returnedForRework', { count: display.returnedCount ?? 0 })
    : t('sidebar.rejection.returnedToYou', { count: display.returnedCount ?? 0 })

  const upstreamHeading = isReviewerRole(normalizedRole)
    ? t('sidebar.rejection.priorAnnotationRejections')
    : null

  return (
    <div className="mt-2 space-y-1.5 text-xs text-amber-700 dark:text-amber-400">
      {display.returnedCount !== undefined && display.returnedCount > 0 && (
        <div className="flex items-center gap-1.5">
          <RotateCcw className="h-3 w-3 shrink-0" />
          <span>{returnedLabel}</span>
        </div>
      )}
      {display.upstream.length > 0 && upstreamHeading && (
        <div className="space-y-0.5 pl-[18px]">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {upstreamHeading}
          </p>
          <ul className="space-y-0.5">
            {display.upstream.map((item) => (
              <li key={item.labelKey}>
                {t('sidebar.rejection.slotCount', {
                  slot: t(item.labelKey),
                  count: item.count,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
