'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  CalendarDays,
  ChevronRight,
  FileText,
  Check,
  Stethoscope,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Impegno, Documento } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'

type Terapia = Database['public']['Tables']['terapie']['Row']
type SomministrazioneTerapia =
  Database['public']['Tables']['somministrazioni_terapia']['Row']

type TerapiaConUltimaSomministrazione = Terapia & {
  ultimaSomministrazione: SomministrazioneTerapia | null
}

type StoricoItemType =
  | 'documento'
  | 'impegno'
  | 'inizio_terapia'
  | 'fine_terapia'
  | 'somministrazione'

type StoricoItem = {
  id: string
  type: StoricoItemType
  occurredAt: string
  title: string
  subtitle: string
  href?: string
  badge: string
  secondaryBadge?: string
}

const LABEL_DOCUMENTO: Record<string, string> = {
  ricetta: 'Ricetta',
  referto: 'Referto',
  analisi: 'Analisi',
  certificato: 'Certificato',
  documento_sanitario: 'Doc. sanitario',
  ricevuta: 'Ricevuta',
  altro: 'Documento',
}

const LABEL_IMPEGNO: Record<string, string> = {
  visita: 'Visita',
  controllo: 'Controllo',
  vaccinazione: 'Vaccinazione',
  toelettatura: 'Toelettatura',
  addestramento: 'Addestramento',
  compleanno: 'Compleanno',
  altro: 'Impegno',
  terapia: 'Terapia',
}

const LABEL_STATO_IMPEGNO: Record<string, string> = {
  programmato: 'Programmato',
  completato: 'Completato',
  annullato: 'Annullato',
}

const LABEL_FREQUENZA: Record<string, string> = {
  una_volta_giorno: '1× al giorno',
  due_volte_giorno: '2× al giorno',
  tre_volte_giorno: '3× al giorno',
  al_bisogno: 'Al bisogno',
  personalizzata: 'Personalizzata',
}

function parseDateOnly(value?: string | null) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseDateTime(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatOra(value?: string | null) {
  if (!value) return null

  const oraPulita = value.trim()
  if (!oraPulita) return null

  const matchOrario = oraPulita.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (matchOrario) {
    return `${matchOrario[1].padStart(2, '0')}:${matchOrario[2]}`
  }

  const data = new Date(oraPulita)
  if (Number.isNaN(data.getTime())) return null

  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)
}

function getOrarioImpegno(impegno: Impegno) {
  const candidato = impegno as Impegno & {
    orario?: string | null
    ora?: string | null
    data_ora?: string | null
    datetime?: string | null
  }

  return (
    formatOra(candidato.orario) ??
    formatOra(candidato.ora) ??
    formatOra(candidato.data_ora) ??
    formatOra(candidato.datetime) ??
    null
  )
}

function buildImpegnoOccurredAt(impegno: Impegno) {
  const orario = getOrarioImpegno(impegno)

  if (impegno.data && orario) {
    const date = new Date(`${impegno.data}T${orario}:00`)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }

  const dataOnly = parseDateOnly(impegno.data)
  if (dataOnly) return dataOnly.toISOString()

  const createdAt = parseDateTime((impegno as { created_at?: string | null }).created_at)
  if (createdAt) return createdAt.toISOString()

  return new Date(0).toISOString()
}

function buildDocumentoOccurredAt(documento: Documento) {
  const dataDocumento = parseDateOnly(documento.data_documento)
  if (dataDocumento) return dataDocumento.toISOString()

  const createdAt = parseDateTime(documento.created_at)
  if (createdAt) return createdAt.toISOString()

  return new Date(0).toISOString()
}

function buildTerapiaStartOccurredAt(terapia: Terapia) {
  const dataInizio = parseDateOnly(terapia.data_inizio)
  if (dataInizio) return dataInizio.toISOString()

  const createdAt = parseDateTime(terapia.created_at)
  if (createdAt) return createdAt.toISOString()

  return new Date(0).toISOString()
}

function buildTerapiaEndOccurredAt(terapia: Terapia) {
  const dataFine = parseDateOnly(terapia.data_fine)
  if (dataFine) return dataFine.toISOString()

  return null
}

