import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { BottoneDownload } from '@/components/documenti/BottoneDownload'
import { formatData } from '@/lib/utils/date'
import type { Documento } from '@/lib/types/query.types'
import { AzioniDocumento } from '@/components/documenti/AzioniDocumento'

const labelCategoria: Record<string, string> = {
  ricetta: 'Ricetta', referto: 'Referto', analisi: 'Analisi',
  certificato: 'Certificato', documento_sanitario: 'Documento sanitario',
  ricevuta: 'Ricevuta', altro: 'Documento',
}

function Campo({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{valore}</span>
    </div>
  )
}

export default async function DettaglioDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawDoc } = await supabase
    .from('documenti')
    .select('*, animali(id, nome)')
    .eq('id', id)
    .single()

  if (!rawDoc) notFound()

  const doc = rawDoc as Documento & {
    animali: { id: string; nome: string } | null
  }

  const animale = doc.animali

  // Genera signed URL server-side — scadenza 1 ora
  const { data: signed } = await supabase.storage
    .from('documenti-animali')
    .createSignedUrl(doc.file_url, 3600)

  return (
    <div>
      <PageHeader
        titolo={doc.titolo}
        backHref={animale ? `/animali/${animale.id}?tab=documenti` : '/documenti'}
      />
      <div className="px-4 py-4 space-y-4">

        <div className="space-y-0">
          {animale && <Campo label="Animale"    valore={animale.nome} />}
          <Campo label="Categoria"  valore={labelCategoria[doc.categoria] ?? doc.categoria} />
          {doc.data_documento && (
            <Campo label="Data documento" valore={formatData(doc.data_documento)} />
          )}
          <Campo label="Caricato il" valore={formatData(doc.created_at)} />
          {doc.note && <Campo label="Note" valore={doc.note} />}
        </div>

        <BottoneDownload
          signedUrl={signed?.signedUrl ?? null}
          titolo={doc.titolo}
          filePath={doc.file_url}
        />

        <AzioniDocumento
          documentoId={doc.id}
          filePath={doc.file_url}
        />

      </div>
    </div>
  )
}