import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, FileText, Plus } from 'lucide-react'
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
  const animale = documento.animali?.nome ?? 'Animale non disponibile'
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

      <div className="space-y-4 px-4 py-4 pb-28">
        <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F4F5] text-slate-700">
                <FileText size={22} strokeWidth={2.2} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Archivio documenti
              </p>

              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
                Tutti i documenti caricati
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Qui trovi l’archivio generale dei documenti: puoi aprirli,
                scaricarli e rientrare rapidamente nel dettaglio dell’animale
                collegato.
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-[#EEE4D9] bg-[#FCF8F3] px-3 py-1 text-xs font-semibold text-gray-500">
              {documenti.length} {documenti.length === 1 ? 'documento' : 'documenti'}
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/documenti/carica"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={2.4} />
              Carica documento
            </Link>

            <div className="inline-flex items-center rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] px-4 py-3 text-sm text-gray-500">
              Ogni documento resta collegato anche al suo animale
            </div>
          </div>
        </div>

        {documenti.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#EADFD3] bg-white px-6 py-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F7F8] text-slate-600">
              <FileText size={24} strokeWidth={2.2} />
            </div>

            <p className="mt-4 text-base font-bold text-gray-900">
              Nessun documento ancora caricato
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Quando caricherai il primo documento lo troverai qui, pronto da
              aprire, scaricare e consultare anche dal profilo dell’animale.
            </p>

            <Button asChild size="sm" className="mt-5">
              <Link href="/documenti/carica">Carica il primo documento</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Archivio
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Ultimi documenti caricati nell’app
              </p>
            </div>

            <div className="space-y-3">
              {documenti.map((documento) => (
                <Link
                  key={documento.id}
                  href={`/documenti/${documento.id}?from=lista`}
                  className="flex items-center justify-between gap-3 rounded-[24px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all active:scale-[0.99]"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4F4F5] text-slate-700">
                      <FileText size={18} strokeWidth={2.1} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#F4F4F5] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600">
                          {labelCategoria[documento.categoria] ?? 'Documento'}
                        </span>

                        <span className="text-[11px] font-medium text-gray-400">
                          {getDataLabel(documento)}
                        </span>
                      </div>

                      <p className="truncate text-sm font-bold text-gray-900">
                        {documento.titolo}
                      </p>

                      <p className="mt-1 truncate text-xs text-gray-500">
                        {getSottotitolo(documento)}
                      </p>
                    </div>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#EADFD3] bg-[#FCF8F3] text-gray-500">
                    <ChevronRight size={18} strokeWidth={2.2} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}