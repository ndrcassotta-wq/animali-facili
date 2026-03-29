'use client'

import type { ReactNode, HTMLAttributes } from 'react'
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
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'

type AnimaleOption = {
  id: string
  nome: string
  specie?: string | null
  razza?: string | null
  foto_url?: string | null
  categoria?: string | null
}

type Step = 'animale' | 'farmaco' | 'frequenza' | 'date' | 'note'
type WizardVariant = 'standard' | 'generale'
type FormatoSomministrazione =
  | 'compressa'
  | 'pasticca'
  | 'puntura'
  | 'gocce'
  | 'collirio'
  | 'sciroppo'
  | 'crema'
  | 'spray'

const FREQUENZE = [
  { value: 'una_volta_giorno', label: '1× al giorno' },
  { value: 'due_volte_giorno', label: '2× al giorno' },
  { value: 'tre_volte_giorno', label: '3× al giorno' },
  { value: 'al_bisogno', label: 'Al bisogno' },
  { value: 'personalizzata', label: 'Personalizzata' },
] as const

const FARMACI_SUGGERITI_REALISTICI = [
  'Synulox',
  'Baytril',
  'Marbocyl',
  'Stomorgyl',
  'Clavaseptin',
  'Metacam',
  'Onsior',
  'Cimalgex',
  'Rimadyl',
  'Trocoxil',
  'Apoquel',
  'Cytopoint',
  'Atopivet',
  'Stronghold',
  'Frontline Combo',
  'Frontline Tri-Act',
  'Advocate',
  'Advantix',
  'Bravecto',
  'NexGard',
  'NexGard Spectra',
  'Simparica',
  'Simparica Trio',
  'Milbemax',
  'Drontal',
  'Cardotek',
  'Interceptor',
  'Fortekor',
  'Semintra',
  'Cardalis',
  'Prilium',
  'Vetmedin',
  'Libeo',
  'Cerenia',
  'Propalin',
  'Epato 1500 Plus',
  'Florentero',
  'Prolife',
  'Enterofilus',
  'Diarsanyl',
  'Condrogen',
  'Hyaloral',
  'Redonyl',
  'Otoact',
  'Otodine',
  'Aurizon',
  'Surolan',
  'Isathal',
  'Iryplus',
  'Tobral',
  'Colbiocin',
  'Amoxicillina + acido clavulanico',
  'Meloxicam',
  'Prednisolone',
  'Omeprazolo',
  'Furosemide',
  'Benazepril',
  'Gabapentin',
  'Probiotico veterinario',
  'Collirio antibiotico',
  'Gocce auricolari',
  'Sciroppo mucolitico',
] as const

const FORMATI_SOMMINISTRAZIONE = [
  { value: 'compressa', label: 'Compressa' },
  { value: 'pasticca', label: 'Pasticca' },
  { value: 'puntura', label: 'Puntura' },
  { value: 'gocce', label: 'Gocce' },
  { value: 'collirio', label: 'Collirio' },
  { value: 'sciroppo', label: 'Sciroppo' },
  { value: 'crema', label: 'Crema' },
  { value: 'spray', label: 'Spray' },
] as const

const STEP_LABELS: Record<Step, string> = {
  animale: 'Animale',
  farmaco: 'Farmaco',
  frequenza: 'Frequenza',
  date: 'Date',
  note: 'Conferma',
}

const FORMATO_LABELS: Record<FormatoSomministrazione, string> = {
  compressa: 'compressa',
  pasticca: 'pasticca',
  puntura: 'puntura',
  gocce: 'gocce',
  collirio: 'collirio',
  sciroppo: 'sciroppo',
  crema: 'crema',
  spray: 'spray',
}

const QUANTITA_CONFIG: Record<
  FormatoSomministrazione,
  {
    label: string
    placeholder: string
    helper: string
    quickValues: string[]
    inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  }
