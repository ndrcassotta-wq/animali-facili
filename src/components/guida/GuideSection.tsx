import { ReactNode } from 'react'

type GuideSectionProps = {
  id: string
  title: string
  description?: string
  screenshotTitle?: string
  children: ReactNode
}

export function GuideSection({
  id,
  title,
  description,
  screenshotTitle,
  children,
}: GuideSectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>

      <div className="space-y-4 text-sm leading-6 text-foreground sm:text-base">
        {children}
      </div>
    </section>
  )
}