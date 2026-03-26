import type { ReactNode } from 'react'
import Link from 'next/link'
import { formatData } from '@/lib/utils/date'
import type { Database } from '@/lib/types/database.types'
import {
  Stethoscope,
  Clock3,
  Archive,
  CheckCircle2,
  ChevronRight,
  Plus,
  CalendarDays,
  NotebookText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Terapia = Database['public']['Tables']['terapie']['Row']
type SomministrazioneTerapia =
  Database['public']['Tables']['somministrazioni_terapia']['Row']

type TerapiaConUltimaSomministrazione = Terapia & {
  ultimaSomministrazione: SomministrazioneTerapia | null
}

const LABEL_FREQUENZA: Record<string, string> = {
  una_volta_giorno: '1× al giorno',
  due_volte_giorno: '2× al giorno',
  tre_volte_giorno: '3× al giorno',
  al_bisogno: 'Al bisogno',
  personalizzata: 'Personalizzata',
}

const LABEL_STATO: Record<Terapia['stato'], string> = {
  attiva: 'Attiva',
  conclusa: 'Conclusa',
  archiviata: 'Archiviata',
}

function getLabelFrequenza(frequenza: Terapia['frequenza'] | null) {
  if (!frequenza) return 'Frequenza non specificata'
  return LABEL_FREQUENZA[frequenza] ?? frequenza
}

function getBadgeClass(stato: Terapia['stato']) {
  if (stato === 'attiva') {
    return 'border-green-200 bg-green-100 text-green-700'
  }

  if (stato === 'conclusa') {
    return 'border-amber-200 bg-amber-100 text-amber-700'
  }

  return 'border-gray-200 bg-gray-100 text-gray-500'
}

function getToneByState(stato: Terapia['stato']) {
  if (stato === 'attiva') {
    return {
      card: 'border-teal-100 bg-white',
      iconWrap: 'bg-teal-100 text-teal-700',
      accent: 'text-teal-700',
    }
  }

  if (stato === 'conclusa') {
    return {
      card: 'border-amber-100 bg-white',
      iconWrap: 'bg-amber-100 text-amber-700',
      accent: 'text-amber-700',
    }
  }

  return {
    card: 'border-slate-200 bg-white',
    iconWrap: 'bg-slate-100 text-slate-600',
    accent: 'text-slate-600',
  }
}

function getSezioneIcona(stato: Terapia['stato']) {
  if (stato === 'attiva') {
    return <Stethoscope size={16} strokeWidth={2.2} />
  }

  if (stato === 'conclusa') {
    return <CheckCircle2 size={16} strokeWidth={2.2} />
  }

  return <Archive size={16} strokeWidth={2.2} />
}

function formatUltimaSomministrazione(data: string | null) {
  if (!data) return 'Mai registrata'

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

function ordinaPerDataInizioDesc(
  a: TerapiaConUltimaSomministrazione,
  b: TerapiaConUltimaSomministrazione
) {
  const dataA = a.data_inizio ? new Date(a.data_inizio).getTime() : 0
  const dataB = b.data_inizio ? new Date(b.data_inizio).getTime() : 0
  return dataB - dataA
}

function SummaryBox({
  value,
  label,
}: {
  value: number
  label: string
}) {
  return (
    <div className="rounded-2xl bg-[#FCF8F3] px-3 py-3 text-center">
      <p className="text-lg font-extrabold text-gray-900">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
    </div>
  )
}

function DetailPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] p-3">
      <div className="mb-2 flex items-center gap-2 text-gray-400">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#EEE4D9] bg-white">
          {icon}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">
          {label}
        </p>
      </div>
      <p className="text-sm font-bold leading-5 text-gray-800">{value}</p>
    </div>
  )
}