> = {
  compressa: {
    label: 'Quantità',
    placeholder: 'Es. mezza, 1, 2',
    helper: 'Indica quante compresse dare.',
    quickValues: ['mezza', '1', '2'],
  },
  pasticca: {
    label: 'Quantità',
    placeholder: 'Es. mezza, 1, 2',
    helper: 'Indica quante pasticche dare.',
    quickValues: ['mezza', '1', '2'],
  },
  puntura: {
    label: 'Quantità',
    placeholder: 'Es. 1',
    helper: 'Indica quante punture sono previste per ogni somministrazione.',
    quickValues: ['1', '2'],
    inputMode: 'numeric',
  },
  gocce: {
    label: 'Numero di gocce',
    placeholder: 'Es. 4',
    helper: 'Indica quante gocce dare ogni volta.',
    quickValues: ['1', '2', '3', '4', '5'],
    inputMode: 'numeric',
  },
  collirio: {
    label: 'Numero di gocce',
    placeholder: 'Es. 2',
    helper: 'Indica quante gocce mettere per ogni somministrazione.',
    quickValues: ['1', '2', '3'],
    inputMode: 'numeric',
  },
  sciroppo: {
    label: 'Quantità in ml',
    placeholder: 'Es. 2,5',
    helper: 'Indica i ml da somministrare.',
    quickValues: ['0,5', '1', '2', '5'],
    inputMode: 'decimal',
  },
  crema: {
    label: 'Quantità',
    placeholder: 'Es. 1 applicazione',
    helper: 'Puoi scrivere ad esempio 1 applicazione o 2 applicazioni.',
    quickValues: ['1 applicazione', '2 applicazioni'],
  },
  spray: {
    label: 'Quantità',
    placeholder: 'Es. 2 spruzzi',
    helper: 'Puoi scrivere ad esempio 1 spruzzo o 2 spruzzi.',
    quickValues: ['1 spruzzo', '2 spruzzi', '3 spruzzi'],
  },
}

function getStepInfo(
  step: Step,
  isEditMode: boolean,
  isGeneralVariant: boolean
) {
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
      title: isGeneralVariant
        ? 'Farmaco, formato e quantità'
        : 'Farmaco e dose',
      description: isGeneralVariant
        ? 'Indica che farmaco è, in che formato lo dai e quanto ne dai.'
        : 'Inserisci i dati principali della terapia.',
    }
  }

  if (step === 'frequenza') {
    return {
      icon: <CalendarDays size={22} strokeWidth={2.2} />,
      title: 'Frequenza',
      description: 'Quante volte al giorno va somministrata?',
    }
  }

  if (step === 'date') {
    return {
      icon: <Clock3 size={22} strokeWidth={2.2} />,
      title: isGeneralVariant ? 'Orari e durata' : 'Date e durata',
      description: isGeneralVariant
        ? 'Imposta prima gli orari richiesti dalla frequenza scelta, poi da quando a quando.'
        : 'Scegli la data di inizio, opzionalmente una durata in giorni e, se vuoi, anche un orario.',
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

function getAvatarTone(categoria?: string | null) {
  const mappa: Record<string, string> = {
    cani: 'bg-amber-100 text-amber-700',
    gatti: 'bg-orange-100 text-orange-700',
    pesci: 'bg-sky-100 text-sky-700',
    uccelli: 'bg-lime-100 text-lime-700',
    rettili: 'bg-green-100 text-green-700',
    piccoli_mammiferi: 'bg-rose-100 text-rose-700',
    altri_animali: 'bg-violet-100 text-violet-700',
  }

  return mappa[categoria ?? ''] ?? 'bg-slate-100 text-slate-700'
}

function getAnimaleInfo(animale: AnimaleOption) {
  const dettagli = [animale.specie, animale.razza].filter(Boolean)
  if (dettagli.length > 0) {
    return dettagli.join(' · ')
  }

  return 'Dettagli non disponibili'
}

function getInitial(nome: string) {
  return nome.trim().charAt(0).toUpperCase() || 'A'
}

function CardSelezioneAnimale({
  animale,
  selected,
  onClick,
}: {
  animale: AnimaleOption
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.99]',
        selected
          ? 'border-amber-300 bg-amber-50 shadow-sm'
          : 'border-[#EEE4D9] bg-[#FCF8F3]'
      )}
    >
      <div className="relative shrink-0">
        {animale.foto_url ? (
          <img
            src={animale.foto_url}
            alt={animale.nome}
            className="h-14 w-14 rounded-2xl object-cover shadow-sm"
          />
        ) : (
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl font-extrabold shadow-sm',
              getAvatarTone(animale.categoria)
            )}
          >
            {getInitial(animale.nome)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-gray-900">
          {animale.nome}
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          {getAnimaleInfo(animale)}
        </p>
      </div>

      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
          selected
            ? 'border-amber-500 bg-amber-500 text-white'
            : 'border-gray-300 bg-white text-transparent'
        )}
      >
        <Check size={14} strokeWidth={3} />
      </div>
    </button>
  )
}

