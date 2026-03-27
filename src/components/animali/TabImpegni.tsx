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
  terapia: '💊',
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

  const impegniFiltrati = impegni.filter((i) => i.stato === filtro)

  return (
    <div className="space-y-4 px-5 py-5 pb-32">
      <Link
        href={`/impegni/nuovo?animale_id=${animaleId}`}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 py-4 text-sm font-bold text-amber-600 transition-transform active:scale-[0.98]"
      >
        <Plus size={18} strokeWidth={2.5} />
        Aggiungi impegno
      </Link>

      <div className="flex justify-center gap-2">
        {filtri.map((f) => (
          <button
            key={f.valore}
            onClick={() => {
              setFiltro(f.valore)
              resetAppScrollToTop()
            }}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold transition-colors',
              filtro === f.valore
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 bg-white text-gray-500'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {impegniFiltrati.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-8 text-center">
          <p className="text-sm text-gray-400">
            {filtro === 'programmato'
              ? 'Nessun impegno programmato'
              : filtro === 'completato'
                ? 'Nessun impegno completato'
                : 'Nessun impegno annullato'}
          </p>
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
                  'flex items-center gap-3 rounded-2xl border p-4 transition-transform active:scale-[0.98]',
                  scaduto
                    ? 'border-red-200 bg-red-50'
                    : imminente
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-gray-100 bg-white'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg',
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
                  <p className="truncate text-sm font-bold text-gray-800">
                    {i.titolo}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {labelTipo[i.tipo] ?? i.tipo}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
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

                <ChevronRight size={16} className="shrink-0 text-gray-300" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}