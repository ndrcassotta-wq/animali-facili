import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatData } from '@/lib/utils/date'
import type { Documento } from '@/lib/types/query.types'

const labelCategoria: Record<string, string> = {
  ricetta: 'Ricetta', referto: 'Referto', analisi: 'Analisi',
  certificato: 'Certificato', documento_sanitario: 'Doc. sanitario',
  ricevuta: 'Ricevuta', altro: 'Documento',
}

export function TabDocumenti({
  animaleId,
  documenti,
}: {
  animaleId: string
  documenti: Documento[]
}) {
  return (
    <div className="px-4 py-4 space-y-4">
      <Button asChild size="sm" variant="outline" className="w-full">
        <Link href={`/documenti/carica?animale_id=${animaleId}`}>+ Carica documento</Link>
      </Button>

      {documenti.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nessun documento caricato.
        </p>
      )}

      <div className="space-y-2">
        {documenti.map(d => (
          <Link
            key={d.id}
            href={`/documenti/${d.id}`}
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{d.titolo}</p>
              <p className="text-xs text-muted-foreground">
                {labelCategoria[d.categoria] ?? 'Documento'}
                {d.data_documento && ` · ${formatData(d.data_documento)}`}
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 ml-3">
              {formatData(d.created_at)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}