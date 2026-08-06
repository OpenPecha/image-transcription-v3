import { CircleAlert } from 'lucide-react'

type AdminFeatureUnavailableProps = {
  title: string
  description: string
}

export function AdminFeatureUnavailable({
  title,
  description,
}: AdminFeatureUnavailableProps) {
  return (
    <section className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
      <div className="max-w-md">
        <CircleAlert
          aria-hidden="true"
          className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
        />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </section>
  )
}
