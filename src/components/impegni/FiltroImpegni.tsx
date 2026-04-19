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
  Plus,
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

type AppointmentFrequency =
  | 'nessuna'
  | 'settimanale'
  | 'mensile'
  | 'trimestrale'
  | 'semestrale'
  | 'annuale'

type ImpegnoConOwnership = ImpegnoConAnimale & {
  animale_id?: string | null
  frequenza?: string | null
  note?: string | null
  ora?: string | null
  created_by_user_id?: string | null
  created_by_partner_profile_id?: string | null
  created_source?: string | null
}

function isValidAppointmentFrequency(
  value: string | null | undefined
): value is AppointmentFrequency {
  return (
    value === 'nessuna' ||
    value === 'settimanale' ||
    value === 'mensile' ||
    value === 'trimestrale' ||
    value === 'semestrale' ||
    value === 'annuale'
  )
}

function isRecurringAppointmentFrequency(
  value: AppointmentFrequency
): value is Exclude<AppointmentFrequency, 'nessuna'> {
  return value !== 'nessuna'
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

function formatLocalDate(year: number, month: number, day: number) {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function getLastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function addDaysToDateString(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0)

  date.setDate(date.getDate() + days)

  return formatLocalDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
}

function addMonthsClamped(value: string, monthsToAdd: number) {
  const { year, month, day } = parseLocalDate(value)

  const zeroBasedTargetMonth = month - 1 + monthsToAdd
  const targetYear = year + Math.floor(zeroBasedTargetMonth / 12)
  const targetMonth = ((zeroBasedTargetMonth % 12) + 12) % 12 + 1
  const lastDay = getLastDayOfMonth(targetYear, targetMonth)
  const targetDay = Math.min(day, lastDay)

  return formatLocalDate(targetYear, targetMonth, targetDay)
}

function addYearsClamped(value: string, yearsToAdd: number) {
  const { year, month, day } = parseLocalDate(value)

  const targetYear = year + yearsToAdd
  const lastDay = getLastDayOfMonth(targetYear, month)
  const targetDay = Math.min(day, lastDay)

  return formatLocalDate(targetYear, month, targetDay)
}

function getNextAppointmentDate(
  currentDate: string,
  frequency: AppointmentFrequency
): string | null {
  switch (frequency) {
    case 'nessuna':
      return null
    case 'settimanale':
      return addDaysToDateString(currentDate, 7)
    case 'mensile':
      return addMonthsClamped(currentDate, 1)
    case 'trimestrale':
      return addMonthsClamped(currentDate, 3)
    case 'semestrale':
      return addMonthsClamped(currentDate, 6)
    case 'annuale':
      return addYearsClamped(currentDate, 1)
    default:
      return null
  }
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

function getOrarioImpegno(impegno: ImpegnoConAnimale) {
  const candidato = impegno as ImpegnoConAnimale & {
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

function deduplicaImpegni(impegni: ImpegnoConAnimale[]) {
  const visti = new Set<string>()

  return impegni.filter((impegno) => {
    if (visti.has(impegno.id)) return false
    visti.add(impegno.id)
    return true
  })
}

function EmptyState({ statoAttivo }: { statoAttivo: string }) {
  const emptyLabel =
    statoAttivo === 'programmato'
      ? 'Nessun impegno programmato.'
      : statoAttivo === 'completato'
        ? 'Nessun impegno completato.'
        : 'Nessun impegno annullato.'

  return (
    <div className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="rounded-2xl border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-4 py-8 text-center">
        <p className="text-sm font-medium text-gray-400">{emptyLabel}</p>
      </div>
    </div>
  )
}

function CardImpegno({
  impegno,
  onAggiornaStato,
}: {
  impegno: ImpegnoConAnimale
  onAggiornaStato: (
    id: string,
    stato: 'programmato' | 'completato' | 'annullato'
  ) => void
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
  const orarioLabel = getOrarioImpegno(impegno)

  const hrefDettaglio = autoTerapiaId
    ? `/terapie/${autoTerapiaId}`
    : `/impegni/${impegno.id}`

  async function segnaCompletato() {
    const supabase = createClient()
    const impegnoEsteso = impegno as ImpegnoConOwnership
    const frequenza = isValidAppointmentFrequency(impegnoEsteso.frequenza)
      ? impegnoEsteso.frequenza
      : 'nessuna'

    onAggiornaStato(impegno.id, 'completato')

    startTransition(async () => {
      const { data: completedRows, error: updateError } = await supabase
        .from('impegni')
        .update({ stato: 'completato' })
        .eq('id', impegno.id)
        .neq('stato', 'completato')
        .neq('stato', 'annullato')
        .select('id')

      if (updateError) {
        console.error(
          '[FiltroImpegni] Errore completamento impegno:',
          updateError
        )
        router.refresh()
        return
      }

      const didCompleteNow =
        Array.isArray(completedRows) && completedRows.length > 0

      if (
        didCompleteNow &&
        isRecurringAppointmentFrequency(frequenza) &&
        impegnoEsteso.animale_id
      ) {
        const nextDate = getNextAppointmentDate(impegno.data, frequenza)

        if (nextDate) {
          let duplicateQuery = supabase
            .from('impegni')
            .select('id')
            .eq('animale_id', impegnoEsteso.animale_id)
            .eq('titolo', impegno.titolo)
            .eq('tipo', impegno.tipo)
            .eq('frequenza', frequenza)
            .eq('data', nextDate)

          if (impegnoEsteso.ora == null) {
            duplicateQuery = duplicateQuery.is('ora', null)
          } else {
            duplicateQuery = duplicateQuery.eq('ora', impegnoEsteso.ora)
          }

          if (impegnoEsteso.created_by_partner_profile_id == null) {
            duplicateQuery = duplicateQuery.is(
              'created_by_partner_profile_id',
              null
            )
          } else {
            duplicateQuery = duplicateQuery.eq(
              'created_by_partner_profile_id',
              impegnoEsteso.created_by_partner_profile_id
            )
          }

          if (impegnoEsteso.created_by_user_id == null) {
            duplicateQuery = duplicateQuery.is('created_by_user_id', null)
          } else {
            duplicateQuery = duplicateQuery.eq(
              'created_by_user_id',
              impegnoEsteso.created_by_user_id
            )
          }

          if (impegnoEsteso.created_source == null) {
            duplicateQuery = duplicateQuery.is('created_source', null)
          } else {
            duplicateQuery = duplicateQuery.eq(
              'created_source',
              impegnoEsteso.created_source
            )
          }

          const { data: duplicateExisting, error: duplicateError } =
            await duplicateQuery.limit(1)

          if (duplicateError) {
            console.error(
              '[FiltroImpegni] Errore verifica duplicato ricorrenza:',
              duplicateError
            )
            router.refresh()
            return
          }

          const hasDuplicate =
            Array.isArray(duplicateExisting) && duplicateExisting.length > 0

          if (!hasDuplicate) {
            const { error: insertError } = await supabase.from('impegni').insert({
              animale_id: impegnoEsteso.animale_id,
              titolo: impegno.titolo,
              tipo: impegno.tipo,
              stato: 'programmato',
              data: nextDate,
              ora: impegnoEsteso.ora ?? null,
              frequenza,
              note: impegnoEsteso.note ?? null,
              created_by_user_id: impegnoEsteso.created_by_user_id ?? null,
              created_by_partner_profile_id:
                impegnoEsteso.created_by_partner_profile_id ?? null,
              created_source: impegnoEsteso.created_source ?? null,
            })

            if (insertError) {
              console.error(
                '[FiltroImpegni] Errore creazione ricorrenza successiva:',
                insertError
              )
              router.refresh()
              return
            }
          }
        }
      }

      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'rounded-[28px] border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all',
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
                    'truncate text-base font-extrabold',
                    isAnnullato
                      ? 'text-gray-500 line-through'
                      : isCompletato
                        ? 'text-emerald-900'
                        : 'text-gray-900'
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
                  'mt-1 text-sm',
                  isAnnullato
                    ? 'text-gray-500'
                    : isCompletato
                      ? 'text-emerald-700/80'
                      : 'text-gray-500'
                )}
              >
                {impegno.animali?.nome ?? '—'}
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
                <p className="mt-1 truncate text-[11px] leading-5 text-gray-500">
                  {previewNota}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              'text-sm font-bold',
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

          {orarioLabel && (
            <span
              className={cn(
                'text-xs font-medium',
                isAnnullato
                  ? 'text-gray-500'
                  : isCompletato
                    ? 'text-emerald-700/80'
                    : scaduto
                      ? 'text-red-500/80'
                      : imminente
                        ? 'text-amber-700'
                        : isTerapia
                          ? 'text-teal-700/80'
                          : 'text-gray-500'
              )}
            >
              {orarioLabel}
            </span>
          )}

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
          size={18}
          strokeWidth={2.4}
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
    <div className="flex flex-1 flex-col space-y-4 px-4 py-4 pb-32">
      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <Link
          href="/impegni/nuovo"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 py-4 text-sm font-bold text-amber-600 transition-transform active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Aggiungi impegno
        </Link>
      </div>

      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="grid grid-cols-3 gap-2">
          {filtri.map((f) => (
            <button
              key={f.valore}
              type="button"
              onClick={() => {
                const param = paramDaStato[f.valore]
                router.push(param ? `/impegni?stato=${param}` : '/impegni')
              }}
              className={cn(
                'rounded-2xl px-3 py-3 text-sm font-bold transition-all',
                statoAttivo === f.valore
                  ? 'bg-[#FCF8F3] text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-500'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {impegniFiltrati.length === 0 ? (
        <EmptyState statoAttivo={statoAttivo} />
      ) : (
        <div className="space-y-3">
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