import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { formatData } from '@/lib/utils/date'
import {
  Stethoscope,
  Clock3,
  Plus,
  ChevronRight,
  Check,
  CalendarDays,
  NotebookText,
} from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

export const dynamic = 'force-dynamic'

type Terapia = Database['public']['Tables']['terapie']['Row']
type Somministrazione =
  Database['public']['Tables']['somministrazioni_terapia']['Row']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']
type ImpegnoRow = Database['public']['Tables']['impegni']['Row']

type TerapiaConAnimale = Terapia & {
  animali: { nome: string } | null
  ultimaSomministrazione: Somministrazione | null
}

const filtri = [
  { label: 'Attive', valore: 'attiva' },
  { label: 'Concluse', valore: 'conclusa' },
  { label: 'Archiviate', valore: 'archiviata' },
]

const paramDaStato: Record<string, string> = {
  attiva: '',
  conclusa: 'concluse',
  archiviata: 'archiviate',
}

const LABEL_FREQUENZA: Record<string, string> = {
  una_volta_giorno: '1× al giorno',
  due_volte_giorno: '2× al giorno',
  tre_volte_giorno: '3× al giorno',
  al_bisogno: 'Al bisogno',
  personalizzata: 'Personalizzata',
}

function getBadgeClass(stato: string) {
  if (stato === 'attiva') {
    return 'border-green-200 bg-green-100 text-green-700'
  }
  if (stato === 'conclusa') {
    return 'border-amber-200 bg-amber-100 text-amber-700'
  }
  return 'border-gray-200 bg-gray-100 text-gray-500'
}