function CardTerapia({
  terapia,
}: {
  terapia: TerapiaConUltimaSomministrazione
}) {
  const tone = getToneByState(terapia.stato)

  return (
    <Link
      href={`/terapie/${terapia.id}`}
      className={cn(
        'block rounded-[28px] border p-4 shadow-sm transition-all active:scale-[0.99]',
        tone.card
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            tone.iconWrap
          )}
        >
          <Stethoscope size={20} strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold text-gray-900">
                {terapia.nome_farmaco}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {getLabelFrequenza(terapia.frequenza)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold',
                  getBadgeClass(terapia.stato)
                )}
              >
                {LABEL_STATO[terapia.stato]}
              </span>
              <ChevronRight
                size={18}
                strokeWidth={2.4}
                className="shrink-0 text-gray-300"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailPill
              icon={<NotebookText size={14} strokeWidth={2.1} />}
              label="Dose"
              value={terapia.dose || 'Non indicata'}
            />
            <DetailPill
              icon={<Clock3 size={14} strokeWidth={2.1} />}
              label="Ultima"
              value={formatUltimaSomministrazione(
                terapia.ultimaSomministrazione?.somministrata_il ?? null
              )}
            />
            <DetailPill
              icon={<CalendarDays size={14} strokeWidth={2.1} />}
              label="Inizio"
              value={
                terapia.data_inizio
                  ? formatData(terapia.data_inizio)
                  : 'Non indicata'
              }
            />
            <DetailPill
              icon={<CalendarDays size={14} strokeWidth={2.1} />}
              label="Fine"
              value={
                terapia.data_fine
                  ? formatData(terapia.data_fine)
                  : 'Non indicata'
              }
            />
          </div>

          {terapia.note && (
            <div className="mt-3 rounded-2xl bg-[#FCF8F3] px-3 py-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Note
              </p>
              <p className="line-clamp-2 text-sm leading-5 text-gray-600">
                {terapia.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function SezioneTerapie({
  titolo,
  terapie,
  emptyLabel,
  stato,
}: {
  titolo: string
  terapie: TerapiaConUltimaSomministrazione[]
  emptyLabel: string
  stato: Terapia['stato']
}) {
  const tone = getToneByState(stato)

  return (
    <section className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-2xl',
              tone.iconWrap
            )}
          >
            {getSezioneIcona(stato)}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">{titolo}</h3>
          </div>
        </div>

        <span className="rounded-full border border-[#EEE4D9] bg-[#FCF8F3] px-3 py-1 text-xs font-bold text-gray-500">
          {terapie.length}
        </span>
      </div>

      {terapie.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-4 py-8 text-center">
          <p className="text-sm font-medium text-gray-400">{emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {terapie.map((terapia) => (
            <CardTerapia key={terapia.id} terapia={terapia} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function TabTerapie({
  animaleId,
  terapie,
}: {
  animaleId: string
  terapie: TerapiaConUltimaSomministrazione[]
}) {
  const attive = terapie
    .filter((terapia) => terapia.stato === 'attiva')
    .sort(ordinaPerDataInizioDesc)

  const concluse = terapie
    .filter((terapia) => terapia.stato === 'conclusa')
    .sort(ordinaPerDataInizioDesc)

  const archiviate = terapie
    .filter((terapia) => terapia.stato === 'archiviata')
    .sort(ordinaPerDataInizioDesc)

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <SummaryBox value={attive.length} label="Attive" />
          <SummaryBox value={concluse.length} label="Concluse" />
          <SummaryBox value={archiviate.length} label="Archiviate" />
        </div>

        <Link
          href={`/animali/${animaleId}/terapie/nuova`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.4} />
          Aggiungi terapia
        </Link>
      </div>

      <SezioneTerapie
        titolo="Terapie attive"
        terapie={attive}
        emptyLabel="Nessuna terapia attiva."
        stato="attiva"
      />

      <SezioneTerapie
        titolo="Terapie concluse"
        terapie={concluse}
        emptyLabel="Nessuna terapia conclusa."
        stato="conclusa"
      />

      <SezioneTerapie
        titolo="Terapie archiviate"
        terapie={archiviate}
        emptyLabel="Nessuna terapia archiviata."
        stato="archiviata"
      />
    </div>
  )
}