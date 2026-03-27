import Link from 'next/link'
import { ChevronRight, FileText, Plus } from 'lucide-react'
import { formatData } from '@/lib/utils/date'
import type { Documento } from '@/lib/types/query.types'

const labelCategoria: Record<string, string> = {
  ricetta: 'Ricetta',
  referto: 'Referto',
  analisi: 'Analisi',
  certificato: 'Certificato',
  documento_sanitario: 'Doc. sanitario',
  ricevuta: 'Ricevuta',
  altro: 'Documento',
}

function getDataPrincipale(documento: Documento) {
  if (documento.data_documento) return formatData(documento.data_documento)
  return formatData(documento.created_at)
}

export function TabDocumenti({
  animaleId,
  documenti,
}: {
  animaleId: string
  documenti: Documento[]
}) {
  return (
    <div className="space-y-4 px-5 py-5 pb-32">
      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <FileText size={22} strokeWidth={2.2} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Documenti
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
              Archivio documenti
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Conserva referti, ricette, analisi, certificati e ricevute in un
              unico punto facile da aprire e consultare.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-[#EEE4D9] bg-[#FCF8F3] px-3 py-1 text-xs font-semibold text-gray-500">
            {documenti.length} {documenti.length === 1 ? 'file' : 'file'}
          </span>
        </div>

        <Link
          href={`/documenti/carica?animale_id=${animaleId}`}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.4} />
          Carica documento
        </Link>
      </div>

      {documenti.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#EADFD3] bg-white px-6 py-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F7F8] text-slate-600">
            <FileText size={24} strokeWidth={2.2} />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">
            Nessun documento caricato
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Aggiungi il primo documento per avere subito referti, ricette e
            analisi sempre a portata di mano.
          </p>
          <Link
            href={`/documenti/carica?animale_id=${animaleId}`}
            className="mt-5 inline-flex items-center justify-center rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] px-4 py-3 text-sm font-semibold text-gray-800 transition-all active:scale-[0.98]"
          >
            Carica ora
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {documenti.map((documento) => (
            <Link
              key={documento.id}
              href={`/documenti/${documento.id}?from=animale`}
              className="flex items-center justify-between gap-3 rounded-[24px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all active:scale-[0.99]"
            >
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F4F4F5] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600">
                    {labelCategoria[documento.categoria] ?? 'Documento'}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400">
                    {getDataPrincipale(documento)}
                  </span>
                </div>

                <p className="truncate text-sm font-bold text-gray-900">
                  {documento.titolo}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Tocca per aprire, visualizzare o scaricare il documento.
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#EEE4D9] bg-[#FCF8F3] text-gray-500">
                <ChevronRight size={18} strokeWidth={2.2} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}