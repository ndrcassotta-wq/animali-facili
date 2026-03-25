'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FileText,
  PawPrint,
  Stethoscope,
} from 'lucide-react'

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

function ProgressBar({
  step,
  steps,
}: {
  step: Step
  steps: Step[]
}) {
  const idx = steps.indexOf(step)
  const percent = (idx / (steps.length - 1)) * 100

  return (
    <div className="px-5 pt-4 pb-2">
      <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
          style={{ width: `${percent === 0 ? 8 : percent}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`text-[10px] font-semibold transition-colors ${
              i <= idx ? 'text-amber-500' : 'text-gray-300'
            }`}
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
  children: React.ReactNode
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
      {helper && <p className="text-xs text-gray-400">{helper}</p>}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
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
}: {
  title: string
  subtitle: string
  backHref: string
  onSubmit: (formData: FormData) => void | Promise<void>
  animali: AnimaleOption[]
  preselectedAnimalId?: string
}) {
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
  const [nomeFarmaco, setNomeFarmaco] = useState('')
  const [dose, setDose] = useState('')
  const [frequenza, setFrequenza] = useState('una_volta_giorno')
  const [frequenzaCustom, setFrequenzaCustom] = useState('')
  const [dataInizio, setDataInizio] = useState(() => {
    const oggi = new Date()
    const year = oggi.getFullYear()
    const month = String(oggi.getMonth() + 1).padStart(2, '0')
    const day = String(oggi.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [dataFine, setDataFine] = useState('')
  const [note, setNote] = useState('')
  const [errori, setErrori] = useState<Partial<Record<Step, string>>>({})

  const animaleSelezionato = animali.find((a) => a.id === animaleId) ?? null
  const indice = steps.indexOf(step)

  function vaiAvanti() {
    const erroriNuovi: Partial<Record<Step, string>> = {}

    if (step === 'animale' && !animaleId) {
      erroriNuovi.animale = 'Seleziona un animale'
    }

    if (step === 'farmaco') {
      if (!nomeFarmaco.trim() || !dose.trim()) {
        erroriNuovi.farmaco = 'Compila nome farmaco e dose'
      }
    }

    if (step === 'frequenza') {
      if (!frequenza) {
        erroriNuovi.frequenza = 'Seleziona una frequenza'
      } else if (
        frequenza === 'personalizzata' &&
        !frequenzaCustom.trim()
      ) {
        erroriNuovi.frequenza = 'Inserisci la frequenza personalizzata'
      }
    }

    if (step === 'date' && !dataInizio) {
      erroriNuovi.date = 'La data di inizio è obbligatoria'
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
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>
      <header className="shrink-0 px-5 pt-10 pb-0">
        <div className="mb-3 flex items-center justify-between">
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

          {step === 'note' && (
            <span className="text-sm font-semibold text-amber-500">
              Ultimo step
            </span>
          )}
        </div>

        <ProgressBar step={step} steps={steps} />
      </header>

      <form action={onSubmit} className="flex-1 px-5 pb-12">
        <input type="hidden" name="animale_id" value={animaleId} />
        <input type="hidden" name="nome_farmaco" value={nomeFarmaco} />
        <input type="hidden" name="dose" value={dose} />
        <input type="hidden" name="frequenza" value={frequenza} />
        <input type="hidden" name="frequenza_custom" value={frequenzaCustom} />
        <input type="hidden" name="data_inizio" value={dataInizio} />
        <input type="hidden" name="data_fine" value={dataFine} />
        <input type="hidden" name="note" value={note} />

        {step === 'animale' && (
          <div className="pt-4">
            <div className="mb-6">
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <PawPrint size={22} strokeWidth={2.2} />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Scegli l’animale
                </h1>
              </div>
              <p className="text-sm text-gray-400">
                Per quale animale vuoi creare la terapia?
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
              <Campo
                label="Animale"
                required
                error={errori.animale}
              >
                <select
                  value={animaleId}
                  onChange={(e) => {
                    setAnimaleId(e.target.value)
                    setErrori((prev) => ({ ...prev, animale: undefined }))
                  }}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none"
                >
                  <option value="">Seleziona un animale</option>
                  {animali.map((animale) => (
                    <option key={animale.id} value={animale.id}>
                      {animale.nome}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <button
              type="button"
              onClick={vaiAvanti}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Continua
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 'farmaco' && (
          <div className="pt-4">
            <div className="mb-6">
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Stethoscope size={22} strokeWidth={2.2} />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Farmaco e dose
                </h1>
              </div>
              <p className="text-sm text-gray-400">
                Inserisci i dati principali della terapia
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm space-y-4">
              <Campo
                label="Nome farmaco"
                required
                error={errori.farmaco}
              >
                <input
                  value={nomeFarmaco}
                  onChange={(e) => {
                    setNomeFarmaco(e.target.value)
                    setErrori((prev) => ({ ...prev, farmaco: undefined }))
                  }}
                  placeholder="Es. Antibiotico X"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none placeholder:text-gray-400"
                />
              </Campo>

              <Campo
                label="Dose"
                required
              >
                <input
                  value={dose}
                  onChange={(e) => {
                    setDose(e.target.value)
                    setErrori((prev) => ({ ...prev, farmaco: undefined }))
                  }}
                  placeholder="Es. 1 compressa"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none placeholder:text-gray-400"
                />
              </Campo>
            </div>

            <button
              type="button"
              onClick={vaiAvanti}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Continua
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 'frequenza' && (
          <div className="pt-4">
            <div className="mb-6">
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <CalendarDays size={22} strokeWidth={2.2} />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Frequenza
                </h1>
              </div>
              <p className="text-sm text-gray-400">
                Ogni quanto va somministrata?
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm space-y-4">
              <Campo
                label="Frequenza"
                required
                error={errori.frequenza}
              >
                <select
                  value={frequenza}
                  onChange={(e) => {
                    setFrequenza(e.target.value)
                    setErrori((prev) => ({ ...prev, frequenza: undefined }))
                  }}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none"
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
                >
                  <input
                    value={frequenzaCustom}
                    onChange={(e) => {
                      setFrequenzaCustom(e.target.value)
                      setErrori((prev) => ({ ...prev, frequenza: undefined }))
                    }}
                    placeholder="Es. ogni 8 ore"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none placeholder:text-gray-400"
                  />
                </Campo>
              )}
            </div>

            <button
              type="button"
              onClick={vaiAvanti}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Continua
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 'date' && (
          <div className="pt-4">
            <div className="mb-6">
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <CalendarDays size={22} strokeWidth={2.2} />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Date terapia
                </h1>
              </div>
              <p className="text-sm text-gray-400">
                Inserisci almeno la data di inizio
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm space-y-4">
              <Campo
                label="Data inizio"
                required
                error={errori.date}
              >
                <input
                  type="date"
                  value={dataInizio}
                  onChange={(e) => {
                    setDataInizio(e.target.value)
                    setErrori((prev) => ({ ...prev, date: undefined }))
                  }}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none"
                />
              </Campo>

              <Campo label="Data fine">
                <input
                  type="date"
                  value={dataFine}
                  onChange={(e) => setDataFine(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none"
                />
              </Campo>
            </div>

            <button
              type="button"
              onClick={vaiAvanti}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Continua
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 'note' && (
          <div className="pt-4">
            <div className="mb-6">
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <FileText size={22} strokeWidth={2.2} />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Ultimo step
                </h1>
              </div>
              <p className="text-sm text-gray-400">
                Aggiungi note opzionali e conferma
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
                <Campo label="Note">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Indicazioni, orari, osservazioni..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none placeholder:text-gray-400"
                  />
                </Campo>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-amber-50 px-5 py-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold text-amber-900">
                  Riepilogo
                </h2>

                <div className="space-y-2 text-sm text-amber-900">
                  {animaleSelezionato && (
                    <p>
                      <span className="font-semibold">Animale:</span>{' '}
                      {animaleSelezionato.nome}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold">Farmaco:</span>{' '}
                    {nomeFarmaco || '—'}
                  </p>
                  <p>
                    <span className="font-semibold">Dose:</span>{' '}
                    {dose || '—'}
                  </p>
                  <p>
                    <span className="font-semibold">Frequenza:</span>{' '}
                    {FREQUENZE.find((f) => f.value === frequenza)?.label ?? frequenza}
                  </p>
                  {frequenza === 'personalizzata' && frequenzaCustom.trim() && (
                    <p>
                      <span className="font-semibold">Dettaglio frequenza:</span>{' '}
                      {frequenzaCustom}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold">Data inizio:</span>{' '}
                    {dataInizio || '—'}
                  </p>
                  <p>
                    <span className="font-semibold">Data fine:</span>{' '}
                    {dataFine || 'Non indicata'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Salva terapia
            </button>
          </div>
        )}
      </form>
    </div>
  )
}