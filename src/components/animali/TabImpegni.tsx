'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatData, isScaduta, isImminente } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import { CalendarClock, ChevronRight, Plus } from 'lucide-react'
import type { Impegno } from '@/lib/types/query.types'

type FiltroStato = 'programmato' | 'completato' | 'annullato'

const filtri: { label: string; valore: FiltroStato }[] = [
  { label: 'Programmati', valore: 'programmato' },
  { label: 'Completati', valore: 'completato' },
  { label: 'Annullati', valore: 'annullato' },
]

const iconaTipo: Record<string, string> = {
  visita: '🩺',
  controllo: '🔍',
  vaccinazione: '💉',
  toelettatura: '✂️',
  addestramento: '🎓',
  compleanno: '🎂',
  altro: '📌',
}

function getPreviewNote(impegno: Impegno) {
  const noteOriginali = impegno.note?.trim()

  if (!noteOriginali) return null

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

function resetAppScrollToTop() {
  if (typeof window === 'undefined') return

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  const appRoot = document.getElementById('app-scroll-root')
  appRoot?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}

export function TabImpegni({
  animaleId,
  impegni,
}: {
  animaleId: string
  impegni: Impegno[]
}) {
  const [filtro, setFiltro] = useState<FiltroStato>('programmato')

  useEffect(() => {
    const reset = () => resetAppScrollToTop()
    reset()
    const frame = window.requestAnimationFrame(reset)

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const impegniFiltrati = impegni.filter(
    (i) => i.stato === filtro && i.tipo !== 'terapia'
  )

  return (
    <div className="space-y-4 px-4 py-4 pb-32">
      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <Link
          href={`/impegni/nuovo?animale_id=${animaleId}`}
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
                setFiltro(f.valore)
                resetAppScrollToTop()
              }}
              className={cn(
                'rounded-2xl px-3 py-3 text-sm font-bold transition-all',
                filtro === f.valore
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
        <div className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          {filtro === 'programmato' ? (
            <div className="rounded-[24px] border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-5 py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <CalendarClock size={26} strokeWidth={2.2} />
              </div>

              <h3 className="mt-4 text-lg font-extrabold tracking-tight text-gray-900">
                Qui vedrai promemoria e scadenze
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Visite, vaccini, controlli o qualsiasi impegno importante da non
                dimenticare.
              </p>

              <Link
                href={`/impegni/nuovo?animale_id=${animaleId}`}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 text-sm font-bold text-amber-700 transition-all active:scale-[0.98]"
              >
                <Plus size={16} strokeWidth={2.4} />
                Crea il primo impegno
              </Link>
            </div>
          ) : filtro === 'completato' ? (
            <div className="rounded-2xl border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-4 py-8 text-center">
              <p className="text-sm font-medium text-gray-400">
                Nessun impegno completato.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-4 py-8 text-center">
              <p className="text-sm font-medium text-gray-400">
                Nessun impegno annullato.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {impegniFiltrati.map((i) => {
            const scaduto = filtro === 'programmato' && isScaduta(i.data)
            const imminente = filtro === 'programmato' && isImminente(i.data)
            const previewNota = getPreviewNote(i)
            const orarioLabel = getOrarioImpegno(i)

            return (
              <Link
                key={i.id}
                href={`/impegni/${i.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-[28px] border p-4 shadow-sm transition-all active:scale-[0.98]',
                  scaduto
                    ? 'border-red-200 bg-red-50'
                    : imminente
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-[#EADFD3] bg-white'
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg',
                    scaduto
                      ? 'bg-red-100'
                      : imminente
                        ? 'bg-amber-100'
                        : 'bg-[#FCF8F3]'
                  )}
                >
                  {iconaTipo[i.tipo] ?? '📌'}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold text-gray-900">
                    {i.titolo}
                  </p>

                  {previewNota && (
                    <p className="mt-1 truncate text-[11px] leading-5 text-gray-500">
                      {previewNota}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      'text-sm font-bold',
                      scaduto
                        ? 'text-red-500'
                        : imminente
                          ? 'text-amber-600'
                          : 'text-gray-400'
                    )}
                  >
                    {formatData(i.data)}
                  </span>

                  {orarioLabel && (
                    <span
                      className={cn(
                        'text-xs font-medium',
                        scaduto
                          ? 'text-red-500/80'
                          : imminente
                            ? 'text-amber-700'
                            : 'text-gray-500'
                      )}
                    >
                      {orarioLabel}
                    </span>
                  )}

                  {scaduto && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      Scaduto
                    </span>
                  )}

                  {!scaduto && imminente && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      Urgente
                    </span>
                  )}
                </div>

                <ChevronRight
                  size={18}
                  strokeWidth={2.4}
                  className="shrink-0 text-gray-300"
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}