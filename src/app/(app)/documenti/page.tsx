import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { formatData } from '@/lib/utils/date'
import { asDocumentiConAnimale, type DocumentoConAnimale } from '@/lib/types/query.types'

const labelCategoria: Record<string, string> = {
  ricetta: 'Ricetta', referto: 'Referto', analisi: 'Analisi',
  certificato: 'Certificato', documento_sanitario: 'Doc. sanitario',
  ricevuta: 'Ricevuta', altro: 'Documento',
}

export default async function ListaDocumentiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('documenti')
    .select('id, titolo, categoria, data_documento, created_at, file_url, animali(nome)')
    .order('created_at', { ascending: false })

  const documenti = asDocumentiConAnimale(data)

  return (
    <div>
      <PageHeader
        titolo="Documenti"
        azione={
          <Button asChild size="sm" variant="outline">
            <Link href="/documenti/carica">+ Carica</Link>
          </Button>
        }
      />
      <div className="px-4 py-4">
        {documenti.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Non hai ancora caricato nessun documento.
            </p>
            <Button asChild size="sm">
              <Link href="/documenti/carica">Carica il primo documento</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {documenti.map((d: DocumentoConAnimale) => (
              <Link
                key={d.id}
                href={`/documenti/${d.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.titolo}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.animali?.nome ?? '—'} · {labelCategoria[d.categoria] ?? d.categoria}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-3">
                  {d.data_documento
                    ? formatData(d.data_documento)
                    : formatData(d.created_at)
                  }
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}