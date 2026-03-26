'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import { ChevronRight } from 'lucide-react'
import type { ImpegnoConAnimale } from '@/lib/types/query.types'

const filtri = [
  { label: 'Programmati', valore: 'programmato' },
  { label: 'Completati', valore: 'completato' },
  { label: 'Annullati', valore: 'annullato' },
]

const paramDaStato: Record<string, string> = {
  programmato: '',
  completato: 'completati',
  annullato: 'annullati',
}

const labelTipo: Record<string, string> = {
  visita: 'Visita',
  controllo: 'Controllo',
  vaccinazione: 'Vaccinazione',
  toelettatura: 'Toelettatura',
  terapia: 'Terapia',
  addestramento: 'Addestramento',
  compleanno: 'Compleanno',
  altro: 'Altro',
}

const iconaTipo: Record<string, string> = {
  visita: '🩺',
  controllo: '🔍',
  vaccinazione: '💉',
  toelettatura: '✂️',
  terapia: '🩺',
  addestramento: '🎓',
  compleanno: '🎂',
  altro: '📌',
}

function getAutoTerapiaId(note?: string | null) {
  if (!note) return null
  const match = note.match(/\[AUTO_TERAPIA:([^[\]]+)\]/)
  return match?.[1] ?? null
}

export function FiltroImpegni({
  statoAttivo,
  impegni,
}: {
  statoAttivo: string
  impegni: ImpegnoConAnimale[]
}) {
  const router = useRouter()

  return (
    <div className="flex-1 flex flex-col px-5 pb-32">
      <div className="flex justify-center gap-2 mb-5">
        {filtri.map((f) => (
          <button
            key={f.valore}
            onClick={() => {
              const param = paramDaStato[f.valore]
              router.push(param ? `/impegni?stato=${param}` : '/impegni')
            }}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold transition-colors',
              statoAttivo === f.valore
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {impegni.length === 0 ? (
        <Link
          href="/impegni/nuovo"
          className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 bg-white py-14 text-center active:scale-[0.98] transition-transform"
        >
          <span className="text-4xl">📅</span>
          <div>
            <p className="text-sm font-semibold text-gray-700">
              {statoAttivo === 'programmato'
                ? 'Nessun impegno programmato'
                : statoAttivo === 'completato'
                  ? 'Nessun impegno completato'
                  : 'Nessun impegno annullato'}
            </p>
            {statoAttivo === 'programmato' && (
              <p className="mt-1 text-sm font-bold text-amber-500">
                Tocca qui per aggiungerne uno →
              </p>
            )}
          </div>
        </Link>
      ) : (
        <div className="space-y-3">
          {impegni.map((i) => {
            const scaduto = statoAttivo === 'programmato' && isScaduta(i.data)
            const imminente = statoAttivo === 'programmato' && isImminente(i.data)

            const autoTerapiaId =
              i.tipo === 'terapia' ? getAutoTerapiaId(i.note) : null

            const hrefDettaglio = autoTerapiaId
              ? `/terapie/${autoTerapiaId}`
              : `/impegni/${i.id}`

            return (
              <Link
                key={i.id}
                href={hrefDettaglio}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4 transition-colors active:scale-[0.98]',
                  scaduto
                    ? 'border-red-200 bg-red-50'
                    : imminente
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-gray-100 bg-white'
                )}
              >
                <div
                  className={cn(
                    'h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center text-xl',
                    scaduto
                      ? 'bg-red-100'
                      : imminente
                        ? 'bg-amber-100'
                        : 'bg-gray-50'
                  )}
                >
                  {iconaTipo[i.tipo] ?? '📌'}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 truncate">{i.titolo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {i.animali?.nome ?? '—'} · {labelTipo[i.tipo] ?? i.tipo}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      scaduto
                        ? 'text-red-500'
                        : imminente
                          ? 'text-amber-600'
                          : 'text-gray-400'
                    )}
                  >
                    {formatData(i.data)}
                  </span>

                  {scaduto && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      Scaduto
                    </span>
                  )}

                  {!scaduto && imminente && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      Urgente
                    </span>
                  )}
                </div>

                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}