function parseDateIso(dateIso: string) {
  const [year, month, day] = dateIso.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0)
}

function addDaysToIsoDate(dateIso: string, daysToAdd: number) {
  const base = parseDateIso(dateIso)
  base.setDate(base.getDate() + daysToAdd)
  const year = base.getFullYear()
  const month = String(base.getMonth() + 1).padStart(2, '0')
  const day = String(base.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDurationDaysFromDates(dataInizio: string, dataFine: string) {
  if (!dataInizio || !dataFine) return ''
  const start = parseDateIso(dataInizio)
  const end = parseDateIso(dataFine)
  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / 86400000) + 1

  if (diffDays <= 0 || Number.isNaN(diffDays)) return ''
  return String(diffDays)
}

function formatDateLabel(dateIso: string) {
  if (!dateIso) return 'Non indicata'

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseDateIso(dateIso))
}

function getOrariRichiestiDaFrequenza(frequenza: string) {
  if (frequenza === 'una_volta_giorno') return 1
  if (frequenza === 'due_volte_giorno') return 2
  if (frequenza === 'tre_volte_giorno') return 3
  return 0
}

function normalizzaOrariPerFrequenza(orari: string[], frequenza: string) {
  const richiesti = getOrariRichiestiDaFrequenza(frequenza)
  if (richiesti === 0) return []

  return Array.from({ length: richiesti }, (_, index) => orari[index] ?? '')
}

