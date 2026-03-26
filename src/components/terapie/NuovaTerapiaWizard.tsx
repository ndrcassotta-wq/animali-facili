'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  PawPrint,
  Stethoscope,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type AnimaleOption = {
  id: string
  nome: string
}

type Step = 'animale' | 'farmaco' | 'frequenza' | 'date' | 'note'

const FREQUENZE = [
  { value: 'una_volta_giorno', label: '1× al giorno' },
  { value: 'due_volte_giorno', label: '2× al giorno' },
  { value: 'tre_volte_giorno', label: '3× al giorno' },
  { value: 'al_bisogno', label: 'Al bisogno' },
  { value: 'personalizzata', label: 'Personalizzata' },
] as const

const STEP_LABELS: Record<Step, string> = {
  animale: 'Animale',
  farmaco: 'Farmaco',
  frequenza: 'Frequenza',
  date: 'Date',
  note: 'Conferma',
}

function getStepInfo(step: Step, isEditMode: boolean) {
  if (step === 'animale') {
    return {
      icon: <PawPrint size={22} strokeWidth={2.2} />,
      title: "Scegli l'animale",
      description: 'Per quale animale vuoi creare la terapia?',
    }
  }

  if (step === 'farmaco') {
    return {
      icon: <Stethoscope size={22} strokeWidth={2.2} />,
      title: 'Farmaco e dose',
      description: 'Inserisci i dati principali della terapia.',
    }
  }

  if (step === 'frequenza') {
    return {
      icon: <CalendarDays size={22} strokeWidth={2.2} />,
      title: 'Frequenza',
      description: 'Ogni quanto va somministrata?',
    }
  }

  if (step === 'date') {
    return {
      icon: <Clock3 size={22} strokeWidth={2.2} />,
      title: 'Date e orario',
      description:
        'Inserisci almeno la data di inizio e, se prevista, l’orario della somministrazione.',
    }
  }

  return {
    icon: <FileText size={22} strokeWidth={2.2} />,
    title: isEditMode ? 'Conferma modifiche' : 'Ultimo step',
    description: isEditMode
      ? 'Controlla i dati e salva.'
      : 'Aggiungi note opzionali e conferma.',
  }
}

