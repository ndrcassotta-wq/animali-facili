import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { AzioniScadenza } from '@/components/scadenze/AzioniScadenza'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { Scadenza } from '@/lib/types/query.types'

const labelTipo: Record<string, string> = {
  visita: 'Visita', terapia: 'Terapia', controllo: 'Controllo',
  manutenzione_habitat: 'Manutenzione habitat',
  alimentazione_integrazione: 'Alimentazione / Integrazione', altro: 'Altro',
}

const labelFrequenza: Record<string, string> = {
  nessuna: 'Non si ripete', settimanale: 'Settimanale', mensile: 'Mensile',
  trimestrale: 'Trimestrale', semestrale: 'Semestrale', annuale: 'Annuale',
}

function Campo({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{valore}</span>
    </div>
  )
}

export default async function DettaglioScadenzaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawS } = await supabase
    .from('scadenze')
    .select('*, animali(id, nome)')
    .eq('id', id)
    .single()

  if (!rawS) notFound()

  const s = rawS as Scadenza & { animali: { id: string; nome: string } | null }
  const animale = s.animali

  const scaduta   = s.stato === 'attiva' && isScaduta(s.data)
  const imminente = s.stato === 'attiva' && isImminente(s.data)

  const badgeClass = cn(
    'text-xs font-medium px-2 py-0.5 rounded-full',
    s.stato === 'completata'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : s.stato === 'archiviata'
      ? 'bg-muted text-muted-foreground'
      : scaduta
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      : imminente
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  )

  const labelStato =
    s.stato === 'completata' ? 'Completata' :
    s.stato === 'archiviata' ? 'Archiviata' :
    scaduta                  ? 'Scaduta'    :
    imminente                ? 'Imminente'  : 'Attiva'

  return (
    <div>
      <PageHeader
        titolo={s.titolo}
        backHref={animale ? `/animali/${animale.id}?tab=scadenze` : '/scadenze'}
      />
      <div className="px-4 py-4 space-y-4">

        <div>
          <span className={badgeClass}>{labelStato}</span>
        </div>

        <div className="space-y-0">
          {animale && <Campo label="Animale"     valore={animale.nome} />}
          <Campo label="Tipo"        valore={labelTipo[s.tipo] ?? s.tipo} />
          <Campo label="Data"        valore={formatData(s.data)} />
          <Campo label="Ripetizione" valore={labelFrequenza[s.frequenza] ?? s.frequenza} />
          {s.note && <Campo label="Note" valore={s.note} />}
        </div>

        <AzioniScadenza scadenzaId={s.id} statoAttuale={s.stato} />

        {s.stato === 'attiva' && (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/scadenze/${s.id}/modifica`}>Modifica scadenza</Link>
          </Button>
        )}

      </div>
    </div>
  )
}