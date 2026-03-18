import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatData } from '@/lib/utils/date'
import type { Evento } from '@/lib/types/query.types'

const labelTipo: Record<string, string> = {
  visita: 'Visita', trattamento: 'Trattamento', controllo: 'Controllo',
  aggiornamento_peso: 'Peso', analisi_esame: 'Analisi',
  nota: 'Nota', altro: 'Evento',
}

export function TabEventi({
  animaleId,
  eventi,
}: {
  animaleId: string
  eventi: Evento[]
}) {
  return (
    <div className="px-4 py-4 space-y-4">
      <Button asChild size="sm" variant="outline" className="w-full">
        <Link href={`/animali/${animaleId}/eventi/nuovo`}>+ Aggiungi evento</Link>
      </Button>

      {eventi.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nessun evento registrato.
        </p>
      )}

      <div className="relative">
        {eventi.length > 0 && (
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
        )}
        <div className="space-y-4">
          {eventi.map(ev => (
            <div key={ev.id} className="flex gap-4">
              <div className="w-3.5 h-3.5 rounded-full bg-border border-2 border-background mt-1 shrink-0 z-10" />
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {ev.titolo ?? labelTipo[ev.tipo] ?? 'Evento'}
                    </p>
                    {ev.descrizione && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {ev.descrizione}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatData(ev.data)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}