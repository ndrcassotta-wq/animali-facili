'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import {
  ArrowLeft,
  Camera,
  FileText,
  Images,
  Paperclip,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { documentoSchema } from '@/lib/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AnimaleSelect } from '@/components/scadenze/AnimaleSelect'
import type { Database } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

type FormValori = z.infer<typeof documentoSchema>
type DocumentoInsert = Database['public']['Tables']['documenti']['Insert']

type Step = 'file' | 'titolo' | 'data' | 'note' | 'carica'

const BUCKET_DOCUMENTI = 'documenti-animali'
const MAX_FILE_SIZE_MB = 20
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

const STEPS: Step[] = ['file', 'titolo', 'data', 'note', 'carica']

const STEP_LABELS: Record<Step, string> = {
  file: 'File',
  titolo: 'Titolo',
  data: 'Data',
  note: 'Note',
  carica: 'Carica',
}

const OPTIONAL_STEPS: Step[] = ['data', 'note']

const categorie = [
  { valore: 'ricetta', label: 'Ricetta' },
  { valore: 'referto', label: 'Referto' },
  { valore: 'analisi', label: 'Analisi' },
  { valore: 'certificato', label: 'Certificato' },
  { valore: 'documento_sanitario', label: 'Documento sanitario' },
  { valore: 'ricevuta', label: 'Ricevuta' },
  { valore: 'altro', label: 'Altro' },
]

const MESI = [
  { value: '01', label: 'Gennaio' },
  { value: '02', label: 'Febbraio' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Aprile' },
  { value: '05', label: 'Maggio' },
  { value: '06', label: 'Giugno' },
  { value: '07', label: 'Luglio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Settembre' },
  { value: '10', label: 'Ottobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Dicembre' },
] as const

const GIORNI = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, '0')
)

const DATE_FIELD_CLASS =
  'h-14 min-h-14 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base shadow-none'

const valoriIniziali: FormValori = {
  titolo: '',
  categoria: 'altro',
  data_documento: '',
  note: '',
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageFile(file: File | null) {
  return !!file && file.type.startsWith('image/')
}

function isPdfFile(file: File | null) {
  if (!file) return false
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  )
}

function getTitoloDefaultDaFile(nomeFile: string) {
  const senzaEstensione = nomeFile.replace(/\.[^/.]+$/, '')
  const pulito = senzaEstensione.replace(/[_-]+/g, ' ').trim()

  if (!pulito) return ''

  return pulito.charAt(0).toUpperCase() + pulito.slice(1)
}

function parseDataParts(data?: string | null) {
  if (!data) {
    return { giorno: '', mese: '', anno: '' }
  }

  const [anno = '', mese = '', giorno = ''] = data.split('-')

  return { giorno, mese, anno }
}

function isValidDateParts(
  giorno: string,
  mese: string,
  anno: string
): boolean {
  if (!giorno || !mese || anno.length !== 4) return false

  const y = Number(anno)
  const m = Number(mese)
  const d = Number(giorno)
  const annoCorrente = new Date().getFullYear()

  if (
    !Number.isInteger(y) ||
    !Number.isInteger(m) ||
    !Number.isInteger(d) ||
    y < 1900 ||
    y > annoCorrente ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    return false
  }

  const data = new Date(y, m - 1, d)
  return (
    data.getFullYear() === y &&
    data.getMonth() === m - 1 &&
    data.getDate() === d
  )
}

function buildDateIso(giorno: string, mese: string, anno: string) {
  if (!isValidDateParts(giorno, mese, anno)) return ''
  return `${anno}-${mese}-${giorno}`
}

function formatDatePreview(dataIso: string) {
  if (!dataIso) return ''

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dataIso}T12:00:00`))
}

function isOptionalStep(step: Step) {
  return OPTIONAL_STEPS.includes(step)
}

function getNextStep(step: Step): Step | null {
  const idx = STEPS.indexOf(step)
  return idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null
}

function getPrevStep(step: Step): Step | null {
  const idx = STEPS.indexOf(step)
  return idx > 0 ? STEPS[idx - 1] : null
}

function ProgressBar({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step)
  const percent = (idx / (STEPS.length - 1)) * 100

  return (
    <div className="pt-1 pb-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
          style={{ width: `${percent <= 0 ? 10 : percent}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between gap-2">
        {STEPS.map((s, i) => (
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

function CampoForm({
  label,
  required,
  opzionale,
  errore,
  children,
}: {
  label: string
  required?: boolean
  opzionale?: boolean
  errore?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </Label>
        {opzionale && <span className="text-xs text-gray-400">opzionale</span>}
      </div>
      {children}
      {errore && <p className="text-xs font-medium text-red-500">{errore}</p>}
    </div>
  )
}

function StepActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-60"
    >
      {label}
    </button>
  )
}

function SecondaryActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl border border-amber-200 bg-white py-4 text-base font-bold text-amber-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
    >
      {label}
    </button>
  )
}

