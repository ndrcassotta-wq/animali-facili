import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { Impegno } from '@/lib/types/query.types'

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
    <div className="px-4 py-4 space-y-4">
      <Button asChild size="sm" variant="outline" className="w-full">
        <Link href={`/impegni/nuovo?animale_id=${animaleId}`}>+ Aggiungi impegno</Link>
      </Button>

      {programmati.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nessun impegno programmato.
        </p>
      )}

      <div className="space-y-2">
        {programmati.map(i => {
          const scaduto   = isScaduta(i.data)
          const imminente = isImminente(i.data)
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
                  {labelTipo[i.tipo] ?? i.tipo}
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
        })}
      </div>

      {passati.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          + {passati.length} {passati.length === 1 ? 'completato' : 'completati'}
        </p>
      )}
    </div>
  )
}