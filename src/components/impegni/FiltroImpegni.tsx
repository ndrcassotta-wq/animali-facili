'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import type { ImpegnoConAnimale } from '@/lib/types/query.types'

const filtri = [
  { label: 'Programmati', valore: 'programmato' },
  { label: 'Completati',  valore: 'completato' },
  { label: 'Annullati',   valore: 'annullato' },
]

const paramDaStato: Record<string, string> = {
  programmato: '',
  completato:  'completati',
  annullato:   'annullati',
}

const labelTipo: Record<string, string> = {
  visita:        'Visita',
  controllo:     'Controllo',
  vaccinazione:  'Vaccinazione',
  toelettatura:  'Toelettatura',
  terapia:       'Terapia',
  addestramento: 'Addestramento',
  compleanno:    'Compleanno',
  altro:         'Altro',
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
    <div>
      {/* Barra filtri fixed sotto l'header fisso */}
      <div
        className="fixed left-0 right-0 z-30 bg-background px-4 py-2 border-b border-border"
        style={{ top: 'calc(env(safe-area-inset-top) + 56px)' }}
      >
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {filtri.map(f => (
            <button
              key={f.valore}
              onClick={() => {
                const param = paramDaStato[f.valore]
                router.push(param ? `/impegni?stato=${param}` : '/impegni')
              }}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-md transition-colors',
                statoAttivo === f.valore
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spacer per compensare header + barra filtri */}
      <div style={{ height: '40px' }} />

      {/* Lista impegni */}
      <div className="px-4 py-3 space-y-2">
        {impegni.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {statoAttivo === 'programmato' ? 'Nessun impegno programmato.' :
             statoAttivo === 'completato'  ? 'Nessun impegno completato.'  :
                                             'Nessun impegno annullato.'}
          </p>
        ) : (
          impegni.map(i => {
            const scaduto   = statoAttivo === 'programmato' && isScaduta(i.data)
            const imminente = statoAttivo === 'programmato' && isImminente(i.data)
            return (
              <Link
                key={i.id}
                href={`/impegni/${i.id}`}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-colors',
                  scaduto
                    ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
                    : imminente
                    ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30'
                    : 'border-border bg-card hover:bg-muted/50'
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{i.titolo}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.animali?.nome ?? '—'} · {labelTipo[i.tipo] ?? i.tipo}
                  </p>
                </div>
                <span className={cn(
                  'text-xs font-medium shrink-0 ml-3',
                  scaduto   ? 'text-destructive' :
                  imminente ? 'text-amber-600 dark:text-amber-400' :
                              'text-muted-foreground'
                )}>
                  {formatData(i.data)}
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}