function getToneByState(stato: string) {
  if (stato === 'attiva') {
    return {
      iconWrap: 'bg-teal-100 text-teal-700',
      cardBorder: 'border-teal-100',
    }
  }

  if (stato === 'conclusa') {
    return {
      iconWrap: 'bg-amber-100 text-amber-700',
      cardBorder: 'border-amber-100',
    }
  }

  return {
    iconWrap: 'bg-slate-100 text-slate-600',
    cardBorder: 'border-slate-200',
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
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
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
  returnHref,
}: {
  terapia: TerapiaConAnimale
  returnHref: string
}) {
  async function segnaSomministrataRapida() {
    'use server'

    const supabase = await createClient()
    const adesso = new Date()
    const oggi = formatDateOnlyIso(adesso)
    const autoMarker = getAutoTerapiaMarker(terapia.id)

    const { error: insertSomministrazioneError } = await supabase
      .from('somministrazioni_terapia')
      .insert({
        terapia_id: terapia.id,
        somministrata_il: adesso.toISOString(),
        nota: null,
      })

    if (insertSomministrazioneError) {
      throw new Error(insertSomministrazioneError.message)
    }

    const { data: autoImpegniRows, error: autoImpegniError } = await supabase
      .from('impegni')
      .select('*')
      .eq('animale_id', terapia.animale_id)
      .eq('tipo', 'terapia')
      .ilike('note', `%${autoMarker}%`)
      .order('data', { ascending: true })

    if (autoImpegniError) {
      throw new Error(autoImpegniError.message)
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
        throw new Error(completaError.message)
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
        throw new Error(deleteFuturiError.message)
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
        throw new Error(insertImpegnoError.message)
      }
    }

    revalidatePath('/terapie')
    revalidatePath(`/terapie/${terapia.id}`)
    revalidatePath(`/animali/${terapia.animale_id}`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=terapie`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=impegni`)
    revalidatePath('/impegni')
    revalidatePath('/home')

    redirect(returnHref)
  }

  const tone = getToneByState(terapia.stato)

  return (
    <div
      className={cn(
        'rounded-[28px] border bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]',
        tone.cardBorder
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
                {terapia.animali && (
                  <p className="mt-1 text-sm text-gray-500">
                    {terapia.animali.nome}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold',
                    getBadgeClass(terapia.stato)
                  )}
                >
                  {terapia.stato === 'attiva'
                    ? 'Attiva'
                    : terapia.stato === 'conclusa'
                      ? 'Conclusa'
                      : 'Archiviata'}
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
                label="Dose"
                value={terapia.dose || 'Non indicata'}
                icon={<NotebookText size={14} strokeWidth={2.1} />}
              />
              <DetailPill
                label="Frequenza"
                value={
                  LABEL_FREQUENZA[terapia.frequenza ?? ''] ??
                  terapia.frequenza ??
                  'Non specificata'
                }
                icon={<Clock3 size={14} strokeWidth={2.1} />}
              />
              <DetailPill
                label="Ultima"
                value={formatUltimaSomministrazione(
                  terapia.ultimaSomministrazione?.somministrata_il ?? null
                )}
                icon={<Clock3 size={14} strokeWidth={2.1} />}
              />
              <DetailPill
                label="Inizio"
                value={
                  terapia.data_inizio
                    ? formatData(terapia.data_inizio)
                    : 'Non indicata'
                }
                icon={<CalendarDays size={14} strokeWidth={2.1} />}
              />
            </div>

            {terapia.ora_somministrazione && (
              <div className="mt-3 rounded-2xl bg-[#FCF8F3] px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                  Orario
                </p>
                <p className="mt-1 text-sm font-bold text-gray-800">
                  {terapia.ora_somministrazione.slice(0, 5)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Link>

      {terapia.stato === 'attiva' && (
        <div className="mt-4">
          <form action={segnaSomministrataRapida}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-200 active:scale-[0.98] transition-all"
            >
              <Check size={16} strokeWidth={2.5} />
              Segna somministrata
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default async function ListaTerapiePage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string }>
}) {
  const { stato } = await searchParams

  const statoFiltro =
    stato === 'concluse'
      ? 'conclusa'
      : stato === 'archiviate'
        ? 'archiviata'
        : 'attiva'

  const returnHref =
    statoFiltro === 'conclusa'
      ? '/terapie?stato=concluse'
      : statoFiltro === 'archiviata'
        ? '/terapie?stato=archiviate'
        : '/terapie'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: terapieRaw } = await supabase
    .from('terapie')
    .select('*, animali(nome)')
    .eq('stato', statoFiltro)
    .order('data_inizio', { ascending: false })

  const terapieBase = (terapieRaw ?? []) as (Terapia & {
    animali: { nome: string } | null
  })[]

  const terapiaIds = terapieBase.map((t) => t.id)
  let somministrazioni: Somministrazione[] = []

  if (terapiaIds.length > 0) {
    const { data } = await supabase
      .from('somministrazioni_terapia')
      .select('*')
      .in('terapia_id', terapiaIds)
      .order('somministrata_il', { ascending: false })

    somministrazioni = (data ?? []) as Somministrazione[]
  }

  const ultimaPerTerapia = new Map<string, Somministrazione>()
  for (const s of somministrazioni) {
    if (!ultimaPerTerapia.has(s.terapia_id)) {
      ultimaPerTerapia.set(s.terapia_id, s)
    }
  }

  const terapie: TerapiaConAnimale[] = terapieBase.map((t) => ({
    ...t,
    ultimaSomministrazione: ultimaPerTerapia.get(t.id) ?? null,
  }))

  const attiveCount = terapieBase.filter((t) => t.stato === 'attiva').length
  const concluseCount = terapieBase.filter((t) => t.stato === 'conclusa').length
  const archiviateCount = terapieBase.filter(
    (t) => t.stato === 'archiviata'
  ).length

  return (
    <div className="flex flex-col bg-[#F7F1EA]" style={{ minHeight: '100dvh' }}>
      <header className="shrink-0 rounded-b-[34px] bg-gradient-to-b from-[#FFF4E8] to-[#F7F1EA] px-5 pb-5 pt-10">
        <div className="rounded-[28px] border border-[#F1E4D7] bg-white/90 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <Stethoscope size={22} strokeWidth={2.2} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Terapie
              </h1>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Farmaci e cure dei tuoi animali in una vista più chiara e veloce.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <SummaryBox value={attiveCount} label="Attive" />
            <SummaryBox value={concluseCount} label="Concluse" />
            <SummaryBox value={archiviateCount} label="Archiviate" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col px-5 pb-32 pt-4">
        <div className="mb-4 flex justify-center gap-2">
          {filtri.map((f) => {
            const param = paramDaStato[f.valore]
            const href = param ? `/terapie?stato=${param}` : '/terapie'

            return (
              <Link
                key={f.valore}
                href={href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                  statoFiltro === f.valore
                    ? 'bg-gray-900 text-white'
                    : 'border border-[#E7DBCF] bg-white text-gray-500'
                )}
              >
                {f.label}
              </Link>
            )
          })}
        </div>

        <Link
          href="/terapie/nuovo"
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Aggiungi terapia
        </Link>

        {terapie.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#E7DBCF] bg-white px-5 py-14 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCF8F3] text-teal-700">
              <Stethoscope size={24} strokeWidth={2.2} />
            </div>

            <p className="text-sm font-semibold text-gray-700">
              {statoFiltro === 'attiva'
                ? 'Nessuna terapia attiva'
                : statoFiltro === 'conclusa'
                  ? 'Nessuna terapia conclusa'
                  : 'Nessuna terapia archiviata'}
            </p>

            {statoFiltro === 'attiva' && (
              <p className="mt-2 text-sm font-medium text-gray-400">
                Aggiungi una nuova terapia per iniziare.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {terapie.map((t) => (
              <CardTerapia key={t.id} terapia={t} returnHref={returnHref} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}