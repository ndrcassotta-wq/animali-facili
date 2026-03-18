import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { Scadenza } from '@/lib/types/query.types'

export function TabScadenze({
  animaleId,
  scadenze,
}: {
  animaleId: string
  scadenze: Scadenza[]
}) {
  const attive    = scadenze.filter(s => s.stato === 'attiva')
  const archiviate = scadenze.filter(s => s.stato !== 'attiva')

  return (
    <div className="px-4 py-4 space-y-4">
      <Button asChild size="sm" variant="outline" className="w-full">
        <Link href={`/scadenze/nuova?animale_id=${animaleId}`}>+ Aggiungi scadenza</Link>
      </Button>

      {attive.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nessuna scadenza attiva.
        </p>
      )}

      <div className="space-y-2">
        {attive.map(s => {
          const scaduta   = isScaduta(s.data)
          const imminente = isImminente(s.data)
          return (
            <Link
              key={s.id}
              href={`/scadenze/${s.id}`}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.titolo}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {s.tipo.replace(/_/g, ' ')}
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

      {archiviate.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          + {archiviate.length} {archiviate.length === 1 ? 'archiviata' : 'archiviate'}
        </p>
      )}
    </div>
  )
}