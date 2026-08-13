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
import type { AnnotatorRejectSlot, RejectTarget } from '../types/reject-target'
import { encodeRejectSlots } from '../types/reject-target'

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

const REJECT_SLOT_OPTIONS: {
  slot: AnnotatorRejectSlot
  labelKey:
    | 'actions.rejectAnnotator1'
    | 'actions.rejectAnnotator2'
    | 'actions.rejectAnnotator3'
}[] = [
  { slot: 'A', labelKey: 'actions.rejectAnnotator1' },
  { slot: 'B', labelKey: 'actions.rejectAnnotator2' },
  { slot: 'C', labelKey: 'actions.rejectAnnotator3' },
]

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

  const [selectedSlots, setSelectedSlots] = useState<Set<AnnotatorRejectSlot>>(new Set())
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (!open) {
      setSelectedSlots(new Set())
      setComment('')
    }
  }, [open])

  const trimmedComment = comment.trim()
  const rejectTarget = encodeRejectSlots(selectedSlots)
  const canConfirm = rejectTarget !== null && trimmedComment.length > 0 && !isLoading
  const allSelected = selectedSlots.size === REJECT_SLOT_OPTIONS.length

  const toggleSlot = (slot: AnnotatorRejectSlot) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(slot)) next.delete(slot)
      else next.add(slot)
      return next
    })
  }

  const toggleAll = () => {
    setSelectedSlots((prev) => {
      if (prev.size === REJECT_SLOT_OPTIONS.length) return new Set()
      return new Set(REJECT_SLOT_OPTIONS.map((option) => option.slot))
    })
  }

  const handleConfirm = () => {
    if (!canConfirm || rejectTarget === null) return
    onConfirm({ reject_target: rejectTarget, comment: trimmedComment })
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
            <p className="text-xs text-muted-foreground">{t(`${copyPrefix}.targetHint`)}</p>
            <div
              role="group"
              aria-label={t(`${copyPrefix}.targetPrompt`)}
              className="flex flex-wrap gap-x-5 gap-y-3"
            >
              {REJECT_SLOT_OPTIONS.map(({ slot, labelKey }) => (
                <label
                  key={slot}
                  className="flex cursor-pointer items-center gap-2 text-sm leading-none"
                >
                  <input
                    type="checkbox"
                    name={`reject-slot-${slot}`}
                    checked={selectedSlots.has(slot)}
                    onChange={() => toggleSlot(slot)}
                    disabled={isLoading}
                    className="h-4 w-4 accent-destructive"
                  />
                  <span>{t(labelKey)}</span>
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 text-sm leading-none">
                <input
                  type="checkbox"
                  name="reject-slot-all"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={isLoading}
                  className="h-4 w-4 accent-destructive"
                />
                <span>{t('actions.rejectAllOption')}</span>
              </label>
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
