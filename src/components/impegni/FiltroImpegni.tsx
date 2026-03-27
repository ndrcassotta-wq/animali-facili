'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import {
  ChevronRight,
  Check,
  Stethoscope,
  Ban,
  CircleCheck,
} from 'lucide-react'
import type { ImpegnoConAnimale } from '@/lib/types/query.types'
import { createClient } from '@/lib/supabase/client'

const filtri = [
  { label: 'Programmati', valore: 'programmato' },
  { label: 'Completati', valore: 'completato' },
  { label: 'Annullati', valore: 'annullato' },
] as const

const paramDaStato: Record<string, string> = {
  programmato: '',
  completato: 'completati',
  annullato: 'annullati',
}

const labelTipo: Record<string, string> = {
  visita: 'Visita',
  controllo: 'Controllo',
  vaccinazione: 'Vaccinazione',
  toelettatura: 'Toelettatura',
  terapia: 'Terapia',
  addestramento: 'Addestramento',
  compleanno: 'Compleanno',
  altro: 'Altro',
}

const iconaTipo: Record<string, string> = {
  visita: '🩺',
  controllo: '🔍',
  vaccinazione: '💉',
  toelettatura: '✂️',
  terapia: '🩺',
  addestramento: '🎓',
  compleanno: '🎂',
  altro: '📌',
}

function getAutoTerapiaId(note?: string | null) {
  if (!note) return null
  const match = note.match(/\[AUTO_TERAPIA:([^[\]]+)\]/)
  return match?.[1] ?? null
}

function getPreviewNote(impegno: ImpegnoConAnimale) {
  const noteOriginali = impegno.note?.trim()

  if (!noteOriginali) return null

  const autoTerapiaId = getAutoTerapiaId(noteOriginali)
  if (impegno.tipo === 'terapia' && autoTerapiaId) return null

  const notePulite = noteOriginali
    .replace(/\[AUTO_TERAPIA:[^[\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!notePulite) return null

  const LIMITE = 90
  if (notePulite.length <= LIMITE) return notePulite

  return `${notePulite.slice(0, LIMITE).trimEnd()}…`
}

function deduplicaImpegni(impegni: ImpegnoConAnimale[]) {
  const visti = new Set<string>()

  return impegni.filter((impegno) => {
    if (visti.has(impegno.id)) return false
    visti.add(impegno.id)
    return true
  })
}

function EmptyState({ statoAttivo }: { statoAttivo: string }) {
  if (statoAttivo === 'programmato') {
    return (
      <Link
        href="/impegni/nuovo"
        className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 bg-white py-14 text-center transition-transform active:scale-[0.98]"
      >
        <span className="text-4xl">📅</span>
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Nessun impegno programmato
          </p>
          <p className="mt-1 text-sm font-bold text-amber-500">
            Tocca qui per aggiungerne uno →
          </p>
        </div>
      </Link>
    )
  }

  if (statoAttivo === 'completato') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/70 py-14 text-center">
        <span className="text-4xl">✅</span>
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            Nessun impegno completato
          </p>
          <p className="mt-1 text-sm text-emerald-700/80">
            Qui vedrai solo gli impegni già conclusi.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-gray-200 bg-gray-100/70 py-14 text-center">
      <span className="text-4xl">🚫</span>
      <div>
        <p className="text-sm font-semibold text-gray-700">
          Nessun impegno annullato
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Qui vedrai solo gli impegni annullati.
        </p>
      </div>
    </div>
  )
}

function CardImpegno({
  impegno,
  onAggiornaStato,
}: {
  impegno: ImpegnoConAnimale
  onAggiornaStato: (id: string, stato: 'programmato' | 'completato' | 'annullato') => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const statoReale = impegno.stato
  const isProgrammato = statoReale === 'programmato'
  const isCompletato = statoReale === 'completato'
  const isAnnullato = statoReale === 'annullato'

  const scaduto = isProgrammato && isScaduta(impegno.data)
  const imminente = isProgrammato && isImminente(impegno.data)

  const isTerapia = impegno.tipo === 'terapia'
  const isCompleanno = impegno.tipo === 'compleanno'

  const autoTerapiaId = isTerapia ? getAutoTerapiaId(impegno.note) : null
  const previewNota = getPreviewNote(impegno)

  const hrefDettaglio = autoTerapiaId
    ? `/terapie/${autoTerapiaId}`
    : `/impegni/${impegno.id}`

  async function segnaCompletato() {
    const supabase = createClient()

    onAggiornaStato(impegno.id, 'completato')

    startTransition(async () => {
      const { error } = await supabase
        .from('impegni')
        .update({ stato: 'completato' })
        .eq('id', impegno.id)

      if (error) {
        router.refresh()
        return
      }

      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'rounded-[28px] border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-colors',
        isAnnullato
          ? 'border-gray-300 bg-gray-100/90'
          : isCompletato
            ? 'border-emerald-200 bg-emerald-50'
            : scaduto
              ? 'border-red-200 bg-red-50'
              : imminente
                ? 'border-amber-200 bg-amber-50'
                : isTerapia
                  ? 'border-teal-200 bg-teal-50/50'
                  : 'border-[#EADFD3] bg-white'
      )}
    >
      <Link
        href={hrefDettaglio}
        className="flex items-center gap-3 transition-all active:scale-[0.98]"
      >
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl',
            isAnnullato
              ? 'bg-gray-200 text-gray-600'
              : isCompletato
                ? 'bg-emerald-100 text-emerald-700'
                : isTerapia
                  ? 'bg-teal-100 text-teal-700'
                  : scaduto
                    ? 'bg-red-100'
                    : imminente
                      ? 'bg-amber-100'
                      : 'bg-[#FCF8F3]'
          )}
        >
          {isAnnullato ? (
            <Ban size={20} strokeWidth={2.2} />
          ) : isCompletato ? (
            <CircleCheck size={20} strokeWidth={2.2} />
          ) : isTerapia ? (
            <Stethoscope size={20} strokeWidth={2.2} />
          ) : (
            iconaTipo[impegno.tipo] ?? '📌'
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    'truncate text-sm font-bold',
                    isAnnullato
                      ? 'text-gray-500 line-through'
                      : isCompletato
                        ? 'text-emerald-900'
                        : 'text-gray-800'
                  )}
                >
                  {impegno.titolo}
                </p>

                {isTerapia && !isAnnullato && (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]',
                      isCompletato
                        ? 'border border-emerald-200 bg-emerald-100 text-emerald-700'
                        : 'border border-teal-200 bg-teal-100 text-teal-700'
                    )}
                  >
                    Terapia
                  </span>
                )}

                {isAnnullato && (
                  <span className="shrink-0 rounded-full bg-gray-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                    Annullato
                  </span>
                )}

                {isCompletato && (
                  <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                    Completato
                  </span>
                )}
              </div>

              <p
                className={cn(
                  'mt-0.5 text-xs',
                  isAnnullato
                    ? 'text-gray-500'
                    : isCompletato
                      ? 'text-emerald-700/80'
                      : 'text-gray-400'
                )}
              >
                {impegno.animali?.nome ?? '—'} · {labelTipo[impegno.tipo] ?? impegno.tipo}
              </p>

              {isTerapia && !isAnnullato && (
                <p
                  className={cn(
                    'mt-1 text-[11px] font-medium',
                    isCompletato ? 'text-emerald-700' : 'text-teal-700'
                  )}
                >
                  Collegato alla scheda terapia
                </p>
              )}

              {previewNota && (
                <p
                  className={cn(
                    'mt-1 truncate text-[11px] leading-5',
                    isAnnullato ? 'text-gray-500' : 'text-gray-500'
                  )}
                >
                  {previewNota}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              'text-xs font-semibold',
              isAnnullato
                ? 'text-gray-600'
                : isCompletato
                  ? 'text-emerald-700'
                  : scaduto
                    ? 'text-red-500'
                    : imminente
                      ? 'text-amber-600'
                      : isTerapia
                        ? 'text-teal-700'
                        : 'text-gray-400'
            )}
          >
            {formatData(impegno.data)}
          </span>

          {isAnnullato && (
            <span className="rounded-full bg-gray-700 px-2 py-0.5 text-[10px] font-bold text-white">
              Annullato
            </span>
          )}

          {isCompletato && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
              Fatto
            </span>
          )}

          {isProgrammato && scaduto && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              Scaduto
            </span>
          )}

          {isProgrammato && !scaduto && imminente && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
              Urgente
            </span>
          )}

          {isProgrammato && !scaduto && !imminente && isTerapia && (
            <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">
              Terapia
            </span>
          )}
        </div>

        <ChevronRight
          size={16}
          className={cn(
            'shrink-0',
            isAnnullato ? 'text-gray-400' : 'text-gray-300'
          )}
        />
      </Link>

      {isProgrammato && !isCompleanno && (
        <div className="mt-4">
          <button
            type="button"
            onClick={segnaCompletato}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            <Check size={16} strokeWidth={2.5} />
            {isPending ? 'Aggiornamento...' : 'Completato'}
          </button>
        </div>
      )}
    </div>
  )
}