function monthKey(value: string) {
  const d = new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatStoricoDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatStoricoTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const hours = date.getHours()
  const minutes = date.getMinutes()

  if (hours === 12 && minutes === 0) return null

  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getTone(type: StoricoItemType) {
  if (type === 'documento') {
    return {
      card: 'border-amber-100 bg-white',
      iconWrap: 'bg-amber-100 text-amber-700',
      badge: 'bg-amber-50 text-amber-700',
    }
  }

  if (type === 'impegno') {
    return {
      card: 'border-blue-100 bg-white',
      iconWrap: 'bg-blue-100 text-blue-700',
      badge: 'bg-blue-50 text-blue-700',
    }
  }

  if (type === 'somministrazione') {
    return {
      card: 'border-green-100 bg-white',
      iconWrap: 'bg-green-100 text-green-700',
      badge: 'bg-green-50 text-green-700',
    }
  }

  return {
    card: 'border-teal-100 bg-white',
    iconWrap: 'bg-teal-100 text-teal-700',
    badge: 'bg-teal-50 text-teal-700',
  }
}

function ItemIcon({ type }: { type: StoricoItemType }) {
  if (type === 'documento') {
    return <FileText size={18} strokeWidth={2.2} />
  }

  if (type === 'impegno') {
    return <CalendarDays size={18} strokeWidth={2.2} />
  }

  if (type === 'somministrazione') {
    return <Check size={18} strokeWidth={2.6} />
  }

  return <Stethoscope size={18} strokeWidth={2.2} />
}

function StoricoCard({ item }: { item: StoricoItem }) {
  const tone = getTone(item.type)
  const dateLabel = formatStoricoDate(item.occurredAt)
  const timeLabel = formatStoricoTime(item.occurredAt)

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[28px] border p-4 shadow-sm transition-all active:scale-[0.98]',
        tone.card
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
          tone.iconWrap
        )}
      >
        <ItemIcon type={item.type} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]',
              tone.badge
            )}
          >
            {item.badge}
          </span>

          {item.secondaryBadge && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600">
              {item.secondaryBadge}
            </span>
          )}
        </div>

        <p className="text-sm font-extrabold text-gray-900">{item.title}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{item.subtitle}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-bold text-gray-500">{dateLabel}</span>
        {timeLabel && (
          <span className="text-xs font-medium text-gray-400">{timeLabel}</span>
        )}
      </div>

      {item.href ? (
        <ChevronRight
          size={18}
          strokeWidth={2.4}
          className="shrink-0 text-gray-300"
        />
      ) : null}
    </div>
  )

  if (!item.href) return content

  return <Link href={item.href}>{content}</Link>
}

