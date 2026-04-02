import { GuideIndexItem } from '@/lib/guida-content'

type GuideIndexProps = {
  items: GuideIndexItem[]
}

export function GuideIndex({ items }: GuideIndexProps) {
  return (
    <nav
      aria-label="Indice guida"
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <p className="mb-3 text-sm font-semibold text-foreground">Indice rapido</p>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground transition hover:bg-muted"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}