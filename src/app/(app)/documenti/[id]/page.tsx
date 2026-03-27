import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ExternalLink, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { BottoneDownload } from '@/components/documenti/BottoneDownload'
import { formatData } from '@/lib/utils/date'
import type { Documento } from '@/lib/types/query.types'
import { AzioniDocumento } from '@/components/documenti/AzioniDocumento'

const labelCategoria: Record<string, string> = {
  ricetta: 'Ricetta',
  referto: 'Referto',
  analisi: 'Analisi',
  certificato: 'Certificato',
  documento_sanitario: 'Documento sanitario',
  ricevuta: 'Ricevuta',
  altro: 'Documento',
}

function Campo({
  label,
  valore,
  multilinea = false,
}: {
  label: string
  valore: string
  multilinea?: boolean
}) {
  return (
    <div className="border-b border-border py-3 last:border-0">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-medium text-foreground ${
          multilinea ? 'whitespace-pre-wrap leading-6' : ''
        }`}
      >
        {valore}
      </p>
    </div>
  )
}

function isPdfPath(filePath: string) {
  return filePath.toLowerCase().endsWith('.pdf')
}

function isImagePath(filePath: string) {
  return /\.(jpg|jpeg|png|webp|gif|bmp|avif)$/i.test(filePath)
}

export default async function DettaglioDocumentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { id } = await params
  const { from } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const backHref =
    from === 'lista'
      ? '/documenti'
      : animale
        ? `/animali/${animale.id}?tab=documenti`
        : '/documenti'

  const { data: signed } = await supabase.storage
    .from('documenti-animali')
    .createSignedUrl(doc.file_url, 3600)

  const signedUrl = signed?.signedUrl ?? null
  const isPdf = isPdfPath(doc.file_url)
  const isImage = isImagePath(doc.file_url)

  return (
    <div>
      <PageHeader titolo="Dettaglio documento" backHref={backHref} />

      <div className="space-y-4 px-4 py-4">
        <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Documento
          </p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
            {doc.titolo}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F4F4F5] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600">
              {labelCategoria[doc.categoria] ?? doc.categoria}
            </span>

            {animale && (
              <span className="rounded-full border border-[#EEE4D9] bg-[#FCF8F3] px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                {animale.nome}
              </span>
            )}
          </div>
        </div>

        {signedUrl ? (
          <>
            <div className="space-y-3">
              <a
                href={signedUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] px-4 py-3 text-sm font-semibold text-gray-900 transition-all active:scale-[0.98]"
              >
                <ExternalLink size={16} strokeWidth={2.2} />
                Apri documento
              </a>

              <BottoneDownload
                signedUrl={signedUrl}
                titolo={doc.titolo}
                filePath={doc.file_url}
              />
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[#EADFD3] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              {isImage ? (
                <img
                  src={signedUrl}
                  alt={doc.titolo}
                  className="max-h-[75vh] w-full object-contain bg-white"
                />
              ) : isPdf ? (
                <iframe
                  src={signedUrl}
                  title={doc.titolo}
                  className="h-[75vh] w-full bg-white"
                />
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F4F5] text-slate-700">
                    <FileText size={24} strokeWidth={2.1} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    Anteprima non disponibile
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Apri o scarica il documento per visualizzarlo nel formato
                    originale.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">
              Non è stato possibile generare il link del documento. Riprova tra
              poco.
            </p>
          </div>
        )}

        <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          {animale && <Campo label="Animale" valore={animale.nome} />}
          <Campo
            label="Categoria"
            valore={labelCategoria[doc.categoria] ?? doc.categoria}
          />
          {doc.data_documento && (
            <Campo label="Data documento" valore={formatData(doc.data_documento)} />
          )}
          <Campo label="Caricato il" valore={formatData(doc.created_at)} />
          {doc.note && <Campo label="Note" valore={doc.note} multilinea />}
        </div>

        {from === 'lista' && animale ? (
          <Link
            href={`/animali/${animale.id}?tab=documenti`}
            className="flex w-full items-center justify-center rounded-2xl border border-[#EADFD3] bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition-all active:scale-[0.98]"
          >
            Vai ai documenti di {animale.nome}
          </Link>
        ) : null}

        <AzioniDocumento documentoId={doc.id} filePath={doc.file_url} />
      </div>
    </div>
  )
}