function StepLayout({
  children,
  action,
  contentRef,
}: {
  children: ReactNode
  action: ReactNode
  contentRef?: RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={contentRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+40px)]"
      >
        <div className="pb-2">
          {children}
          <div className="mt-6">{action}</div>
        </div>
      </div>
    </div>
  )
}

function RiepilogoRiga({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-bold text-gray-900">
        {value}
      </span>
    </div>
  )
}

export default function CaricaDocumentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const animaleIdPreselezionato = searchParams.get('animale_id') ?? ''
  const isFlussoGenerico = !animaleIdPreselezionato
  const backHref = animaleIdPreselezionato
    ? `/animali/${animaleIdPreselezionato}?tab=documenti`
    : '/documenti'

  const contenutoRef = useRef<HTMLDivElement | null>(null)
  const inputCameraRef = useRef<HTMLInputElement | null>(null)
  const inputFileRef = useRef<HTMLInputElement | null>(null)

  const [step, setStep] = useState<Step>('file')
  const [animaleId, setAnimaleId] = useState(animaleIdPreselezionato)
  const [erroreAnimale, setErroreAnimale] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [valori, setValori] = useState<FormValori>(valoriIniziali)
  const [erroriForm, setErroriForm] = useState<
    Partial<Record<keyof FormValori, string>>
  >({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false)

  const dataDocumentoParts = useMemo(
    () => parseDataParts(valori.data_documento),
    [valori.data_documento]
  )

  const [giornoDocumento, setGiornoDocumento] = useState(
    dataDocumentoParts.giorno
  )
  const [meseDocumento, setMeseDocumento] = useState(dataDocumentoParts.mese)
  const [annoDocumento, setAnnoDocumento] = useState(dataDocumentoParts.anno)

  const categoriaLabel =
    categorie.find((categoria) => categoria.valore === valori.categoria)?.label ??
    'Altro'

  useEffect(() => {
    if (!file || !isImageFile(file)) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(() => {
    const nuovaDataIso = buildDateIso(
      giornoDocumento,
      meseDocumento,
      annoDocumento
    )

    setValori((prev) => ({
      ...prev,
      data_documento: nuovaDataIso,
    }))
  }, [giornoDocumento, meseDocumento, annoDocumento])

  useEffect(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement) {
      active.blur()
    }

    const resetScroll = () => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      contenutoRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    }

    resetScroll()
    const frame = window.requestAnimationFrame(resetScroll)

    return () => window.cancelAnimationFrame(frame)
  }, [step, isQuickEditOpen])

  useEffect(() => {
    if (step !== 'carica') {
      setIsQuickEditOpen(false)
    }
  }, [step])

  function setValue(field: keyof FormValori, value: unknown) {
    setValori((prev) => ({ ...prev, [field]: value }))
    setErroriForm((prev) => ({ ...prev, [field]: undefined }))
  }

  function clearDataDocumentoError() {
    setErroriForm((prev) => ({ ...prev, data_documento: undefined }))
  }

  function validate(): FormValori | null {
    const hasAnyDatePart =
      !!giornoDocumento || !!meseDocumento || !!annoDocumento.trim()

    if (hasAnyDatePart && !valori.data_documento) {
      setErroriForm((prev) => ({
        ...prev,
        data_documento:
          giornoDocumento && meseDocumento && annoDocumento.length === 4
            ? 'Data non valida'
            : 'Completa giorno, mese e anno oppure lascia il campo vuoto',
      }))
      return null
    }

    const result = documentoSchema.safeParse(valori)

    if (!result.success) {
      const fe: Partial<Record<keyof FormValori, string>> = {}

      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormValori
        if (field && !fe[field]) fe[field] = issue.message
      })

      setErroriForm(fe)
      return null
    }

    return result.data
  }

  function handleFileSelected(nextFile: File | null) {
    if (!nextFile) return

    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      setErroreSrv(`Il file non può superare ${MAX_FILE_SIZE_MB}MB.`)
      return
    }

    setErroreSrv(null)
    setFile(nextFile)

    if (!valori.titolo.trim()) {
      const titoloDefault = getTitoloDefaultDaFile(nextFile.name)
      if (titoloDefault) {
        setValori((prev) => ({ ...prev, titolo: titoloDefault }))
      }
    }
  }

  function vaiAvanti(targetStep?: Step) {
    const prossimo = targetStep ?? getNextStep(step)
    if (!prossimo) return
    setErroreSrv(null)
    setStep(prossimo)
  }

  function vaiIndietro() {
    const precedente = getPrevStep(step)
    if (precedente) {
      setStep(precedente)
      return
    }

    router.push(backHref)
  }

  function handleSaltaStep() {
    const prossimo = getNextStep(step)
    if (!prossimo) return
    vaiAvanti(prossimo)
  }

  function handleFileContinue() {
    if (!file) {
      setErroreSrv('Seleziona un file da caricare.')
      return
    }

    vaiAvanti()
  }

  function handleDettagliContinue() {
    let hasError = false

    if (!animaleId) {
      setErroreAnimale('Seleziona un animale.')
      hasError = true
    }

    if (!valori.titolo.trim()) {
      setErroriForm((prev) => ({
        ...prev,
        titolo: 'Il titolo è obbligatorio',
      }))
      hasError = true
    }

    if (hasError) return

    vaiAvanti()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)

    if (!animaleId) {
      setErroreAnimale('Seleziona un animale.')
      setIsQuickEditOpen(true)
      return
    }

    if (!file) {
      setErroreSrv('Seleziona un file da caricare.')
      setStep('file')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErroreSrv(`Il file non può superare ${MAX_FILE_SIZE_MB}MB.`)
      setStep('file')
      return
    }

    const data = validate()
    if (!data) {
      setIsQuickEditOpen(true)
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const nomeSanitizzato = file.name.replace(/[^a-z0-9.\-_]/gi, '_')
      const filePath = `${user.id}/${animaleId}/${Date.now()}_${nomeSanitizzato}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_DOCUMENTI)
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type || undefined,
        })

      if (uploadError) {
        throw new Error('Errore durante il caricamento del file. Riprova.')
      }

      const payload: DocumentoInsert = {
        animale_id: animaleId,
        titolo: data.titolo,
        categoria: data.categoria,
        data_documento: data.data_documento || null,
        file_url: filePath,
        note: data.note || null,
      }

      const { error: dbError } = await supabase.from('documenti').insert(payload)

      if (dbError) {
        await supabase.storage.from(BUCKET_DOCUMENTI).remove([filePath])
        throw new Error('Errore durante il salvataggio. Riprova.')
      }

      router.push(
        animaleIdPreselezionato
          ? `/animali/${animaleId}?tab=documenti`
          : '/documenti'
      )
      router.refresh()
    } catch (error) {
      console.error(error)
      setErroreSrv(
        error instanceof Error
          ? error.message
          : 'Errore durante il caricamento. Riprova.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const erroreDataDocumentoDinamico =
    giornoDocumento || meseDocumento || annoDocumento
      ? !valori.data_documento &&
        giornoDocumento &&
        meseDocumento &&
        annoDocumento.length === 4
        ? 'Data non valida'
        : undefined
      : undefined

  const erroreDataDocumento =
    erroriForm.data_documento ?? erroreDataDocumentoDinamico

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-[#FDF8F3]"
      style={{ minHeight: '100dvh' }}
    >
      <input
        ref={inputCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const nextFile = e.target.files?.[0] ?? null
          handleFileSelected(nextFile)
          e.target.value = ''
        }}
      />

      <input
        ref={inputFileRef}
        type="file"
        accept=".pdf,image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const nextFile = e.target.files?.[0] ?? null
          handleFileSelected(nextFile)
          e.target.value = ''
        }}
      />

      <header className="relative z-10 shrink-0 px-5 pt-10 pb-0">
        <div className="mb-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={vaiIndietro}
            className="flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">
              {step === 'file' ? 'Annulla' : 'Indietro'}
            </span>
          </button>

          {isOptionalStep(step) && (
            <button
              type="button"
              onClick={handleSaltaStep}
              className="text-sm font-semibold text-amber-500 active:opacity-70"
            >
              Salta
            </button>
          )}
        </div>

        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600">
            {isFlussoGenerico ? 'Archivio documenti' : 'Documento animale'}
          </p>
          <p className="mt-1 text-base font-extrabold tracking-tight text-gray-900">
            Nuovo documento
          </p>
        </div>

        <ProgressBar step={step} />
      </header>

      {step === 'file' && (
        <StepLayout
          contentRef={contenutoRef}
          action={
            <StepActionButton
              label="Continua →"
              onClick={handleFileContinue}
            />
          }
        >
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Carica un documento
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Scatta una foto oppure scegli un file già salvato nel telefono o nel
              dispositivo
            </p>
          </div>

          <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-[0_12px_30px_rgba(245,158,11,0.12)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => inputCameraRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-4 text-left shadow-sm transition-all active:scale-[0.99] disabled:opacity-60"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
                  <Camera size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Scatta foto</p>
                  <p className="text-xs text-gray-500">
                    Usa la fotocamera del telefono
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => inputFileRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-4 text-left shadow-sm transition-all active:scale-[0.99] disabled:opacity-60"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-slate-700 shadow-sm">
                  <Images size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Scegli file o galleria
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, immagini o foto già salvate
                  </p>
                </div>
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              Formati supportati: PDF e immagini. Dimensione massima:{' '}
              {MAX_FILE_SIZE_MB} MB.
            </p>

            {file && (
              <div className="mt-4 rounded-2xl border border-amber-100 bg-white/90 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-slate-700 shadow-sm">
                      {isPdfFile(file) ? (
                        <FileText size={20} strokeWidth={2.1} />
                      ) : (
                        <Paperclip size={20} strokeWidth={2.1} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatFileSize(file.size)}
                        {isPdfFile(file)
                          ? ' · PDF'
                          : isImageFile(file)
                            ? ' · Immagine'
                            : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      setErroreSrv(null)
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 active:opacity-70"
                    aria-label="Rimuovi file selezionato"
                  >
                    <X size={16} strokeWidth={2.2} />
                  </button>
                </div>

                {previewUrl && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-amber-100 bg-white">
                    <img
                      src={previewUrl}
                      alt="Anteprima documento"
                      className="max-h-[360px] w-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {erroreSrv && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">{erroreSrv}</p>
            </div>
          )}
        </StepLayout>
      )}

      {step === 'titolo' && (
        <StepLayout
          contentRef={contenutoRef}
          action={
            <StepActionButton
              label="Continua →"
              onClick={handleDettagliContinue}
            />
          }
        >
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Descrivi il documento
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Scegli l’animale, inserisci un titolo e imposta la categoria
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-sm font-semibold text-gray-700">
                    Animale
                    <span className="ml-1 text-red-400">*</span>
                  </Label>
                </div>

                <AnimaleSelect
                  valore={animaleId}
                  onChange={(value) => {
                    setAnimaleId(value)
                    setErroreAnimale(null)
                  }}
                  disabled={!!animaleIdPreselezionato || isSubmitting}
                />

                {erroreAnimale && (
                  <p className="text-xs font-medium text-red-500">
                    {erroreAnimale}
                  </p>
                )}
              </div>

              <CampoForm
                label="Titolo"
                required
                errore={erroriForm.titolo}
              >
                <Input
                  id="titolo"
                  placeholder="es. Visita 2024, Analisi sangue..."
                  value={valori.titolo}
                  onChange={(e) => setValue('titolo', e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                  className="h-14 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                />
              </CampoForm>

              <CampoForm label="Categoria">
                <Select
                  value={valori.categoria}
                  onValueChange={(v) => setValue('categoria', v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-14 rounded-xl border-gray-200 bg-gray-50 px-4 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorie.map((categoria) => (
                      <SelectItem
                        key={categoria.valore}
                        value={categoria.valore}
                      >
                        {categoria.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CampoForm>
            </div>
          </div>
        </StepLayout>
      )}

      {step === 'data' && (
        <StepLayout
          contentRef={contenutoRef}
          action={
            <StepActionButton
              label="Continua →"
              onClick={() => vaiAvanti()}
            />
          }
        >
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Inserisci la data
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Facoltativa, ma utile soprattutto per documenti sanitari, referti e
              ricevute
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm
              label="Data documento"
              opzionale
              errore={erroreDataDocumento}
            >
              <div className="grid grid-cols-3 items-stretch gap-3">
                <Select
                  value={giornoDocumento}
                  onValueChange={(value) => {
                    clearDataDocumentoError()
                    setGiornoDocumento(value ?? '')
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className={DATE_FIELD_CLASS}>
                    <SelectValue placeholder="Giorno" />
                  </SelectTrigger>
                  <SelectContent>
                    {GIORNI.map((giorno) => (
                      <SelectItem key={giorno} value={giorno}>
                        {Number(giorno)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={meseDocumento}
                  onValueChange={(value) => {
                    clearDataDocumentoError()
                    setMeseDocumento(value ?? '')
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className={DATE_FIELD_CLASS}>
                    <SelectValue placeholder="Mese" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESI.map((mese) => (
                      <SelectItem key={mese.value} value={mese.value}>
                        {mese.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="Anno"
                  value={annoDocumento}
                  onChange={(e) => {
                    clearDataDocumentoError()
                    const soloNumeri = e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 4)
                    setAnnoDocumento(soloNumeri)
                  }}
                  disabled={isSubmitting}
                  className={`${DATE_FIELD_CLASS} py-0 leading-none`}
                />
              </div>

              <p className="text-xs text-gray-400">
                Questo inserimento è più comodo anche per documenti molto vecchi.
              </p>

              {valori.data_documento && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
                    Data selezionata
                  </p>
                  <p className="mt-1 text-sm font-bold text-amber-900">
                    {formatDatePreview(valori.data_documento)}
                  </p>
                </div>
              )}

              {(giornoDocumento || meseDocumento || annoDocumento) && (
                <button
                  type="button"
                  onClick={() => {
                    clearDataDocumentoError()
                    setGiornoDocumento('')
                    setMeseDocumento('')
                    setAnnoDocumento('')
                  }}
                  disabled={isSubmitting}
                  className="text-sm font-semibold text-gray-500 underline underline-offset-4 active:opacity-70"
                >
                  Pulisci data
                </button>
              )}
            </CampoForm>
          </div>
        </StepLayout>
      )}

      {step === 'note' && (
        <StepLayout
          contentRef={contenutoRef}
          action={
            <StepActionButton
              label="Continua →"
              onClick={() => vaiAvanti()}
            />
          }
        >
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Aggiungi note
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Campo facoltativo utile per ricordarti dettagli o contesto del
              documento
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm label="Note" opzionale>
              <Textarea
                id="note"
                placeholder="Note sul documento"
                value={valori.note ?? ''}
                onChange={(e) => setValue('note', e.target.value)}
                disabled={isSubmitting}
                rows={5}
                className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base"
              />
            </CampoForm>
          </div>
        </StepLayout>
      )}

      {step === 'carica' && (
        <StepLayout
          contentRef={contenutoRef}
          action={
            <div className="space-y-4">
              {erroreSrv && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-600">
                    {erroreSrv}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-base font-bold text-white shadow-lg shadow-orange-200 disabled:opacity-60"
                disabled={isSubmitting || !file}
              >
                {isSubmitting ? 'Caricamento...' : 'Carica documento'}
              </Button>

              <SecondaryActionButton
                label={
                  isQuickEditOpen ? 'Torna al riepilogo' : 'Modifica rapida'
                }
                onClick={() => setIsQuickEditOpen((prev) => !prev)}
                disabled={isSubmitting}
              />
            </div>
          }
        >
          {!isQuickEditOpen && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Controlla e carica
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  Ultimo controllo prima di salvare il documento nell’archivio
                </p>
              </div>

              {file && (
                <div className="mb-5 rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-[0_12px_30px_rgba(245,158,11,0.12)]">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                      {isPdfFile(file) ? (
                        <FileText
                          size={28}
                          strokeWidth={2.1}
                          className="text-slate-700"
                        />
                      ) : (
                        <Paperclip
                          size={28}
                          strokeWidth={2.1}
                          className="text-slate-700"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-extrabold text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-sm font-medium text-gray-500">
                        {formatFileSize(file.size)}
                        {isPdfFile(file)
                          ? ' · PDF'
                          : isImageFile(file)
                            ? ' · Immagine'
                            : ''}
                      </p>
                    </div>
                  </div>

                  {previewUrl && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-amber-100 bg-white">
                      <img
                        src={previewUrl}
                        alt="Anteprima documento"
                        className="max-h-[320px] w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">
                      Animale
                    </Label>
                    <AnimaleSelect
                      valore={animaleId}
                      onChange={() => {}}
                      disabled
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
                  <RiepilogoRiga
                    label="Titolo"
                    value={valori.titolo.trim() || '—'}
                  />
                  <RiepilogoRiga label="Categoria" value={categoriaLabel} />
                  <RiepilogoRiga
                    label="Data documento"
                    value={
                      valori.data_documento
                        ? formatDatePreview(valori.data_documento)
                        : 'Non inserita'
                    }
                  />
                  <RiepilogoRiga
                    label="Note"
                    value={valori.note?.trim() || 'Non inserite'}
                  />
                </div>
              </div>
            </>
          )}

          {isQuickEditOpen && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Modifica rapida
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  Correggi tutto da qui senza tornare indietro step per step
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-sm font-semibold text-gray-700">
                        Animale
                        <span className="ml-1 text-red-400">*</span>
                      </Label>
                    </div>

                    <AnimaleSelect
                      valore={animaleId}
                      onChange={(value) => {
                        setAnimaleId(value)
                        setErroreAnimale(null)
                      }}
                      disabled={!!animaleIdPreselezionato || isSubmitting}
                    />

                    {erroreAnimale && (
                      <p className="text-xs font-medium text-red-500">
                        {erroreAnimale}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
                  <CampoForm
                    label="Titolo"
                    required
                    errore={erroriForm.titolo}
                  >
                    <Input
                      id="titolo-quick-edit"
                      placeholder="es. Visita 2024, Analisi sangue..."
                      value={valori.titolo}
                      onChange={(e) => setValue('titolo', e.target.value)}
                      disabled={isSubmitting}
                      className="h-14 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                    />
                  </CampoForm>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
                  <CampoForm label="Categoria">
                    <Select
                      value={valori.categoria}
                      onValueChange={(v) => setValue('categoria', v)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-14 rounded-xl border-gray-200 bg-gray-50 px-4 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categorie.map((categoria) => (
                          <SelectItem
                            key={categoria.valore}
                            value={categoria.valore}
                          >
                            {categoria.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CampoForm>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
                  <CampoForm
                    label="Data documento"
                    opzionale
                    errore={erroreDataDocumento}
                  >
                    <div className="grid grid-cols-3 items-stretch gap-3">
                      <Select
                        value={giornoDocumento}
                        onValueChange={(value) => {
                          clearDataDocumentoError()
                          setGiornoDocumento(value ?? '')
                        }}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className={DATE_FIELD_CLASS}>
                          <SelectValue placeholder="Giorno" />
                        </SelectTrigger>
                        <SelectContent>
                          {GIORNI.map((giorno) => (
                            <SelectItem key={giorno} value={giorno}>
                              {Number(giorno)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={meseDocumento}
                        onValueChange={(value) => {
                          clearDataDocumentoError()
                          setMeseDocumento(value ?? '')
                        }}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className={DATE_FIELD_CLASS}>
                          <SelectValue placeholder="Mese" />
                        </SelectTrigger>
                        <SelectContent>
                          {MESI.map((mese) => (
                            <SelectItem key={mese.value} value={mese.value}>
                              {mese.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="Anno"
                        value={annoDocumento}
                        onChange={(e) => {
                          clearDataDocumentoError()
                          const soloNumeri = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 4)
                          setAnnoDocumento(soloNumeri)
                        }}
                        disabled={isSubmitting}
                        className={`${DATE_FIELD_CLASS} py-0 leading-none`}
                      />
                    </div>

                    {valori.data_documento && (
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
                          Data selezionata
                        </p>
                        <p className="mt-1 text-sm font-bold text-amber-900">
                          {formatDatePreview(valori.data_documento)}
                        </p>
                      </div>
                    )}

                    {(giornoDocumento || meseDocumento || annoDocumento) && (
                      <button
                        type="button"
                        onClick={() => {
                          clearDataDocumentoError()
                          setGiornoDocumento('')
                          setMeseDocumento('')
                          setAnnoDocumento('')
                        }}
                        disabled={isSubmitting}
                        className="text-sm font-semibold text-gray-500 underline underline-offset-4 active:opacity-70"
                      >
                        Pulisci data
                      </button>
                    )}
                  </CampoForm>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
                  <CampoForm label="Note" opzionale>
                    <Textarea
                      id="note-quick-edit"
                      placeholder="Note sul documento"
                      value={valori.note ?? ''}
                      onChange={(e) => setValue('note', e.target.value)}
                      disabled={isSubmitting}
                      rows={5}
                      className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base"
                    />
                  </CampoForm>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-medium text-amber-800">
                    Quando torni al riepilogo vedrai subito tutti i dati
                    aggiornati.
                  </p>
                </div>
              </div>
            </>
          )}
        </StepLayout>
      )}
    </form>
  )
}