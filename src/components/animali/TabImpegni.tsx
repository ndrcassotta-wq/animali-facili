import Link from 'next/link'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import { ChevronRight, Plus } from 'lucide-react'
import type { Impegno } from '@/lib/types/query.types'

const labelTipo: Record<string, string> = {
  visita: 'Visita', controllo: 'Controllo', vaccinazione: 'Vaccinazione',
  toelettatura: 'Toelettatura', terapia: 'Terapia', addestramento: 'Addestramento',
  compleanno: 'Compleanno', altro: 'Altro',
}

const iconaTipo: Record<string, string> = {
  visita: '🩺', controllo: '🔍', vaccinazione: '💉', toelettatura: '✂️',
  terapia: '💊', addestramento: '🎓', compleanno: '🎂', altro: '📌',
}

export function TabImpegni({
  animaleId,
  impegni,
}: {
  animaleId: string
  impegni: Impegno[]
}) {
  const programmati = impegni.filter(i => i.stato === 'programmato')
  const passati     = impegni.filter(i => i.stato !== 'programmato')

  return (
    <div className="px-5 py-5 space-y-4 pb-32">

      <Link
        href={`/impegni/nuovo?animale_id=${animaleId}`}
        className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 py-4 text-sm font-bold text-amber-600 active:scale-[0.98] transition-transform"
      >
        <Plus size={18} strokeWidth={2.5} />
        Aggiungi impegno
      </Link>

      {programmati.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 py-8 text-center">
          <p className="text-sm text-gray-400">Nessun impegno programmato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programmati.map(i => {
            const scaduto   = isScaduta(i.data)
            const imminente = isImminente(i.data)
            return (
              <Link
                key={i.id}
                href={`/impegni/${i.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4 active:scale-[0.98] transition-transform',
                  scaduto   ? 'border-red-200 bg-red-50' :
                  imminente ? 'border-amber-200 bg-amber-50' :
                              'border-gray-100 bg-white'
                )}
              >
                <div className={cn(
                  'h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-lg',
                  scaduto   ? 'bg-red-100' :
                  imminente ? 'bg-amber-100' : 'bg-gray-50'
                )}>
                  {iconaTipo[i.tipo] ?? '📌'}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 truncate">{i.titolo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{labelTipo[i.tipo] ?? i.tipo}</p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={cn(
                    'text-xs font-semibold',
                    scaduto   ? 'text-red-500' :
                    imminente ? 'text-amber-600' : 'text-gray-400'
                  )}>
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

      {passati.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 text-center">
          <p className="text-xs text-gray-400">
            + {passati.length} {passati.length === 1 ? 'completato o annullato' : 'completati o annullati'}
          </p>
        </div>
      )}

    </div>
  )
}