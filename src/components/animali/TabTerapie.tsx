'use client'

import type { ReactNode } from 'react'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatData } from '@/lib/utils/date'
import type { Database } from '@/lib/types/database.types'
import {
  Stethoscope,
  Clock3,
  ChevronRight,
  Plus,
  CalendarDays,
  NotebookText,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Terapia = Database['public']['Tables']['terapie']['Row']
type SomministrazioneTerapia =
  Database['public']['Tables']['somministrazioni_terapia']['Row']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']
type ImpegnoRow = Database['public']['Tables']['impegni']['Row']

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

const TAB_CONFIG: Record<
  Terapia['stato'],
  {
    label: string
    emptyLabel: string
  }
> = {
  attiva: {
    label: 'Attive',
    emptyLabel: 'Nessuna terapia attiva.',
  },
  conclusa: {
    label: 'Concluse',
    emptyLabel: 'Nessuna terapia conclusa.',
  },
  archiviata: {
    label: 'Archiviate',
    emptyLabel: 'Nessuna terapia archiviata.',
  },
}

const TAB_ORDER: Terapia['stato'][] = ['attiva', 'conclusa', 'archiviata']

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

function formatUltimaSomministrazione(data: string | null) {
  if (!data) return 'Mai registrata'

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

function formatDateOnlyIso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getAutoTerapiaMarker(terapiaId: string) {
  return `[AUTO_TERAPIA:${terapiaId}]`
}

function buildAutoImpegnoNote(terapia: Terapia) {
  return `${getAutoTerapiaMarker(terapia.id)}
Promemoria automatico terapia: ${terapia.nome_farmaco}
Dose: ${terapia.dose || 'Non indicata'}
Frequenza: ${terapia.frequenza || 'Non indicata'}`
}

function calcolaProssimaDataImpegno(
  terapia: Terapia,
  riferimento: Date
): string | null {
  if (terapia.stato !== 'attiva') return null

  if (terapia.frequenza !== 'una_volta_giorno') {
    return null
  }

  const prossima = new Date(riferimento)
  prossima.setDate(prossima.getDate() + 1)

  const prossimaData = formatDateOnlyIso(prossima)

  if (terapia.data_fine && prossimaData > terapia.data_fine) {
    return null
  }

  return prossimaData
}

function ordinaPerDataInizioDesc(
  a: TerapiaConUltimaSomministrazione,
  b: TerapiaConUltimaSomministrazione
) {
  const dataA = a.data_inizio ? new Date(a.data_inizio).getTime() : 0
  const dataB = b.data_inizio ? new Date(b.data_inizio).getTime() : 0
  return dataB - dataA
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
  ultimaSomministrazioneOverride,
  onSomministrata,
}: {
  terapia: TerapiaConUltimaSomministrazione
  ultimaSomministrazioneOverride?: string
  onSomministrata: (id: string, dataIso: string) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const tone = getToneByState(terapia.stato)

  async function segnaSomministrataRapida() {
    const supabase = createClient()
    const adesso = new Date()
    const adessoIso = adesso.toISOString()
    const oggi = formatDateOnlyIso(adesso)
    const autoMarker = getAutoTerapiaMarker(terapia.id)

    onSomministrata(terapia.id, adessoIso)

    startTransition(async () => {
      const { error: insertSomministrazioneError } = await supabase
        .from('somministrazioni_terapia')
        .insert({
          terapia_id: terapia.id,
          somministrata_il: adessoIso,
          nota: null,
        })

      if (insertSomministrazioneError) {
        router.refresh()
        return
      }

      const { data: autoImpegniRows, error: autoImpegniError } = await supabase
        .from('impegni')
        .select('*')
        .eq('animale_id', terapia.animale_id)
        .eq('tipo', 'terapia')
        .ilike('note', `%${autoMarker}%`)
        .order('data', { ascending: true })

      if (autoImpegniError) {
        router.refresh()
        return
      }

      const autoImpegni = (autoImpegniRows ?? []) as ImpegnoRow[]

      const idsDaCompletare = autoImpegni
        .filter((i) => i.stato === 'programmato' && i.data <= oggi)
        .map((i) => i.id)

      if (idsDaCompletare.length > 0) {
        const { error: completaError } = await supabase
          .from('impegni')
          .update({ stato: 'completato' })
          .in('id', idsDaCompletare)

        if (completaError) {
          router.refresh()
          return
        }
      }

      const idsFuturiDaEliminare = autoImpegni
        .filter((i) => i.stato === 'programmato' && i.data > oggi)
        .map((i) => i.id)

      if (idsFuturiDaEliminare.length > 0) {
        const { error: deleteFuturiError } = await supabase
          .from('impegni')
          .delete()
          .in('id', idsFuturiDaEliminare)

        if (deleteFuturiError) {
          router.refresh()
          return
        }
      }

      const prossimaDataImpegno = calcolaProssimaDataImpegno(terapia, adesso)

      if (prossimaDataImpegno) {
        const payloadImpegno: ImpegnoInsert = {
          animale_id: terapia.animale_id,
          titolo: `Terapia: ${terapia.nome_farmaco}`,
          tipo: 'terapia',
          data: prossimaDataImpegno,
          ora: terapia.ora_somministrazione ?? null,
          frequenza: 'nessuna',
          notifiche_attive: false,
          stato: 'programmato',
          note: buildAutoImpegnoNote(terapia),
        }

        const { error: insertImpegnoError } = await supabase
          .from('impegni')
          .insert(payloadImpegno)

        if (insertImpegnoError) {
          router.refresh()
          return
        }
      }

      router.refresh()
    })
  }

  const ultimaDaMostrare =
    ultimaSomministrazioneOverride ??
    terapia.ultimaSomministrazione?.somministrata_il ??
    null

  return (
    <div
      className={cn(
        'rounded-[28px] border p-4 shadow-sm transition-all',
        tone.card
      )}
    >
      <Link
        href={`/terapie/${terapia.id}`}
        className="block transition-all active:scale-[0.99]"
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
                value={formatUltimaSomministrazione(ultimaDaMostrare)}
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

      {terapia.stato === 'attiva' && (
        <div className="mt-4">
          <button
            type="button"
            onClick={segnaSomministrataRapida}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            <Check size={16} strokeWidth={2.5} />
            {isPending ? 'Aggiornamento...' : 'Somministrato'}
          </button>
        </div>
      )}
    </div>
  )
}

function ListaTerapie({
  terapie,
  emptyLabel,
  ultimaSomministrazioneOverrides,
  onSomministrata,
}: {
  terapie: TerapiaConUltimaSomministrazione[]
  emptyLabel: string
  ultimaSomministrazioneOverrides: Record<string, string>
  onSomministrata: (id: string, dataIso: string) => void
}) {
  if (terapie.length === 0) {
    return (
      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="rounded-2xl border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-4 py-8 text-center">
          <p className="text-sm font-medium text-gray-400">{emptyLabel}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {terapie.map((terapia) => (
        <CardTerapia
          key={terapia.id}
          terapia={terapia}
          ultimaSomministrazioneOverride={
            ultimaSomministrazioneOverrides[terapia.id]
          }
          onSomministrata={onSomministrata}
        />
      ))}
    </div>
  )
}

export default function TabTerapie({
  animaleId,
  terapie,
}: {
  animaleId: string
  terapie: TerapiaConUltimaSomministrazione[]
}) {
  const [tabAttivo, setTabAttivo] = useState<Terapia['stato']>('attiva')
  const [ultimaSomministrazioneOverrides, setUltimaSomministrazioneOverrides] =
    useState<Record<string, string>>({})

  function handleSomministrata(id: string, dataIso: string) {
    setUltimaSomministrazioneOverrides((prev) => ({
      ...prev,
      [id]: dataIso,
    }))
  }

  const terapiePerStato = useMemo(
    () => ({
      attiva: terapie
        .filter((terapia) => terapia.stato === 'attiva')
        .sort(ordinaPerDataInizioDesc),
      conclusa: terapie
        .filter((terapia) => terapia.stato === 'conclusa')
        .sort(ordinaPerDataInizioDesc),
      archiviata: terapie
        .filter((terapia) => terapia.stato === 'archiviata')
        .sort(ordinaPerDataInizioDesc),
    }),
    [terapie]
  )

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <Link
          href={`/animali/${animaleId}/terapie/nuova`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 py-4 text-sm font-bold text-amber-600 transition-transform active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Aggiungi terapia
        </Link>
      </div>

      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="grid grid-cols-3 gap-2">
          {TAB_ORDER.map((stato) => {
            const isActive = tabAttivo === stato

            return (
              <button
                key={stato}
                type="button"
                onClick={() => setTabAttivo(stato)}
                className={cn(
                  'rounded-2xl px-3 py-3 text-sm font-bold transition-all',
                  isActive
                    ? 'bg-[#FCF8F3] text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-500'
                )}
              >
                {TAB_CONFIG[stato].label}
              </button>
            )
          })}
        </div>
      </div>

      <ListaTerapie
        terapie={terapiePerStato[tabAttivo]}
        emptyLabel={TAB_CONFIG[tabAttivo].emptyLabel}
        ultimaSomministrazioneOverrides={ultimaSomministrazioneOverrides}
        onSomministrata={handleSomministrata}
      />
    </div>
  )
}