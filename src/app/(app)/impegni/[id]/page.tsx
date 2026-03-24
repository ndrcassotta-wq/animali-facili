import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { AzioniImpegno } from '@/components/impegni/AzioniImpegno'
import { NotificaImpegno } from '@/components/impegni/NotificaImpegno'
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

const labelFrequenza: Record<string, string> = {
  nessuna:     'Non si ripete',
  settimanale: 'Settimanale',
  mensile:     'Mensile',
  trimestrale: 'Trimestrale',
  semestrale:  'Semestrale',
  annuale:     'Annuale',
}

function Campo({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{valore}</span>
    </div>
  )
}

export default async function DettaglioImpegnoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawI } = await supabase
    .from('impegni')
    .select('*, animali(id, nome)')
    .eq('id', id)
    .single()

  if (!rawI) notFound()

  const impegno = rawI as Impegno & {
    animali: { id: string; nome: string } | null
  }

  const animale   = impegno.animali
  const scaduto   = impegno.stato === 'programmato' && isScaduta(impegno.data)
  const imminente = impegno.stato === 'programmato' && isImminente(impegno.data)

  const badgeClass = cn(
    'text-xs font-medium px-2 py-0.5 rounded-full',
    impegno.stato === 'completato'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : impegno.stato === 'annullato'
      ? 'bg-muted text-muted-foreground'
      : scaduto
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      : imminente
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  )

  const labelStato =
    impegno.stato === 'completato' ? 'Completato' :
    impegno.stato === 'annullato'  ? 'Annullato'  :
    scaduto                        ? 'Scaduto'    :
    imminente                      ? 'Imminente'  : 'Programmato'

  return (
    <div>
      <PageHeader
        titolo={impegno.titolo}
        backHref={animale ? `/animali/${animale.id}?tab=impegni` : '/impegni'}
      />
      <div className="space-y-4 px-4 py-4">

        <div>
          <span className={badgeClass}>{labelStato}</span>
        </div>

        <div className="space-y-0">
          {animale && <Campo label="Animale" valore={animale.nome} />}
          <Campo label="Tipo"        valore={labelTipo[impegno.tipo] ?? impegno.tipo} />
          <Campo label="Data"        valore={formatData(impegno.data)} />
          <Campo label="Ripetizione" valore={labelFrequenza[impegno.frequenza] ?? impegno.frequenza} />
          {impegno.note && <Campo label="Note" valore={impegno.note} />}
        </div>

        <AzioniImpegno impegnoId={impegno.id} statoAttuale={impegno.stato} />

        {impegno.stato === 'programmato' && !scaduto && (
          <NotificaImpegno
            impegnoId={impegno.id}
            titolo={impegno.titolo}
            animaleNome={animale?.nome ?? ''}
            data={impegno.data}
            tipo={impegno.tipo}
          />
        )}

        {impegno.stato === 'programmato' && (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/impegni/${impegno.id}/modifica`}>Modifica impegno</Link>
          </Button>
        )}

      </div>
    </div>
  )
}