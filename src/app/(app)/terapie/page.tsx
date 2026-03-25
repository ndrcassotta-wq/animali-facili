import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatData } from '@/lib/utils/date'
import { Pill, Clock3, Plus, ChevronRight } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

export const dynamic = 'force-dynamic'

type Terapia = Database['public']['Tables']['terapie']['Row']
type Somministrazione = Database['public']['Tables']['somministrazioni_terapia']['Row']
type TerapiaConAnimale = Terapia & {
  animali: { nome: string } | null
  ultimaSomministrazione: Somministrazione | null
}

const LABEL_FREQUENZA: Record<string, string> = {
  una_volta_giorno: '1× al giorno',
  due_volte_giorno: '2× al giorno',
  tre_volte_giorno: '3× al giorno',
  al_bisogno: 'Al bisogno',
  personalizzata: 'Personalizzata',
}

const LABEL_STATO: Record<string, string> = {
  attiva: 'Attive',
  conclusa: 'Concluse',
  archiviata: 'Archiviate',
}

function getBadgeClass(stato: string) {
  if (stato === 'attiva')   return 'bg-green-100 text-green-700'
  if (stato === 'conclusa') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-500'
}

function formatUltimaSomministrazione(data: string | null) {
  if (!data) return 'Mai registrata'
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short', timeStyle: 'short',
  }).format(new Date(data))
}

function CardTerapia({ terapia }: { terapia: TerapiaConAnimale }) {
  return (
    <Link
      href={`/terapie/${terapia.id}`}
      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all active:scale-[0.98]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100">
        <Pill size={20} strokeWidth={2.2} className="text-teal-600" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold text-gray-800">
            {terapia.nome_farmaco}
          </p>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getBadgeClass(terapia.stato)}`}>
            {terapia.stato === 'attiva' ? 'Attiva' : terapia.stato === 'conclusa' ? 'Conclusa' : 'Archiviata'}
          </span>
        </div>

        {terapia.animali && (
          <p className="mt-0.5 text-xs text-gray-400">{terapia.animali.nome}</p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
          <span>{terapia.dose}</span>
          <span>·</span>
          <span>{LABEL_FREQUENZA[terapia.frequenza ?? ''] ?? terapia.frequenza}</span>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          <Clock3 size={11} className="text-gray-400" />
          <p className="text-xs text-gray-400">
            Ultima: {formatUltimaSomministrazione(terapia.ultimaSomministrazione?.somministrata_il ?? null)}
          </p>
        </div>
      </div>

      <ChevronRight size={16} className="shrink-0 text-gray-300" />
    </Link>
  )
}

function Sezione({
  titolo, terapie, emptyLabel,
}: {
  titolo: string
  terapie: TerapiaConAnimale[]
  emptyLabel: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">{titolo}</h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-500 shadow-sm">
          {terapie.length}
        </span>
      </div>
      {terapie.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {terapie.map(t => <CardTerapia key={t.id} terapia={t} />)}
        </div>
      )}
    </div>
  )
}

export default async function ListaTerapiePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terapieRaw } = await supabase
    .from('terapie')
    .select('*, animali(nome)')
    .order('data_inizio', { ascending: false })

  const terapieBase = (terapieRaw ?? []) as (Terapia & { animali: { nome: string } | null })[]

  // Carica ultima somministrazione per ogni terapia
  const terapiaIds = terapieBase.map(t => t.id)
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

  const terapie: TerapiaConAnimale[] = terapieBase.map(t => ({
    ...t,
    ultimaSomministrazione: ultimaPerTerapia.get(t.id) ?? null,
  }))

  const attive     = terapie.filter(t => t.stato === 'attiva')
  const concluse   = terapie.filter(t => t.stato === 'conclusa')
  const archiviate = terapie.filter(t => t.stato === 'archiviata')

  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>

      <header className="shrink-0 px-5 pt-10 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Terapie</h1>
        <p className="mt-0.5 text-sm text-gray-400">Farmaci e cure dei tuoi animali</p>
      </header>

      <div className="flex-1 px-5 pb-32 space-y-6">

        {/* Pulsante aggiungi */}
        <Link
          href="/terapie/nuovo"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 py-4 text-sm font-bold text-amber-600 active:scale-[0.98] transition-transform"
        >
          <Plus size={18} strokeWidth={2.5} />
          Aggiungi terapia
        </Link>

        {terapie.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
            <span className="text-4xl">💊</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">Nessuna terapia</p>
              <p className="mt-1 text-xs text-gray-400">Tocca qui sopra per aggiungerne una</p>
            </div>
          </div>
        ) : (
          <>
            <Sezione titolo="Terapie attive"     terapie={attive}     emptyLabel="Nessuna terapia attiva" />
            <Sezione titolo="Terapie concluse"   terapie={concluse}   emptyLabel="Nessuna terapia conclusa" />
            <Sezione titolo="Terapie archiviate" terapie={archiviate} emptyLabel="Nessuna terapia archiviata" />
          </>
        )}

      </div>
    </div>
  )
}