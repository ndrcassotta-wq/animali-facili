import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { formatData } from '@/lib/utils/date'
import { Stethoscope, Clock3, Plus, ChevronRight, Check } from 'lucide-react'
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
  if (stato === 'attiva') return 'bg-green-100 text-green-700'
  if (stato === 'conclusa') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-500'
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

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <Link
        href={`/terapie/${terapia.id}`}
        className="flex items-center gap-3 p-4 transition-all active:scale-[0.98]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100">
          <Stethoscope size={20} strokeWidth={2.2} className="text-teal-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-bold text-gray-800">
              {terapia.nome_farmaco}
            </p>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                getBadgeClass(terapia.stato)
              )}
            >
              {terapia.stato === 'attiva'
                ? 'Attiva'
                : terapia.stato === 'conclusa'
                  ? 'Conclusa'
                  : 'Archiviata'}
            </span>
          </div>

          {terapia.animali && (
            <p className="mt-0.5 text-xs text-gray-400">{terapia.animali.nome}</p>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <span>{terapia.dose || 'Dose non indicata'}</span>
            <span>·</span>
            <span>
              {LABEL_FREQUENZA[terapia.frequenza ?? ''] ??
                terapia.frequenza ??
                'Non specificata'}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <Clock3 size={11} className="text-gray-400" />
            <p className="text-xs text-gray-400">
              Ultima:{' '}
              {formatUltimaSomministrazione(
                terapia.ultimaSomministrazione?.somministrata_il ?? null
              )}
            </p>
          </div>

          {terapia.data_inizio && (
            <p className="mt-1 text-xs text-gray-400">
              Inizio: {formatData(terapia.data_inizio)}
            </p>
          )}

          {terapia.ora_somministrazione && (
            <p className="mt-1 text-xs text-gray-400">
              Orario: {terapia.ora_somministrazione.slice(0, 5)}
            </p>
          )}
        </div>

        <ChevronRight size={16} className="shrink-0 text-gray-300" />
      </Link>

      {terapia.stato === 'attiva' && (
        <div className="px-4 pb-4">
          <form action={segnaSomministrataRapida}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 active:scale-[0.98] transition-all"
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

  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>
      <header className="shrink-0 px-5 pt-10 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Terapie
        </h1>
        <p className="mt-0.5 text-sm text-gray-400">
          Farmaci e cure dei tuoi animali
        </p>
      </header>

      <div className="flex flex-1 flex-col px-5 pb-32">
        <div className="mb-5 flex justify-center gap-2">
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
                    : 'border border-gray-200 bg-white text-gray-500'
                )}
              >
                {f.label}
              </Link>
            )
          })}
        </div>

        <Link
          href="/terapie/nuovo"
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 py-4 text-sm font-bold text-amber-600 transition-transform active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Aggiungi terapia
        </Link>

        {terapie.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
            <span className="text-4xl">🩺</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {statoFiltro === 'attiva'
                  ? 'Nessuna terapia attiva'
                  : statoFiltro === 'conclusa'
                    ? 'Nessuna terapia conclusa'
                    : 'Nessuna terapia archiviata'}
              </p>
              {statoFiltro === 'attiva' && (
                <p className="mt-1 text-sm font-bold text-amber-500">
                  Tocca qui sopra per aggiungerne una
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {terapie.map((t) => (
              <CardTerapia key={t.id} terapia={t} returnHref={returnHref} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}