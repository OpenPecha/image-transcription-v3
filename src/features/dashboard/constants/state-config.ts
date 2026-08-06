export const STATE_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Pending', variant: 'outline' },
  annotating: { label: 'Annotating', variant: 'default' },
  annotated_a: { label: 'Annotated A', variant: 'secondary' },
  annotating_b: { label: 'Annotating B', variant: 'default' },
  annotated_b: { label: 'Annotated B', variant: 'secondary' },
  annotating_c: { label: 'Annotating C', variant: 'default' },
  annotated: { label: 'Annotated', variant: 'secondary' },
  reviewing: { label: 'In Review', variant: 'outline' },
  reviewed: { label: 'Reviewed', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'secondary' },
  trashed: { label: 'Trashed', variant: 'destructive' },
}
