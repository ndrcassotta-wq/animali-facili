import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { formatData } from '@/lib/utils/date'
import {
  asDocumentiConAnimale,
  type DocumentoConAnimale,
} from '@/lib/types/query.types'

const labelCategoria: Record<string, string> = {
  ricetta: 'Ricetta',
  referto: 'Referto',
  analisi: 'Analisi',
  certificato: 'Certificato',
  documento_sanitario: 'Doc. sanitario',
  ricevuta: 'Ricevuta',
  altro: 'Documento',
}

function getSottotitolo(documento: DocumentoConAnimale) {
  const animale = documento.animali?.nome ?? '—'
  const categoria = labelCategoria[documento.categoria] ?? documento.categoria
  return `${animale} · ${categoria}`
}

function getDataLabel(documento: DocumentoConAnimale) {
  if (documento.data_documento) {
    return formatData(documento.data_documento)
  }

  return formatData(documento.created_at)
}

export default async function ListaDocumentiPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('documenti')
    .select('id, titolo, categoria, data_documento, created_at, animali(nome)')
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
          <div className="space-y-3 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Non hai ancora caricato nessun documento.
            </p>
            <Button asChild size="sm">
              <Link href="/documenti/carica">Carica il primo documento</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {documenti.map((documento) => (
              <Link
                key={documento.id}
                href={`/documenti/${documento.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {documento.titolo}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getSottotitolo(documento)}
                  </p>
                </div>

                <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                  {getDataLabel(documento)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}