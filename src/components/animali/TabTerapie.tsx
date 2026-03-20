import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatData } from '@/lib/utils/date'
import type { Database } from '@/lib/types/database.types'

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
    return 'border border-green-200 bg-green-50 text-green-700'
  }

  if (stato === 'conclusa') {
    return 'border border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border border-muted bg-muted text-muted-foreground'
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
      className="block rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{terapia.nome_farmaco}</p>

          <p className="mt-1 text-xs text-muted-foreground">
            {terapia.dose ? `${terapia.dose} · ` : ''}
            {getLabelFrequenza(terapia.frequenza)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${getBadgeClass(
            terapia.stato
          )}`}
        >
          {LABEL_STATO[terapia.stato]}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-3">
        <span>
          Inizio:{' '}
          {terapia.data_inizio ? formatData(terapia.data_inizio) : 'Non indicata'}
        </span>

        <span>
          Fine:{' '}
          {terapia.data_fine ? formatData(terapia.data_fine) : 'Non indicata'}
        </span>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Ultima somministrazione:{' '}
        <span className="font-medium">
          {formatUltimaSomministrazione(
            terapia.ultimaSomministrazione?.somministrata_il ?? null
          )}
        </span>
      </div>

      {terapia.note && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {terapia.note}
        </p>
      )}
    </Link>
  )
}

function SezioneTerapie({
  titolo,
  terapie,
  emptyLabel,
}: {
  titolo: string
  terapie: TerapiaConUltimaSomministrazione[]
  emptyLabel: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{titolo}</h3>
        <span className="text-xs text-muted-foreground">{terapie.length}</span>
      </div>

      {terapie.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-2">
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
      <Button asChild size="sm" variant="outline" className="w-full">
        <Link href={`/animali/${animaleId}/terapie/nuova`}>
          + Aggiungi terapia
        </Link>
      </Button>

      <SezioneTerapie
        titolo="Terapie attive"
        terapie={attive}
        emptyLabel="Nessuna terapia attiva."
      />

      <SezioneTerapie
        titolo="Terapie concluse"
        terapie={concluse}
        emptyLabel="Nessuna terapia conclusa."
      />

      <SezioneTerapie
        titolo="Terapie archiviate"
        terapie={archiviate}
        emptyLabel="Nessuna terapia archiviata."
      />
    </div>
  )
}