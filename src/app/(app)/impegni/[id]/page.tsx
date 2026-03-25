import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AzioniImpegno } from '@/components/impegni/AzioniImpegno'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import { ArrowLeft, Pencil } from 'lucide-react'
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

const labelFrequenza: Record<string, string> = {
  nessuna: 'Non si ripete', settimanale: 'Settimanale', mensile: 'Mensile',
  trimestrale: 'Trimestrale', semestrale: 'Semestrale', annuale: 'Annuale',
}

function RigaInfo({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{valore}</span>
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

  const statoBadge = {
    label:
      impegno.stato === 'completato' ? 'Completato' :
      impegno.stato === 'annullato'  ? 'Annullato'  :
      scaduto                        ? 'Scaduto'    :
      imminente                      ? 'Imminente'  : 'Programmato',
    cls:
      impegno.stato === 'completato' ? 'bg-green-100 text-green-700' :
      impegno.stato === 'annullato'  ? 'bg-gray-100 text-gray-500'   :
      scaduto                        ? 'bg-red-100 text-red-600'     :
      imminente                      ? 'bg-amber-100 text-amber-700' :
                                       'bg-blue-100 text-blue-700',
  }

  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>

      {/* Header — solo freccia indietro, niente matita */}
      <header className="shrink-0 px-5 pt-10 pb-4">
        <div className="mb-5">
          <Link
            href={animale ? `/animali/${animale.id}?tab=impegni` : '/impegni'}
            className="flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">Indietro</span>
          </Link>
        </div>

        {/* Hero */}
        <div className="flex items-center gap-4">
          <div className={cn(
            'flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-3xl',
            scaduto   ? 'bg-red-100' :
            imminente ? 'bg-amber-100' :
            impegno.stato === 'completato' ? 'bg-green-100' :
            impegno.stato === 'annullato'  ? 'bg-gray-100'  :
                                             'bg-blue-100'
          )}>
            {iconaTipo[impegno.tipo] ?? '📌'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {impegno.titolo}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-bold',
                statoBadge.cls
              )}>
                {statoBadge.label}
              </span>
              {animale && (
                <span className="text-xs text-gray-400">{animale.nome}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 pb-32 space-y-4">

        {/* Card info */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-5 py-2">
          <RigaInfo label="Tipo"        valore={labelTipo[impegno.tipo] ?? impegno.tipo} />
          <RigaInfo label="Data"        valore={formatData(impegno.data)} />
          {impegno.ora && (
            <RigaInfo label="Ora" valore={impegno.ora.slice(0, 5)} />
          )}
          <RigaInfo label="Ripetizione" valore={labelFrequenza[impegno.frequenza] ?? impegno.frequenza} />
          {impegno.note && (
            <RigaInfo label="Note" valore={impegno.note} />
          )}
        </div>

        {/* Azioni */}
        <AzioniImpegno impegnoId={impegno.id} statoAttuale={impegno.stato} />

        {/* Pulsante modifica — solo se programmato */}
        {impegno.stato === 'programmato' && (
          <Link
            href={`/impegni/${impegno.id}/modifica`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-600 shadow-sm active:scale-[0.98] transition-all"
          >
            <Pencil size={16} strokeWidth={2.2} />
            Modifica impegno
          </Link>
        )}

      </div>
    </div>
  )
}