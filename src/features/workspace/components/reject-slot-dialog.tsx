import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { RejectTarget } from '../types/reject-target'
import {
  REJECT_TARGET_ANNOTATOR_A,
  REJECT_TARGET_ANNOTATOR_B,
  REJECT_TARGET_ANNOTATOR_C,
  REJECT_TARGET_ALL_ANNOTATORS,
} from '../types/reject-target'

export type RejectConfirmParams = {
  reject_target: RejectTarget
  comment: string
}

type RejectSlotDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onConfirm: (params: RejectConfirmParams) => void
  isLoading?: boolean
  taskName: string
}

const REJECT_OPTIONS = [
  { target: REJECT_TARGET_ANNOTATOR_A, labelKey: 'actions.rejectAnnotatorA' },
  { target: REJECT_TARGET_ANNOTATOR_B, labelKey: 'actions.rejectAnnotatorB' },
  { target: REJECT_TARGET_ANNOTATOR_C, labelKey: 'actions.rejectAnnotatorC' },
  { target: REJECT_TARGET_ALL_ANNOTATORS, labelKey: 'actions.rejectAll' },
] as const

export function RejectSlotDialog({
  open,
  onOpenChange,
  onCancel,
  onConfirm,
  isLoading = false,
  taskName,
}: RejectSlotDialogProps) {
  const { t } = useTranslation('workspace')
  const { t: tCommon } = useTranslation('common')
  const copyPrefix = 'dialogs.reject.choose'

  const [selectedTarget, setSelectedTarget] = useState<RejectTarget | null>(null)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (!open) {
      setSelectedTarget(null)
      setComment('')
    }
  }, [open])

  const trimmedComment = comment.trim()
  const canConfirm = selectedTarget !== null && trimmedComment.length > 0 && !isLoading

  const handleConfirm = () => {
    if (!canConfirm || selectedTarget === null) return
    onConfirm({ reject_target: selectedTarget, comment: trimmedComment })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/20">
              <Ban className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>{t(`${copyPrefix}.title`)}</DialogTitle>
              <DialogDescription className="mt-1">
                {t(`${copyPrefix}.description`, { taskName })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium leading-none">
              {t(`${copyPrefix}.targetPrompt`)}
            </legend>
            <div
              role="radiogroup"
              aria-label={t(`${copyPrefix}.targetPrompt`)}
              className="flex flex-wrap gap-x-5 gap-y-3"
            >
              {REJECT_OPTIONS.map(({ target, labelKey }) => (
                <label
                  key={target}
                  className="flex cursor-pointer items-center gap-2 text-sm leading-none"
                >
                  <input
                    type="radio"
                    name="reject-target-annotator"
                    value={target}
                    checked={selectedTarget === target}
                    onChange={() => setSelectedTarget(target)}
                    disabled={isLoading}
                    className="h-4 w-4 accent-destructive"
                  />
                  <span>{t(labelKey)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="reject-comment-annotator">
              {t(`${copyPrefix}.commentLabel`)}
            </Label>
            <Textarea
              id="reject-comment-annotator"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={t(`${copyPrefix}.commentPlaceholder`)}
              disabled={isLoading}
              rows={8}
              className="min-h-[200px] resize-y"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {tCommon('actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm}>
            {t(`${copyPrefix}.confirm`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