export function FiltroImpegni({
  statoAttivo,
  impegni,
}: {
  statoAttivo: string
  impegni: ImpegnoConAnimale[]
}) {
  const router = useRouter()
  const [impegniLocali, setImpegniLocali] = useState<ImpegnoConAnimale[]>(() =>
    deduplicaImpegni(impegni)
  )

  useEffect(() => {
    setImpegniLocali(deduplicaImpegni(impegni))
  }, [impegni, statoAttivo])

  const impegniFiltrati = useMemo(() => {
    return deduplicaImpegni(impegniLocali).filter(
      (impegno) => impegno.stato === statoAttivo
    )
  }, [impegniLocali, statoAttivo])

  function handleAggiornaStato(
    id: string,
    nuovoStato: 'programmato' | 'completato' | 'annullato'
  ) {
    setImpegniLocali((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stato: nuovoStato } : item
      )
    )
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-32">
      <div className="mb-5 flex justify-center gap-2">
        {filtri.map((f) => (
          <button
            key={f.valore}
            onClick={() => {
              const param = paramDaStato[f.valore]
              router.push(param ? `/impegni?stato=${param}` : '/impegni')
            }}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold transition-colors',
              statoAttivo === f.valore
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 bg-white text-gray-500'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {impegniFiltrati.length === 0 ? (
        <EmptyState statoAttivo={statoAttivo} />
      ) : (
        <div className="space-y-4">
          {impegniFiltrati.map((impegno) => (
            <CardImpegno
              key={impegno.id}
              impegno={impegno}
              onAggiornaStato={handleAggiornaStato}
            />
          ))}
        </div>
      )}
    </div>
  )
}