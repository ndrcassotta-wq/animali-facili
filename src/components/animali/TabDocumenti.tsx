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
  const nessunDocumento = documenti.length === 0

  return (
    <div className="space-y-4 px-5 py-5 pb-32">
      <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-[0_12px_30px_rgba(245,158,11,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
              <FileText size={22} strokeWidth={2.2} />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
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

          <span className="shrink-0 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-gray-500 shadow-sm">
            {documenti.length} file
          </span>
        </div>

        <Link
          href={`/documenti/carica?animale_id=${animaleId}`}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.4} />
          Carica documento
        </Link>
      </div>

      {nessunDocumento ? (
        <div className="rounded-[28px] border border-dashed border-amber-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <FileText size={26} strokeWidth={2.2} />
          </div>

          <h3 className="mt-4 text-lg font-extrabold tracking-tight text-gray-900">
            Qui troverai i documenti del tuo animale
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Libretto, referti, ricette, analisi o qualsiasi file utile da avere
            sempre a portata di mano.
          </p>

          <Link
            href={`/documenti/carica?animale_id=${animaleId}`}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 text-sm font-bold text-amber-700 transition-all active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.4} />
            Carica il primo documento
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {documenti.map((documento) => (
            <Link
              key={documento.id}
              href={`/documenti/${documento.id}?from=animale`}
              className="flex items-center justify-between gap-3 rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm transition-all active:scale-[0.99]"
            >
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-700">
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

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                <ChevronRight size={18} strokeWidth={2.2} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}