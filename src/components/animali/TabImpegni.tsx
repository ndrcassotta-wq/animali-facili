'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import { ChevronRight, Plus } from 'lucide-react'
import type { Impegno } from '@/lib/types/query.types'

type FiltroStato = 'programmato' | 'completato' | 'annullato'

const filtri: { label: string; valore: FiltroStato }[] = [
  { label: 'Programmati', valore: 'programmato' },
  { label: 'Completati', valore: 'completato' },
  { label: 'Annullati', valore: 'annullato' },
]

const labelTipo: Record<string, string> = {
  visita: 'Visita',
  controllo: 'Controllo',
  vaccinazione: 'Vaccinazione',
  toelettatura: 'Toelettatura',
  addestramento: 'Addestramento',
  compleanno: 'Compleanno',
  altro: 'Altro',
}

const iconaTipo: Record<string, string> = {
  visita: '🩺',
  controllo: '🔍',
  vaccinazione: '💉',
  toelettatura: '✂️',
  addestramento: '🎓',
  compleanno: '🎂',
  altro: '📌',
}

function resetAppScrollToTop() {
  if (typeof window === 'undefined') return

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  const appRoot = document.getElementById('app-scroll-root')
  appRoot?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}

export function TabImpegni({
  animaleId,
  impegni,
}: {
  animaleId: string
  impegni: Impegno[]
}) {
  const [filtro, setFiltro] = useState<FiltroStato>('programmato')

  useEffect(() => {
    const reset = () => resetAppScrollToTop()
    reset()
    const frame = window.requestAnimationFrame(reset)

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const impegniFiltrati = impegni.filter(
    (i) => i.stato === filtro && i.tipo !== 'terapia'
  )

  const emptyLabel =
    filtro === 'programmato'
      ? 'Nessun impegno programmato.'
      : filtro === 'completato'
        ? 'Nessun impegno completato.'
        : 'Nessun impegno annullato.'

  return (
    <div className="space-y-4 px-4 py-4 pb-32">
      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <Link
          href={`/impegni/nuovo?animale_id=${animaleId}`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 py-4 text-sm font-bold text-amber-600 transition-transform active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Aggiungi impegno
        </Link>
      </div>

      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="grid grid-cols-3 gap-2">
          {filtri.map((f) => (
            <button
              key={f.valore}
              type="button"
              onClick={() => {
                setFiltro(f.valore)
                resetAppScrollToTop()
              }}
              className={cn(
                'rounded-2xl px-3 py-3 text-sm font-bold transition-all',
                filtro === f.valore
                  ? 'bg-[#FCF8F3] text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-500'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {impegniFiltrati.length === 0 ? (
        <div className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="rounded-2xl border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-400">{emptyLabel}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {impegniFiltrati.map((i) => {
            const scaduto = filtro === 'programmato' && isScaduta(i.data)
            const imminente = filtro === 'programmato' && isImminente(i.data)

            return (
              <Link
                key={i.id}
                href={`/impegni/${i.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-[28px] border p-4 shadow-sm transition-all active:scale-[0.98]',
                  scaduto
                    ? 'border-red-200 bg-red-50'
                    : imminente
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-[#EADFD3] bg-white'
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg',
                    scaduto
                      ? 'bg-red-100'
                      : imminente
                        ? 'bg-amber-100'
                        : 'bg-[#FCF8F3]'
                  )}
                >
                  {iconaTipo[i.tipo] ?? '📌'}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold text-gray-900">
                    {i.titolo}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {labelTipo[i.tipo] ?? i.tipo}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      'text-sm font-bold',
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

                <ChevronRight
                  size={18}
                  strokeWidth={2.4}
                  className="shrink-0 text-gray-300"
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}