export default function TabStorico({
  animaleId,
  documenti,
  impegni,
  terapie,
  somministrazioni,
}: {
  animaleId: string
  documenti: Documento[]
  impegni: Impegno[]
  terapie: TerapiaConUltimaSomministrazione[]
  somministrazioni: SomministrazioneTerapia[]
}) {
  const items = useMemo<StoricoItem[]>(() => {
    const now = new Date()
    const terapieById = new Map(terapie.map((terapia) => [terapia.id, terapia]))

    const itemsDocumenti: StoricoItem[] = documenti.map((documento) => ({
      id: `documento-${documento.id}`,
      type: 'documento',
      occurredAt: buildDocumentoOccurredAt(documento),
      title: documento.titolo || 'Documento',
      subtitle:
        LABEL_DOCUMENTO[documento.categoria] ??
        'Documento salvato nell’archivio',
      badge: 'Documento',
      href: `/documenti/${documento.id}?from=animale`,
    }))

    const itemsImpegni: StoricoItem[] = impegni
      .filter((impegno) => impegno.tipo !== 'terapia')
      .filter((impegno) => {
        const dataImpegno = parseDateOnly(impegno.data)
        if (!dataImpegno) return false

        const endOfDay = new Date(`${impegno.data}T23:59:59`)
        return endOfDay.getTime() <= now.getTime()
      })
      .map((impegno) => ({
        id: `impegno-${impegno.id}`,
        type: 'impegno' as const,
        occurredAt: buildImpegnoOccurredAt(impegno),
        title: impegno.titolo || 'Impegno',
        subtitle:
          LABEL_IMPEGNO[impegno.tipo] ??
          'Evento registrato nella sezione impegni',
        badge: 'Impegno',
        secondaryBadge: LABEL_STATO_IMPEGNO[impegno.stato] ?? undefined,
        href: `/impegni/${impegno.id}`,
      }))

    const itemsInizioTerapia: StoricoItem[] = terapie.map((terapia) => ({
      id: `terapia-inizio-${terapia.id}`,
      type: 'inizio_terapia',
      occurredAt: buildTerapiaStartOccurredAt(terapia),
      title: `Inizio terapia: ${terapia.nome_farmaco}`,
      subtitle: [
        terapia.dose || null,
        terapia.frequenza
          ? LABEL_FREQUENZA[terapia.frequenza] ?? terapia.frequenza
          : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'Terapia registrata',
      badge: 'Terapia',
      secondaryBadge: 'Inizio',
      href: `/terapie/${terapia.id}`,
    }))

    const itemsFineTerapia: StoricoItem[] = terapie
      .filter((terapia) => terapia.stato === 'conclusa' && Boolean(terapia.data_fine))
      .map((terapia) => {
        const occurredAt = buildTerapiaEndOccurredAt(terapia)

        if (!occurredAt) return null

        return {
          id: `terapia-fine-${terapia.id}`,
          type: 'fine_terapia' as const,
          occurredAt,
          title: `Fine terapia: ${terapia.nome_farmaco}`,
          subtitle: terapia.dose || 'Terapia conclusa',
          badge: 'Terapia',
          secondaryBadge: 'Fine',
          href: `/terapie/${terapia.id}`,
        }
      })
      .filter(Boolean) as StoricoItem[]

    const itemsSomministrazioni: StoricoItem[] = somministrazioni
      .map((somministrazione) => {
        const terapia = terapieById.get(somministrazione.terapia_id)
        const occurredAt = parseDateTime(somministrazione.somministrata_il)

        if (!terapia || !occurredAt) return null

        return {
          id: `somministrazione-${somministrazione.id}`,
          type: 'somministrazione' as const,
          occurredAt: occurredAt.toISOString(),
          title: `Somministrato: ${terapia.nome_farmaco}`,
          subtitle: terapia.dose || 'Somministrazione registrata',
          badge: 'Somministrazione',
          href: `/terapie/${terapia.id}`,
        }
      })
      .filter(Boolean) as StoricoItem[]

    return [
      ...itemsDocumenti,
      ...itemsImpegni,
      ...itemsInizioTerapia,
      ...itemsFineTerapia,
      ...itemsSomministrazioni,
    ].sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
  }, [documenti, impegni, somministrazioni, terapie])

  const groupedItems = useMemo(() => {
    return items.reduce<Record<string, StoricoItem[]>>((acc, item) => {
      const key = monthKey(item.occurredAt)
      acc[key] = acc[key] ? [...acc[key], item] : [item]
      return acc
    }, {})
  }, [items])

  const totaleDocumenti = documenti.length
  const totaleImpegniStorici = impegni.filter(
    (impegno) => impegno.tipo !== 'terapia'
  ).length
  const totaleTerapie = terapie.length
  const totaleSomministrazioni = somministrazioni.length

  return (
    <div className="space-y-4 px-5 py-5 pb-32">
      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FCF8F3] text-slate-700 shadow-sm">
              <CalendarDays size={22} strokeWidth={2.2} />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Storico
            </p>

            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
              Timeline dell’animale
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Qui trovi gli eventi oggettivi già registrati per questo animale:
              documenti, impegni passati, terapie e somministrazioni.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-[#EADFD3] bg-[#FCF8F3] px-3 py-1 text-xs font-semibold text-gray-500 shadow-sm">
            {items.length} eventi
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
              Documenti
            </p>
            <p className="mt-1 text-lg font-extrabold text-gray-900">
              {totaleDocumenti}
            </p>
          </div>

          <div className="rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
              Impegni
            </p>
            <p className="mt-1 text-lg font-extrabold text-gray-900">
              {totaleImpegniStorici}
            </p>
          </div>

          <div className="rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
              Terapie
            </p>
            <p className="mt-1 text-lg font-extrabold text-gray-900">
              {totaleTerapie}
            </p>
          </div>

          <div className="rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
              Somministrazioni
            </p>
            <p className="mt-1 text-lg font-extrabold text-gray-900">
              {totaleSomministrazioni}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Link
            href={`/impegni/nuovo?animale_id=${animaleId}`}
            className="inline-flex items-center justify-center rounded-full border border-[#EADFD3] bg-[#FCF8F3] px-4 py-2 text-xs font-bold text-gray-700 transition-all active:scale-[0.98]"
          >
            Aggiungi nuovo evento
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#EADFD3] bg-white px-6 py-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCF8F3] text-slate-600">
            <CalendarDays size={24} strokeWidth={2.2} />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">
            Nessun evento nello storico
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Lo storico si popola automaticamente con documenti, impegni passati,
            terapie e somministrazioni già registrati.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([key, group]) => (
            <section key={key} className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <div className="h-px flex-1 bg-[#EADFD3]" />
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                  {monthLabel(group[0].occurredAt)}
                </p>
                <div className="h-px flex-1 bg-[#EADFD3]" />
              </div>

              <div className="space-y-3">
                {group.map((item) => (
                  <StoricoCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}