function ProgressBar({ step, steps }: { step: Step; steps: Step[] }) {
  const idx = steps.indexOf(step)
  const percent = (idx / (steps.length - 1)) * 100

  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFE4D8]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
          style={{ width: `${percent === 0 ? 10 : percent}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between gap-2">
        {steps.map((s, i) => (
          <span
            key={s}
            className={cn(
              'text-[10px] font-semibold transition-colors',
              i <= idx ? 'text-amber-500' : 'text-gray-300'
            )}
          >
            {STEP_LABELS[s]}
          </span>
        ))}
      </div>
    </div>
  )
}

function Campo({
  label,
  required,
  children,
  helper,
  error,
}: {
  label: string
  required?: boolean
  children: ReactNode
  helper?: string
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
      {helper ? <p className="text-xs text-gray-400">{helper}</p> : null}
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  )
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      {children}
    </div>
  )
}

function SummaryItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold leading-5 text-gray-800">{value}</p>
    </div>
  )
}

export function NuovaTerapiaWizard({
  title,
  subtitle,
  backHref,
  onSubmit,
  animali,
  preselectedAnimalId,
  valoriIniziali,
}: {
  title: string
  subtitle: string
  backHref: string
  onSubmit: (formData: FormData) => void | Promise<void>
  animali: AnimaleOption[]
  preselectedAnimalId?: string
  valoriIniziali?: {
    nomeFarmaco?: string
    dose?: string
    frequenza?: string
    frequenzaCustom?: string
    dataInizio?: string
    dataFine?: string
    oraSomministrazione?: string
    note?: string
  }
}) {
  const isEditMode = Boolean(valoriIniziali)
  const hasAnimalStep = !preselectedAnimalId

  const steps = useMemo<Step[]>(
    () =>
      hasAnimalStep
        ? ['animale', 'farmaco', 'frequenza', 'date', 'note']
        : ['farmaco', 'frequenza', 'date', 'note'],
    [hasAnimalStep]
  )

  const [step, setStep] = useState<Step>(hasAnimalStep ? 'animale' : 'farmaco')
  const [animaleId, setAnimaleId] = useState(preselectedAnimalId ?? '')
  const [nomeFarmaco, setNomeFarmaco] = useState(valoriIniziali?.nomeFarmaco ?? '')
  const [dose, setDose] = useState(valoriIniziali?.dose ?? '')
  const [frequenza, setFrequenza] = useState<string>(
    valoriIniziali?.frequenza ?? 'una_volta_giorno'
  )
  const [frequenzaCustom, setFrequenzaCustom] = useState(
    valoriIniziali?.frequenzaCustom ?? ''
  )
  const [dataInizio, setDataInizio] = useState(() => {
    if (valoriIniziali?.dataInizio) return valoriIniziali.dataInizio
    const oggi = new Date()
    const year = oggi.getFullYear()
    const month = String(oggi.getMonth() + 1).padStart(2, '0')
    const day = String(oggi.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [dataFine, setDataFine] = useState(valoriIniziali?.dataFine ?? '')
  const [oraSomministrazione, setOraSomministrazione] = useState(
    valoriIniziali?.oraSomministrazione ?? ''
  )
  const [note, setNote] = useState(valoriIniziali?.note ?? '')
  const [errori, setErrori] = useState<Partial<Record<Step, string>>>({})

  const animaleSelezionato = animali.find((a) => a.id === animaleId) ?? null
  const indice = steps.indexOf(step)
  const stepInfo = getStepInfo(step, isEditMode)

  function vaiAvanti() {
    const erroriNuovi: Partial<Record<Step, string>> = {}

    if (step === 'animale' && !animaleId) {
      erroriNuovi.animale = 'Seleziona un animale'
    }

    if (step === 'farmaco' && (!nomeFarmaco.trim() || !dose.trim())) {
      erroriNuovi.farmaco = 'Compila nome farmaco e dose'
    }

    if (step === 'frequenza') {
      if (!frequenza) {
        erroriNuovi.frequenza = 'Seleziona una frequenza'
      } else if (frequenza === 'personalizzata' && !frequenzaCustom.trim()) {
        erroriNuovi.frequenza = 'Inserisci la frequenza personalizzata'
      }
    }

    if (step === 'date') {
      if (!dataInizio) {
        erroriNuovi.date = 'La data di inizio è obbligatoria'
      } else if (frequenza !== 'al_bisogno' && !oraSomministrazione) {
        erroriNuovi.date = 'Indica anche l’orario della somministrazione'
      }
    }

    if (Object.keys(erroriNuovi).length > 0) {
      setErrori((prev) => ({ ...prev, ...erroriNuovi }))
      return
    }

    const prossimo = steps[indice + 1]
    if (prossimo) {
      setStep(prossimo)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function vaiIndietroStep() {
    const precedente = steps[indice - 1]
    if (precedente) {
      setStep(precedente)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="flex flex-col bg-[#F7F1EA]" style={{ minHeight: '100dvh' }}>
      <header className="shrink-0 rounded-b-[34px] bg-gradient-to-b from-[#FFF4E8] to-[#F7F1EA] px-5 pb-5 pt-10">
        <div className="mb-4 flex items-center justify-between">
          {indice === 0 ? (
            <Link
              href={backHref}
              className="flex items-center gap-2 text-gray-500 active:opacity-70"
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
              <span className="text-sm font-semibold">Annulla</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={vaiIndietroStep}
              className="flex items-center gap-2 text-gray-500 active:opacity-70"
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
              <span className="text-sm font-semibold">Indietro</span>
            </button>
          )}

          <span className="rounded-full border border-[#EEE4D9] bg-white/80 px-3 py-1 text-xs font-semibold text-gray-500">
            Step {indice + 1} di {steps.length}
          </span>
        </div>

        <div className="rounded-[28px] border border-[#F1E4D7] bg-white/90 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              {stepInfo.icon}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
                {title}
              </p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
                {stepInfo.title}
              </h1>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                {subtitle}
              </p>
            </div>
          </div>

          <ProgressBar step={step} steps={steps} />
        </div>
      </header>

      <form action={onSubmit} className="flex-1 px-5 pb-12 pt-4">
        <input type="hidden" name="animale_id" value={animaleId} />
        <input type="hidden" name="nome_farmaco" value={nomeFarmaco} />
        <input type="hidden" name="dose" value={dose} />
        <input type="hidden" name="frequenza" value={frequenza} />
        <input type="hidden" name="frequenza_custom" value={frequenzaCustom} />
        <input type="hidden" name="data_inizio" value={dataInizio} />
        <input type="hidden" name="data_fine" value={dataFine} />
        <input
          type="hidden"
          name="ora_somministrazione"
          value={oraSomministrazione}
        />
        <input type="hidden" name="note" value={note} />

        <div className="mb-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {stepInfo.title}
          </h2>
          <p className="mt-1 text-sm leading-5 text-gray-400">
            {stepInfo.description}
          </p>
        </div>

        {step === 'animale' && (
          <>
            <SectionCard>
              <Campo label="Animale" required error={errori.animale}>
                <select
                  value={animaleId}
                  onChange={(e) => {
                    setAnimaleId(e.target.value)
                    setErrori((prev) => ({ ...prev, animale: undefined }))
                  }}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none"
                >
                  <option value="">Seleziona un animale</option>
                  {animali.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </Campo>
            </SectionCard>

            <button
              type="button"
              onClick={vaiAvanti}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Continua <ChevronRight size={18} />
            </button>
          </>
        )}

        {step === 'farmaco' && (
          <>
            <SectionCard>
              <div className="space-y-4">
                <Campo label="Nome farmaco" required error={errori.farmaco}>
                  <input
                    value={nomeFarmaco}
                    onChange={(e) => {
                      setNomeFarmaco(e.target.value)
                      setErrori((prev) => ({ ...prev, farmaco: undefined }))
                    }}
                    placeholder="Es. Antibiotico X"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none placeholder:text-gray-400"
                  />
                </Campo>

                <Campo label="Dose" required>
                  <input
                    value={dose}
                    onChange={(e) => {
                      setDose(e.target.value)
                      setErrori((prev) => ({ ...prev, farmaco: undefined }))
                    }}
                    placeholder="Es. 1 compressa"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none placeholder:text-gray-400"
                  />
                </Campo>
              </div>
            </SectionCard>

            <button
              type="button"
              onClick={vaiAvanti}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Continua <ChevronRight size={18} />
            </button>
          </>
        )}

        {step === 'frequenza' && (
          <>
            <SectionCard>
              <div className="space-y-4">
                <Campo label="Frequenza" required error={errori.frequenza}>
                  <select
                    value={frequenza}
                    onChange={(e) => {
                      setFrequenza(e.target.value)
                      setErrori((prev) => ({ ...prev, frequenza: undefined }))
                    }}
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none"
                  >
                    {FREQUENZE.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Campo>

                {frequenza === 'personalizzata' && (
                  <Campo
                    label="Frequenza personalizzata"
                    required
                    helper="Es. ogni 8 ore"
                    error={errori.frequenza}
                  >
                    <input
                      value={frequenzaCustom}
                      onChange={(e) => {
                        setFrequenzaCustom(e.target.value)
                        setErrori((prev) => ({ ...prev, frequenza: undefined }))
                      }}
                      placeholder="Es. ogni 8 ore"
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none placeholder:text-gray-400"
                    />
                  </Campo>
                )}
              </div>
            </SectionCard>

            <button
              type="button"
              onClick={vaiAvanti}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Continua <ChevronRight size={18} />
            </button>
          </>
        )}

        {step === 'date' && (
          <>
            <SectionCard>
              <div className="space-y-4">
                <Campo label="Data inizio" required error={errori.date}>
                  <input
                    type="date"
                    value={dataInizio}
                    onChange={(e) => {
                      setDataInizio(e.target.value)
                      setErrori((prev) => ({ ...prev, date: undefined }))
                    }}
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none"
                  />
                </Campo>

                <Campo label="Data fine">
                  <input
                    type="date"
                    value={dataFine}
                    onChange={(e) => setDataFine(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none"
                  />
                </Campo>

                <Campo
                  label="Orario somministrazione"
                  required={frequenza !== 'al_bisogno'}
                  helper={
                    frequenza === 'al_bisogno'
                      ? 'Per le terapie al bisogno puoi lasciarlo vuoto'
                      : 'Es. 09:00'
                  }
                >
                  <input
                    type="time"
                    value={oraSomministrazione}
                    onChange={(e) => {
                      setOraSomministrazione(e.target.value)
                      setErrori((prev) => ({ ...prev, date: undefined }))
                    }}
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none"
                  />
                </Campo>
              </div>
            </SectionCard>

            <button
              type="button"
              onClick={vaiAvanti}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Continua <ChevronRight size={18} />
            </button>
          </>
        )}

        {step === 'note' && (
          <>
            <div className="space-y-4">
              <SectionCard>
                <Campo label="Note">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Indicazioni, osservazioni, dettagli utili..."
                    className="w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 py-3 text-base outline-none placeholder:text-gray-400"
                  />
                </Campo>
              </SectionCard>

              <SectionCard>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <FileText size={18} strokeWidth={2.2} />
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Riepilogo
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {animaleSelezionato ? (
                    <SummaryItem label="Animale" value={animaleSelezionato.nome} />
                  ) : null}

                  <SummaryItem label="Farmaco" value={nomeFarmaco || '—'} />
                  <SummaryItem label="Dose" value={dose || '—'} />
                  <SummaryItem
                    label="Frequenza"
                    value={
                      FREQUENZE.find((f) => f.value === frequenza)?.label ??
                      frequenza
                    }
                  />

                  {frequenza === 'personalizzata' && frequenzaCustom.trim() ? (
                    <SummaryItem
                      label="Dettaglio frequenza"
                      value={frequenzaCustom}
                    />
                  ) : null}

                  <SummaryItem label="Data inizio" value={dataInizio || '—'} />
                  <SummaryItem
                    label="Data fine"
                    value={dataFine || 'Non indicata'}
                  />
                  <SummaryItem
                    label="Orario"
                    value={oraSomministrazione || 'Non indicato'}
                  />
                </div>
              </SectionCard>
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              {isEditMode ? 'Salva modifiche' : 'Salva terapia'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}