function parseOrariIniziali(orariRaw: string, frequenza: string) {
  const richiesti = getOrariRichiestiDaFrequenza(frequenza)
  const parti = orariRaw
    .split(/\s*(?:,|•|\|)\s*/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (richiesti === 0) return []
  return Array.from({ length: richiesti }, (_, index) => parti[index] ?? '')
}

function buildDoseFromFormatoEQuantita(
  formato: FormatoSomministrazione | '',
  quantita: string
) {
  const q = quantita.trim()
  if (!formato || !q) return ''

  if (formato === 'compressa') {
    if (q === '1') return '1 compressa'
    if (q === 'mezza') return 'mezza compressa'
    return `${q} compresse`
  }

  if (formato === 'pasticca') {
    if (q === '1') return '1 pasticca'
    if (q === 'mezza') return 'mezza pasticca'
    return `${q} pasticche`
  }

  if (formato === 'puntura') {
    if (q === '1') return '1 puntura'
    return `${q} punture`
  }

  if (formato === 'gocce') {
    if (q === '1') return '1 goccia'
    return `${q} gocce`
  }

  if (formato === 'collirio') {
    if (q === '1') return '1 goccia di collirio'
    return `${q} gocce di collirio`
  }

  if (formato === 'sciroppo') {
    return `${q} ml`
  }

  if (formato === 'crema') {
    if (q.toLowerCase().includes('crema')) return q
    return `${q} di crema`
  }

  if (formato === 'spray') {
    const lower = q.toLowerCase()
    if (lower.includes('spruzz') || lower.includes('spray')) return q
    return `${q} spray`
  }

  return q
}

function parseDoseIniziale(doseRaw: string): {
  formato: FormatoSomministrazione | ''
  quantita: string
} {
  const dose = doseRaw.trim()
  const lower = dose.toLowerCase()

  if (!dose) {
    return { formato: '', quantita: '' }
  }

  if (lower.includes('collirio')) {
    return {
      formato: 'collirio',
      quantita: dose
        .replace(/gocce?\s+di\s+collirio/i, '')
        .replace(/goccia\s+di\s+collirio/i, '')
        .trim(),
    }
  }

  if (lower.includes('ml')) {
    return {
      formato: 'sciroppo',
      quantita: dose.replace(/ml/i, '').trim(),
    }
  }

  if (lower.includes('compress')) {
    return {
      formato: 'compressa',
      quantita: dose.replace(/compresse?/i, '').trim(),
    }
  }

  if (lower.includes('pastic')) {
    return {
      formato: 'pasticca',
      quantita: dose.replace(/pasticche?/i, '').trim(),
    }
  }

  if (lower.includes('puntur')) {
    return {
      formato: 'puntura',
      quantita: dose.replace(/punture?/i, '').trim(),
    }
  }

  if (lower.includes('goccia') || lower.includes('gocce')) {
    return {
      formato: 'gocce',
      quantita: dose.replace(/gocce?/i, '').trim(),
    }
  }

  if (lower.includes('crema')) {
    return {
      formato: 'crema',
      quantita: dose.replace(/\s*di\s+crema/i, '').replace(/crema/i, '').trim(),
    }
  }

  if (lower.includes('spray')) {
    return {
      formato: 'spray',
      quantita: dose.replace(/spray/i, '').trim(),
    }
  }

  return {
    formato: '',
    quantita: '',
  }
}

export function NuovaTerapiaWizard({
  title,
  subtitle,
  backHref,
  submitAction,
  animali,
  preselectedAnimalId,
  valoriIniziali,
  variant = 'standard',
}: {
  title: string
  subtitle: string
  backHref: string
  submitAction: (formData: FormData) => void | Promise<void>
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
  variant?: WizardVariant
}) {
  const isEditMode = Boolean(valoriIniziali)
  const isGeneralVariant = variant === 'generale'
  const hasAnimalStep = !preselectedAnimalId

  const steps = useMemo<Step[]>(
    () =>
      hasAnimalStep
        ? ['animale', 'farmaco', 'frequenza', 'date', 'note']
        : ['farmaco', 'frequenza', 'date', 'note'],
    [hasAnimalStep]
  )

  const frequenzaIniziale = valoriIniziali?.frequenza ?? 'una_volta_giorno'
  const doseInizialeParsata = parseDoseIniziale(valoriIniziali?.dose ?? '')

  const [step, setStep] = useState<Step>(hasAnimalStep ? 'animale' : 'farmaco')
  const [animaleId, setAnimaleId] = useState(preselectedAnimalId ?? '')
  const [nomeFarmaco, setNomeFarmaco] = useState(valoriIniziali?.nomeFarmaco ?? '')
  const [dose, setDose] = useState(valoriIniziali?.dose ?? '')
  const [formatoSomministrazione, setFormatoSomministrazione] = useState<
    FormatoSomministrazione | ''
  >(isGeneralVariant ? doseInizialeParsata.formato : '')
  const [quantitaSomministrazione, setQuantitaSomministrazione] = useState(
    isGeneralVariant ? doseInizialeParsata.quantita : ''
  )
  const [frequenza, setFrequenza] = useState<string>(frequenzaIniziale)
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
  const [durataGiorni, setDurataGiorni] = useState(() =>
    getDurationDaysFromDates(
      valoriIniziali?.dataInizio ?? '',
      valoriIniziali?.dataFine ?? ''
    )
  )
  const [oraSomministrazione, setOraSomministrazione] = useState(
    valoriIniziali?.oraSomministrazione ?? ''
  )
  const [orariSomministrazione, setOrariSomministrazione] = useState<string[]>(
    () =>
      isGeneralVariant
        ? parseOrariIniziali(
            valoriIniziali?.oraSomministrazione ?? '',
            frequenzaIniziale
          )
        : []
  )
  const [note, setNote] = useState(valoriIniziali?.note ?? '')
  const [errori, setErrori] = useState<Partial<Record<Step, string>>>({})

  const dataFineCalcolata = useMemo(() => {
    const durataNumero = Number(durataGiorni)

    if (!dataInizio || !durataGiorni || !Number.isInteger(durataNumero)) {
      return ''
    }

    if (durataNumero <= 0) return ''
    return addDaysToIsoDate(dataInizio, durataNumero - 1)
  }, [dataInizio, durataGiorni])

  const animaleSelezionato = animali.find((a) => a.id === animaleId) ?? null
  const indice = steps.indexOf(step)
  const stepInfo = getStepInfo(step, isEditMode, isGeneralVariant)
  const quantitaConfig = formatoSomministrazione
    ? QUANTITA_CONFIG[formatoSomministrazione]
    : null
  const doseComposta = isGeneralVariant
    ? buildDoseFromFormatoEQuantita(formatoSomministrazione, quantitaSomministrazione)
    : dose
  const orariRichiesti = isGeneralVariant
    ? getOrariRichiestiDaFrequenza(frequenza)
    : 0
  const orariCompattati = isGeneralVariant
    ? orariSomministrazione.filter(Boolean).join(', ')
    : oraSomministrazione

  function vaiAvanti() {
    const erroriNuovi: Partial<Record<Step, string>> = {}

    if (step === 'animale' && !animaleId) {
      erroriNuovi.animale = 'Seleziona un animale'
    }

    if (step === 'farmaco') {
      if (!nomeFarmaco.trim()) {
        erroriNuovi.farmaco = 'Compila il nome del farmaco'
      } else if (isGeneralVariant) {
        if (!formatoSomministrazione || !quantitaSomministrazione.trim()) {
          erroriNuovi.farmaco = 'Seleziona formato e quantità'
        }
      } else if (!dose.trim()) {
        erroriNuovi.farmaco = 'Compila nome farmaco e dose'
      }
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
      } else if (durataGiorni && !dataFineCalcolata) {
        erroriNuovi.date = 'Inserisci una durata valida in giorni'
      } else if (
        isGeneralVariant &&
        orariRichiesti > 0 &&
        orariSomministrazione.some((orario) => !orario.trim())
      ) {
        erroriNuovi.date = 'Compila tutti gli orari richiesti dalla frequenza scelta'
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

  function applicaQuantitaRapida(suggerimento: string) {
    if (isGeneralVariant) {
      setQuantitaSomministrazione(suggerimento)
      setErrori((prev) => ({ ...prev, farmaco: undefined }))
      return
    }

    setDose(suggerimento)
    setErrori((prev) => ({ ...prev, farmaco: undefined }))
  }

  function aggiornaFrequenza(nuovaFrequenza: string) {
    setFrequenza(nuovaFrequenza)
    setErrori((prev) => ({ ...prev, frequenza: undefined, date: undefined }))

    if (isGeneralVariant) {
      setOrariSomministrazione((prev) =>
        normalizzaOrariPerFrequenza(prev, nuovaFrequenza)
      )
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

      <form action={submitAction} className="flex-1 px-5 pb-12 pt-4">
        <input type="hidden" name="animale_id" value={animaleId} />
        <input type="hidden" name="nome_farmaco" value={nomeFarmaco} />
        <input type="hidden" name="dose" value={doseComposta} />
        <input type="hidden" name="frequenza" value={frequenza} />
        <input type="hidden" name="frequenza_custom" value={frequenzaCustom} />
        <input type="hidden" name="data_inizio" value={dataInizio} />
        <input type="hidden" name="data_fine" value={dataFineCalcolata} />
        <input type="hidden" name="ora_somministrazione" value={orariCompattati} />
        <input type="hidden" name="note" value={note} />
        {isGeneralVariant && (
          <>
            <input
              type="hidden"
              name="formato_somministrazione"
              value={formatoSomministrazione}
            />
            <input
              type="hidden"
              name="quantita_somministrazione"
              value={quantitaSomministrazione}
            />
          </>
        )}

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
              <Campo
                label="Animale"
                required
                error={errori.animale}
                helper="Scegli l’animale giusto controllando anche specie o razza."
              >
                <div className="space-y-3">
                  {animali.map((animale) => (
                    <CardSelezioneAnimale
                      key={animale.id}
                      animale={animale}
                      selected={animaleId === animale.id}
                      onClick={() => {
                        setAnimaleId(animale.id)
                        setErrori((prev) => ({ ...prev, animale: undefined }))
                      }}
                    />
                  ))}
                </div>
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
              <div className="space-y-5">
                <Campo
                  label="Nome farmaco"
                  required
                  error={errori.farmaco}
                  helper="Puoi scegliere un suggerimento realistico oppure scrivere liberamente."
                >
                  <AutocompleteInput
                    id="nome_farmaco"
                    placeholder="Es. Synulox, Metacam, Apoquel..."
                    value={nomeFarmaco}
                    onChange={(value) => {
                      setNomeFarmaco(value)
                      setErrori((prev) => ({ ...prev, farmaco: undefined }))
                    }}
                    suggerimenti={[...FARMACI_SUGGERITI_REALISTICI]}
                    className="h-12 rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base"
                  />
                </Campo>

                {isGeneralVariant ? (
                  <>
                    <Campo
                      label="Formato"
                      required
                      helper="Seleziona in che formato lo somministri."
                    >
                      <div className="flex flex-wrap gap-2">
                        {FORMATI_SOMMINISTRAZIONE.map((formato) => (
                          <button
                            key={formato.value}
                            type="button"
                            onClick={() => {
                              setFormatoSomministrazione(formato.value)
                              setQuantitaSomministrazione('')
                              setErrori((prev) => ({ ...prev, farmaco: undefined }))
                            }}
                            className={cn(
                              'rounded-full border px-3 py-2 text-xs font-bold transition-all active:scale-[0.98]',
                              formatoSomministrazione === formato.value
                                ? 'border-amber-300 bg-amber-100 text-amber-700'
                                : 'border-[#E7DBCF] bg-[#FCF8F3] text-gray-600'
                            )}
                          >
                            {formato.label}
                          </button>
                        ))}
                      </div>
                    </Campo>

                    <Campo
                      label={quantitaConfig?.label ?? 'Quantità'}
                      required
                      helper={
                        quantitaConfig?.helper ??
                        'Seleziona prima un formato per impostare una quantità coerente.'
                      }
                    >
                      <input
                        value={quantitaSomministrazione}
                        onChange={(e) => {
                          setQuantitaSomministrazione(e.target.value)
                          setErrori((prev) => ({ ...prev, farmaco: undefined }))
                        }}
                        placeholder={
                          quantitaConfig?.placeholder ??
                          'Seleziona prima un formato'
                        }
                        disabled={!formatoSomministrazione}
                        inputMode={quantitaConfig?.inputMode}
                        className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none placeholder:text-gray-400 disabled:opacity-60"
                      />

                      {quantitaConfig && quantitaConfig.quickValues.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {quantitaConfig.quickValues.map((suggerimento) => (
                            <button
                              key={suggerimento}
                              type="button"
                              onClick={() => applicaQuantitaRapida(suggerimento)}
                              className={cn(
                                'rounded-full border px-3 py-2 text-xs font-bold transition-all active:scale-[0.98]',
                                quantitaSomministrazione === suggerimento
                                  ? 'border-amber-300 bg-amber-100 text-amber-700'
                                  : 'border-[#E7DBCF] bg-[#FCF8F3] text-gray-600'
                              )}
                            >
                              {suggerimento}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </Campo>

                    <Campo
                      label="Dose risultante"
                      helper="Così sarà salvata in terapia e mostrata nel riepilogo."
                    >
                      <div className="flex min-h-12 items-center rounded-2xl border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-4 py-3 text-sm font-semibold text-gray-700">
                        {doseComposta || 'Seleziona formato e quantità'}
                      </div>
                    </Campo>
                  </>
                ) : (
                  <Campo
                    label="Dose / formato"
                    required
                    helper="Tocca un suggerimento rapido oppure scrivi il tuo valore."
                  >
                    <input
                      value={dose}
                      onChange={(e) => {
                        setDose(e.target.value)
                        setErrori((prev) => ({ ...prev, farmaco: undefined }))
                      }}
                      placeholder="Es. 1 compressa, 5 gocce, crema..."
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none placeholder:text-gray-400"
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      {FORMATI_SOMMINISTRAZIONE.map((suggerimento) => (
                        <button
                          key={suggerimento.value}
                          type="button"
                          onClick={() =>
                            applicaQuantitaRapida(suggerimento.label.toLowerCase())
                          }
                          className={cn(
                            'rounded-full border px-3 py-2 text-xs font-bold transition-all active:scale-[0.98]',
                            dose === suggerimento.label.toLowerCase()
                              ? 'border-amber-300 bg-amber-100 text-amber-700'
                              : 'border-[#E7DBCF] bg-[#FCF8F3] text-gray-600'
                          )}
                        >
                          {suggerimento.label}
                        </button>
                      ))}
                    </div>
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

        {step === 'frequenza' && (
          <>
            <SectionCard>
              <div className="space-y-4">
                <Campo
                  label="Frequenza"
                  required
                  error={errori.frequenza}
                  helper={
                    isGeneralVariant
                      ? 'Se scegli 1, 2 o 3 volte al giorno, nello step successivo compariranno automaticamente gli orari necessari.'
                      : undefined
                  }
                >
                  <select
                    value={frequenza}
                    onChange={(e) => aggiornaFrequenza(e.target.value)}
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
                {isGeneralVariant ? (
                  <Campo
                    label="Orari somministrazione"
                    required={orariRichiesti > 0}
                    error={errori.date}
                    helper={
                      orariRichiesti > 0
                        ? `Hai scelto ${orariRichiesti} ${
                            orariRichiesti === 1 ? 'somministrazione' : 'somministrazioni'
                          } al giorno: inserisci ${orariRichiesti} orari.`
                        : frequenza === 'al_bisogno'
                          ? 'Per “al bisogno” non è richiesto un orario fisso.'
                          : 'Con frequenza personalizzata non viene forzato un numero fisso di orari.'
                    }
                  >
                    {orariRichiesti > 0 ? (
                      <div className="space-y-3">
                        {Array.from({ length: orariRichiesti }).map((_, index) => (
                          <input
                            key={`orario-${index}`}
                            type="time"
                            value={orariSomministrazione[index] ?? ''}
                            onChange={(e) => {
                              const prossimo = [...orariSomministrazione]
                              prossimo[index] = e.target.value
                              setOrariSomministrazione(prossimo)
                              setErrori((prev) => ({ ...prev, date: undefined }))
                            }}
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex min-h-12 items-center rounded-2xl border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-4 py-3 text-sm font-semibold text-gray-700">
                        Nessun orario obbligatorio per questa frequenza
                      </div>
                    )}
                  </Campo>
                ) : (
                  <Campo
                    label="Orario somministrazione"
                    helper="Facoltativo. Puoi aggiungerlo ora oppure in seguito."
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
                )}

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

                <Campo
                  label="Durata in giorni"
                  helper="Facoltativa. Se la lasci vuota, la terapia resta senza una data fine."
                  error={errori.date}
                >
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={durataGiorni}
                    onChange={(e) => {
                      const soloNumeri = e.target.value.replace(/\D/g, '')
                      setDurataGiorni(soloNumeri)
                      setErrori((prev) => ({ ...prev, date: undefined }))
                    }}
                    placeholder="Es. 7"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 text-base outline-none placeholder:text-gray-400"
                  />
                </Campo>

                <Campo
                  label="Data fine calcolata"
                  helper={
                    dataFineCalcolata
                      ? 'Calcolata automaticamente da data inizio + durata.'
                      : 'Comparirà automaticamente quando inserisci la durata.'
                  }
                >
                  <div className="flex h-12 items-center rounded-2xl border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-4 text-sm font-semibold text-gray-700">
                    {dataFineCalcolata
                      ? formatDateLabel(dataFineCalcolata)
                      : 'Non impostata'}
                  </div>
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
                    <SummaryItem
                      label="Animale"
                      value={`${animaleSelezionato.nome} · ${getAnimaleInfo(
                        animaleSelezionato
                      )}`}
                    />
                  ) : null}

                  <SummaryItem label="Farmaco" value={nomeFarmaco || '—'} />

                  {isGeneralVariant ? (
                    <>
                      <SummaryItem
                        label="Formato"
                        value={
                          formatoSomministrazione
                            ? FORMATO_LABELS[formatoSomministrazione]
                            : '—'
                        }
                      />
                      <SummaryItem
                        label="Quantità"
                        value={quantitaSomministrazione || '—'}
                      />
                      <SummaryItem label="Dose" value={doseComposta || '—'} />
                    </>
                  ) : (
                    <SummaryItem label="Dose" value={dose || '—'} />
                  )}

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

                  <SummaryItem
                    label="Orari"
                    value={
                      isGeneralVariant
                        ? orariCompattati || 'Non indicati'
                        : oraSomministrazione || 'Non indicato'
                    }
                  />

                  <SummaryItem label="Data inizio" value={dataInizio || '—'} />
                  <SummaryItem
                    label="Durata"
                    value={durataGiorni ? `${durataGiorni} giorni` : 'Non indicata'}
                  />
                  <SummaryItem
                    label="Data fine"
                    value={
                      dataFineCalcolata
                        ? formatDateLabel(dataFineCalcolata)
                        : 'Non indicata'
                    }
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