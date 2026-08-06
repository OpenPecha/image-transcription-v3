import { useTranslation } from 'react-i18next'
import { ArrowRight, Layers } from 'lucide-react'
import { TaskFileName } from '@/components/common'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { STATE_CONFIG } from '../constants'
import type { AssignedTask } from '@/types'

interface TaskCardProps {
  task: AssignedTask
  onContinue: () => void
}

export function TaskCard({ task, onContinue }: TaskCardProps) {
  const { t } = useTranslation('dashboard')
  const stateConfig = task.state ? STATE_CONFIG[task.state] : null

  return (
    <Card className="max-w-2xl overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
      {/* Task Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={task.task_url}
          alt={task.task_name}
          className="h-full w-full object-contain bg-black/5"
          loading="lazy"
        />
        <div className="absolute top-3 right-3">
          {stateConfig && (
            <Badge variant={stateConfig.variant}>
              {stateConfig.label}
            </Badge>
          )}
        </div>
      </div>

      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <TaskFileName
              fileName={task.task_name}
              textClassName="font-semibold text-foreground"
            />
            {task.batch_id && (
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />
                  {task.batch_id}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{t('taskCard.transcript')}</p>
          <p className="text-sm bg-muted/50 p-3 rounded-md font-mono leading-relaxed">
            {task.task_transcript}
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          onClick={onContinue}
          className="w-full sm:w-auto"
          size="lg"
        >
          {t('taskCard.continue')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

