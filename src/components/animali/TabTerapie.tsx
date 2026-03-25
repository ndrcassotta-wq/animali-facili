import Link from 'next/link'
import { formatData } from '@/lib/utils/date'
import type { Database } from '@/lib/types/database.types'
import { Pill, Clock3, Archive, CheckCircle2 } from 'lucide-react'

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
    return 'bg-green-100 text-green-700'
  }

  if (stato === 'conclusa') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-gray-100 text-gray-500'
}

function getSezioneIcona(stato: Terapia['stato']) {
  if (stato === 'attiva') {
    return <Pill size={16} className="text-amber-500" />
  }

  if (stato === 'conclusa') {
    return <CheckCircle2 size={16} className="text-amber-500" />
  }

  return <Archive size={16} className="text-amber-500" />
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

function CardTerapia({
  terapia,
}: {
  terapia: TerapiaConUltimaSomministrazione
}) {
  return (
    <Link
      href={`/terapie/${terapia.id}`}
      className="block rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-sm transition-all active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Pill size={18} strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-800">
                {terapia.nome_farmaco}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {terapia.dose ? `${terapia.dose} · ` : ''}
                {getLabelFrequenza(terapia.frequenza)}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getBadgeClass(
                terapia.stato
              )}`}
            >
              {LABEL_STATO[terapia.stato]}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-xs text-gray-500">
            <p>
              Inizio:{' '}
              <span className="font-medium text-gray-700">
                {terapia.data_inizio ? formatData(terapia.data_inizio) : 'Non indicata'}
              </span>
            </p>

            <p>
              Fine:{' '}
              <span className="font-medium text-gray-700">
                {terapia.data_fine ? formatData(terapia.data_fine) : 'Non indicata'}
              </span>
            </p>

            <div className="flex items-center gap-1.5 pt-1">
              <Clock3 size={13} className="text-gray-400" />
              <p className="text-xs text-gray-500">
                Ultima somministrazione:{' '}
                <span className="font-medium text-gray-700">
                  {formatUltimaSomministrazione(
                    terapia.ultimaSomministrazione?.somministrata_il ?? null
                  )}
                </span>
              </p>
            </div>
          </div>

          {terapia.note && (
            <p className="mt-3 line-clamp-2 text-xs text-gray-500">
              {terapia.note}
            </p>
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
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getSezioneIcona(stato)}
          <h3 className="text-sm font-bold text-gray-800">{titolo}</h3>
        </div>
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
          {terapie.map((terapia) => (
            <CardTerapia key={terapia.id} terapia={terapia} />
          ))}
        </div>
      )}
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
    <div className="space-y-5 px-4 py-4">
      <Link
        href={`/animali/${animaleId}/terapie/nuova`}
        className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
      >
        + Aggiungi terapia
      </Link>

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