'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import type { ScadenzaConAnimale } from '@/lib/types/query.types'

const filtri = [
  { label: 'Attive',     valore: 'attiva' },
  { label: 'Completate', valore: 'completata' },
  { label: 'Archiviate', valore: 'archiviata' },
]

const paramDaStato: Record<string, string> = {
  attiva:     '',
  completata: 'completate',
  archiviata: 'archiviate',
}

export function FiltroScadenze({
  statoAttivo,
  scadenze,
}: {
  statoAttivo: string
  scadenze: ScadenzaConAnimale[]
}) {
  const router = useRouter()

  return (
    <div className="px-4 py-4 space-y-4">

      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {filtri.map(f => (
          <button
            key={f.valore}
            onClick={() => {
              const param = paramDaStato[f.valore]
              router.push(param ? `/scadenze?stato=${param}` : '/scadenze')
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

      {scadenze.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {statoAttivo === 'attiva'
            ? 'Nessuna scadenza attiva.'
            : statoAttivo === 'completata'
            ? 'Nessuna scadenza completata.'
            : 'Nessuna scadenza archiviata.'
          }
        </p>
      ) : (
        <div className="space-y-2">
          {scadenze.map(s => {
            const scaduta   = statoAttivo === 'attiva' && isScaduta(s.data)
            const imminente = statoAttivo === 'attiva' && isImminente(s.data)
            return (
              <Link
                key={s.id}
                href={`/scadenze/${s.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.titolo}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.animali?.nome ?? '—'} · {s.tipo.replace(/_/g, ' ')}
                  </p>
                </div>
                <span className={cn(
                  'text-xs font-medium shrink-0 ml-3',
                  scaduta   ? 'text-destructive' :
                  imminente ? 'text-amber-600 dark:text-amber-400' :
                              'text-muted-foreground'
                )}>
                  {formatData(s.data)}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}