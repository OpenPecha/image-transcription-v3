import { RejectSlotDialog, type RejectConfirmParams } from './reject-slot-dialog'

type RejectAnnotatorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onConfirm: (params: RejectConfirmParams) => void
  isLoading?: boolean
  taskName: string
  hasAnnotatorC?: boolean
}

export type { RejectConfirmParams }

export function RejectAnnotatorDialog(props: RejectAnnotatorDialogProps) {
  return <RejectSlotDialog {...props} />
}
