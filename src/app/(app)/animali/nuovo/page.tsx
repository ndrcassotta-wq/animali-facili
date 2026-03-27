'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { animaleSchema } from '@/lib/utils/validation'
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
import type { CategoriaAnimale } from '@/lib/types/app.types'
import type { Database } from '@/lib/types/database.types'
import { ArrowLeft, Camera } from 'lucide-react'
import { CropFoto } from '@/components/ui/CropFoto'
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'
import { SUGGERIMENTI_ANIMALE_PER_CATEGORIA } from '@/lib/utils/specieSuggerimenti'
import { cn } from '@/lib/utils'

type FormValori = z.infer<typeof animaleSchema>
type AnimaleInsert = Database['public']['Tables']['animali']['Insert']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']

type Step =
  | 'categoria'
  | 'nome'
  | 'foto'
  | 'nascita'
  | 'specie'
  | 'sesso'
  | 'peso'
  | 'note'
  | 'crea'

const BUCKET_FOTO_ANIMALI = 'foto-animali'
const MAX_FOTO_SIZE_MB = 10
const MAX_FOTO_SIZE_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024

const STEPS: Step[] = [
  'categoria',
  'nome',
  'foto',
  'nascita',
  'specie',
  'sesso',
  'peso',
  'note',
  'crea',
]

const STEP_LABELS: Record<Step, string> = {
  categoria: 'Tipo',
  nome: 'Nome',
  foto: 'Foto',
  nascita: 'Nascita',
  specie: 'Specie',
  sesso: 'Sesso',
  peso: 'Peso',
  note: 'Note',
  crea: 'Crea',
}

const OPTIONAL_STEPS: Step[] = [
  'foto',
  'nascita',
  'specie',
  'sesso',
  'peso',
  'note',
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

const valoriIniziali: FormValori = {
  nome: '',
  categoria: 'cani',
  specie: '',
  razza: '',
  sesso: 'non_specificato',
  data_nascita: '',
  peso: undefined,
  note: '',
}

const categorie: { valore: CategoriaAnimale; label: string; icona: string }[] = [
  { valore: 'cani', label: 'Cane', icona: '🐕' },
  { valore: 'gatti', label: 'Gatto', icona: '🐈' },
  { valore: 'pesci', label: 'Pesce', icona: '🐟' },
  { valore: 'uccelli', label: 'Uccello', icona: '🦜' },
  { valore: 'rettili', label: 'Rettile', icona: '🦎' },
  { valore: 'piccoli_mammiferi', label: 'Piccolo mammifero', icona: '🐹' },
  { valore: 'altri_animali', label: 'Altro', icona: '🐾' },
]

const labelSesso: Record<string, string> = {
  maschio: 'Maschio',
  femmina: 'Femmina',
  non_specificato: 'Non specificato',
}

const BIRTH_FIELD_CLASS =
  'h-14 min-h-14 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base shadow-none'

function getEstensioneFile(file: File) {
  const parti = file.name.split('.')
  return parti[parti.length - 1]?.toLowerCase() || 'jpg'
}

function generaUuidCompatibile() {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function prossimoCompleanno(dataNascita: string): string {
  const parts = dataNascita.split('-')

  if (parts.length !== 3) {
    return dataNascita
  }

  const mese = Number(parts[1]) - 1
  const giorno = Number(parts[2])

  const oggi = new Date()
  const oggiLocale = new Date(
    oggi.getFullYear(),
    oggi.getMonth(),
    oggi.getDate(),
    12,
    0,
    0,
    0
  )

  const candidato = new Date(oggi.getFullYear(), mese, giorno, 12, 0, 0, 0)

  if (candidato < oggiLocale) {
    candidato.setFullYear(candidato.getFullYear() + 1)
  }

  return formatLocalDate(candidato)
}

function labelCampoPrincipale(categoria: CategoriaAnimale): string {
  if (
    categoria === 'cani' ||
    categoria === 'gatti' ||
    categoria === 'piccoli_mammiferi'
  ) {
    return 'Razza'
  }

  return 'Specie'
}

function placeholderCampoPrincipale(categoria: CategoriaAnimale): string {
  const mappa: Record<CategoriaAnimale, string> = {
    cani: 'es. Labrador, Beagle, Meticcio...',
    gatti: 'es. Europeo, Maine Coon, Persiano...',
    pesci: 'es. Betta, Guppy, Carassius...',
    uccelli: 'es. Cocorita, Canarino, Ara...',
    rettili: 'es. Geco Leopardino, Drago Barbuto...',
    piccoli_mammiferi: 'es. Coniglio Nano, Criceto Dorato...',
    altri_animali: 'Indica la specie del tuo animale',
  }

  return mappa[categoria] ?? ''
}

function colorePerCategoria(categoria: CategoriaAnimale): string {
  const m: Record<CategoriaAnimale, string> = {
    cani: 'bg-amber-100',
    gatti: 'bg-orange-100',
    pesci: 'bg-sky-100',
    uccelli: 'bg-lime-100',
    rettili: 'bg-green-100',
    piccoli_mammiferi: 'bg-rose-100',
    altri_animali: 'bg-violet-100',
  }
  return m[categoria] ?? 'bg-gray-100'
}

function parseDataParts(data?: string | null) {
  if (!data) {
    return { giorno: '', mese: '', anno: '' }
  }

  const [anno = '', mese = '', giorno = ''] = data.split('-')

  return { giorno, mese, anno }
}

function isValidBirthDateParts(
  giorno: string,
  mese: string,
  anno: string
): boolean {
  if (!giorno || !mese || anno.length !== 4) return false

  const y = Number(anno)
  const m = Number(mese)
  const d = Number(giorno)

  if (
    !Number.isInteger(y) ||
    !Number.isInteger(m) ||
    !Number.isInteger(d) ||
    y < 1900 ||
    y > new Date().getFullYear() ||
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

function buildBirthDateIso(giorno: string, mese: string, anno: string) {
  if (!isValidBirthDateParts(giorno, mese, anno)) return ''
  return `${anno}-${mese}-${giorno}`
}

function formatBirthDatePreview(dataIso: string) {
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
  const visibili = STEPS.filter((s) => s !== 'categoria')
  const stepCorrente = step === 'categoria' ? 'nome' : step
  const idx = visibili.indexOf(stepCorrente)
  const percent = (idx / (visibili.length - 1)) * 100

  return (
    <div className="px-5 pt-4 pb-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
          style={{ width: `${percent <= 0 ? 10 : percent}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between gap-2">
        {visibili.map((s, i) => (
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
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
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

function StepLayout({
  children,
  action,
  contentRef,
}: {
  children: React.ReactNode
  action: React.ReactNode
  contentRef?: RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={contentRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-5"
      >
        <div className="pb-2">{children}</div>
      </div>

      <div className="relative z-20 shrink-0 border-t border-black/5 bg-[#FDF8F3] px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+112px)] shadow-[0_-8px_24px_rgba(15,23,42,0.05)]">
        {action}
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

export default function NuovoAnimalePage() {
  const router = useRouter()
  const contenutoRef = useRef<HTMLDivElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  const [step, setStep] = useState<Step>('categoria')
  const [valori, setValori] = useState<FormValori>(valoriIniziali)
  const [erroriForm, setErroriForm] = useState<
    Partial<Record<keyof FormValori, string>>
  >({})
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropNome, setCropNome] = useState('')
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dataNascitaParts = useMemo(
    () => parseDataParts(valori.data_nascita),
    [valori.data_nascita]
  )

  const [giornoNascita, setGiornoNascita] = useState(dataNascitaParts.giorno)
  const [meseNascita, setMeseNascita] = useState(dataNascitaParts.mese)
  const [annoNascita, setAnnoNascita] = useState(dataNascitaParts.anno)

  const fotoPreview = useMemo(() => {
    if (!fotoFile) return null
    return URL.createObjectURL(fotoFile)
  }, [fotoFile])

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    }
  }, [fotoPreview])

  useEffect(() => {
    const nuovaDataIso = buildBirthDateIso(
      giornoNascita,
      meseNascita,
      annoNascita
    )
    setValori((prev) => ({ ...prev, data_nascita: nuovaDataIso }))
  }, [giornoNascita, meseNascita, annoNascita])

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
  }, [step])

  function setValue(field: keyof FormValori, value: unknown) {
    setValori((prev) => ({ ...prev, [field]: value }))
    setErroriForm((prev) => ({ ...prev, [field]: undefined }))
  }

  const categoriaSelezionata = categorie.find(
    (c) => c.valore === valori.categoria
  )

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
    router.back()
  }

  function handleSaltaStep() {
    const prossimo = getNextStep(step)
    if (!prossimo) return
    vaiAvanti(prossimo)
  }

  function handleNomeContinue() {
    const nomePulito = valori.nome.trim()

    if (!nomePulito) {
      setErroriForm((prev) => ({
        ...prev,
        nome: 'Il nome è obbligatorio',
      }))
      return
    }

    vaiAvanti()
  }

  function handleFotoSelezionata(file: File | null) {
    if (!file) return

    if (file.size > MAX_FOTO_SIZE_BYTES) {
      setErroreSrv(`La foto non può superare ${MAX_FOTO_SIZE_MB}MB.`)
      return
    }

    setErroreSrv(null)
    setCropNome(file.name)
    setCropSrc(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    setErroreSrv(null)

    const nomePulito = valori.nome.trim()
    const campoPrincipalePulito = (valori.specie ?? '').trim()

    const nuoviErrori: Partial<Record<keyof FormValori, string>> = {}

    if (!nomePulito) nuoviErrori.nome = 'Il nome è obbligatorio'

    if (Object.keys(nuoviErrori).length > 0) {
      setErroriForm((prev) => ({ ...prev, ...nuoviErrori }))
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsSubmitting(false)
        router.push('/login')
        return
      }

      const nuovoId = generaUuidCompatibile()

      let fotoUrl: string | null = null

      if (fotoFile) {
        const estensione = getEstensioneFile(fotoFile)
        const filePath = `${user.id}/animali/${nuovoId}/foto-${Date.now()}.${estensione}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_FOTO_ANIMALI)
          .upload(filePath, fotoFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: fotoFile.type || undefined,
          })

        if (uploadError) {
          throw new Error(`Upload foto non riuscito: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_FOTO_ANIMALI)
          .getPublicUrl(filePath)

        fotoUrl = publicUrlData.publicUrl
      }

      const dataNascita =
        valori.data_nascita && valori.data_nascita.trim() !== ''
          ? valori.data_nascita
          : null

      const payload: AnimaleInsert = {
        id: nuovoId,
        user_id: user.id,
        nome: nomePulito,
        categoria: valori.categoria,
        specie: campoPrincipalePulito,
        razza: null,
        sesso: valori.sesso ?? 'non_specificato',
        data_nascita: dataNascita,
        peso: valori.peso ?? null,
        note: valori.note || null,
        foto_url: fotoUrl,
        meta_categoria: null,
      }

      const { error } = await supabase.from('animali').insert(payload)

      if (error) {
        throw new Error(`Errore durante il salvataggio: ${error.message}`)
      }

      if (dataNascita) {
        const impegnoCompleanno: ImpegnoInsert = {
          animale_id: nuovoId,
          titolo: 'Compleanno',
          tipo: 'compleanno',
          data: prossimoCompleanno(dataNascita),
          frequenza: 'annuale',
          notifiche_attive: true,
          stato: 'programmato',
          note: `Compleanno di ${nomePulito}`,
        }

        await supabase.from('impegni').insert(impegnoCompleanno)
      }

      router.push(`/animali/${nuovoId}`)
    } catch (error) {
      console.error(error)
      setErroreSrv(
        error instanceof Error
          ? error.message
          : 'Errore durante il salvataggio. Riprova.'
      )
      setIsSubmitting(false)
    }
  }

  const isCategoria = step === 'categoria'
  const titoloCampoPrincipale = labelCampoPrincipale(
    valori.categoria as CategoriaAnimale
  )

  const birthDateError =
    giornoNascita || meseNascita || annoNascita
      ? !valori.data_nascita &&
        annoNascita.length === 4 &&
        giornoNascita &&
        meseNascita
        ? 'Data non valida'
        : undefined
      : undefined

  return (
    <div
      className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-[#FDF8F3]"
      style={{ minHeight: '100dvh' }}
    >
      {cropSrc && (
        <CropFoto
          imageSrc={cropSrc}
          fileName={cropNome}
          onConfirm={(file) => {
            setFotoFile(file)
            URL.revokeObjectURL(cropSrc)
            setCropSrc(null)
          }}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc)
            setCropSrc(null)
          }}
        />
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFotoSelezionata(e.target.files?.[0] ?? null)
          e.target.value = ''
        }}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFotoSelezionata(e.target.files?.[0] ?? null)
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
              {step === 'categoria' ? 'Annulla' : 'Indietro'}
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

        {!isCategoria && <ProgressBar step={step} />}
      </header>

      {step === 'categoria' && (
        <div
          ref={contenutoRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+104px)]"
        >
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Che animale hai?
          </h1>
          <p className="mt-1 mb-6 text-sm text-gray-400">
            Scegli il tipo per iniziare
          </p>

          <div className="grid grid-cols-2 gap-4">
            {categorie.map((cat) => (
              <button
                key={cat.valore}
                type="button"
                onClick={() => {
                  setErroreSrv(null)
                  setValori((prev) => ({
                    ...prev,
                    categoria: cat.valore,
                    specie: '',
                    razza: '',
                  }))
                  vaiAvanti('nome')
                }}
                className="flex flex-col items-center gap-3 rounded-3xl border-2 border-gray-100 bg-white px-4 py-6 text-center shadow-sm transition-all active:scale-95 active:border-amber-300 active:bg-amber-50"
              >
                <span className="text-5xl leading-none">{cat.icona}</span>
                <span className="text-lg font-extrabold text-gray-800">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'nome' && (
        <StepLayout
          contentRef={contenutoRef}
          action={
            <StepActionButton
              label="Continua →"
              onClick={handleNomeContinue}
            />
          }
        >
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-3xl">{categoriaSelezionata?.icona}</span>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Come si chiama?
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              Inserisci il nome del tuo{' '}
              {categoriaSelezionata?.label.toLowerCase()}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm label="Nome" required errore={erroriForm.nome}>
              <Input
                id="nome"
                placeholder={`Il nome del tuo ${categoriaSelezionata?.label.toLowerCase()}`}
                value={valori.nome}
                onChange={(e) => setValue('nome', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleNomeContinue()
                  }
                }}
                enterKeyHint="next"
                autoFocus
                className="h-14 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
              />
            </CampoForm>
          </div>
        </StepLayout>
      )}

      {step === 'foto' && (
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
              Aggiungi una foto
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Facoltativa, ma molto utile per riconoscere subito{' '}
              {valori.nome || 'il tuo animale'}
            </p>
          </div>

          <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-[0_12px_30px_rgba(245,158,11,0.12)]">
            <div className="flex flex-col items-center gap-5">
              <div
                className={cn(
                  'flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-xl',
                  !fotoPreview &&
                    colorePerCategoria(valori.categoria as CategoriaAnimale)
                )}
              >
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Anteprima foto animale"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-7xl leading-none">
                    {categoriaSelezionata?.icona ?? '🐾'}
                  </span>
                )}
              </div>

              <div className="text-center">
                <p className="text-base font-bold text-gray-900">
                  {fotoPreview ? 'Foto selezionata' : 'Scegli come aggiungerla'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Puoi usare direttamente la fotocamera oppure prendere una foto
                  dalla galleria
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-4 text-sm font-bold text-amber-700 shadow-sm transition-all active:scale-[0.98]"
                >
                  <Camera size={18} strokeWidth={2.2} />
                  Usa fotocamera
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
                >
                  Scegli dalla galleria
                </button>
              </div>

              {fotoPreview && (
                <button
                  type="button"
                  onClick={() => setFotoFile(null)}
                  className="text-sm font-semibold text-gray-500 underline underline-offset-4 active:opacity-70"
                >
                  Rimuovi foto
                </button>
              )}

              {erroreSrv && (
                <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-600">
                    {erroreSrv}
                  </p>
                </div>
              )}
            </div>
          </div>
        </StepLayout>
      )}

      {step === 'nascita' && (
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
              Quando è nato {valori.nome || 'il tuo animale'}?
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Se la inserisci ora, l’app potrà ricordarti il compleanno
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm
              label="Data di nascita"
              opzionale
              errore={birthDateError}
            >
              <div className="grid grid-cols-3 items-stretch gap-3">
                <Select
                  value={giornoNascita}
                  onValueChange={(value) => setGiornoNascita(value ?? '')}
                >
                  <SelectTrigger className={BIRTH_FIELD_CLASS}>
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
                  value={meseNascita}
                  onValueChange={(value) => setMeseNascita(value ?? '')}
                >
                  <SelectTrigger className={BIRTH_FIELD_CLASS}>
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
                  value={annoNascita}
                  onChange={(e) => {
                    const soloNumeri = e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 4)
                    setAnnoNascita(soloNumeri)
                  }}
                  className={`${BIRTH_FIELD_CLASS} py-0 leading-none`}
                />
              </div>

              <p className="text-xs text-gray-400">
                Giorno, mese e anno hanno ora la stessa struttura visiva e una
                spaziatura coerente
              </p>

              {valori.data_nascita && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
                    Data selezionata
                  </p>
                  <p className="mt-1 text-sm font-bold text-amber-900">
                    {formatBirthDatePreview(valori.data_nascita)}
                  </p>
                </div>
              )}
            </CampoForm>
          </div>
        </StepLayout>
      )}

      {step === 'specie' && (
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
              {titoloCampoPrincipale} del tuo animale
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Questo campo è facoltativo
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm label={titoloCampoPrincipale} opzionale>
              <AutocompleteInput
                id="specie"
                placeholder={placeholderCampoPrincipale(
                  valori.categoria as CategoriaAnimale
                )}
                value={valori.specie}
                onChange={(v) => setValue('specie', v)}
                suggerimenti={
                  SUGGERIMENTI_ANIMALE_PER_CATEGORIA[
                    valori.categoria as CategoriaAnimale
                  ] ?? []
                }
                disabled={isSubmitting}
                className="h-14 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base"
              />
            </CampoForm>
          </div>
        </StepLayout>
      )}

      {step === 'sesso' && (
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
              Sesso
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Anche questo puoi aggiungerlo dopo
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm label="Sesso" opzionale>
              <Select
                value={valori.sesso ?? 'non_specificato'}
                onValueChange={(v) => setValue('sesso', v)}
              >
                <SelectTrigger className="h-14 rounded-xl border-gray-200 bg-gray-50 px-4 text-base">
                  <span>
                    {labelSesso[valori.sesso ?? 'non_specificato'] ??
                      'Non specificato'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maschio">Maschio</SelectItem>
                  <SelectItem value="femmina">Femmina</SelectItem>
                  <SelectItem value="non_specificato">
                    Non specificato
                  </SelectItem>
                </SelectContent>
              </Select>
            </CampoForm>
          </div>
        </StepLayout>
      )}

      {step === 'peso' && (
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
              Peso
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Inseriscilo solo se ti è comodo farlo ora
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm label="Peso in kg" opzionale>
              <Input
                id="peso"
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0"
                placeholder="es. 4.250"
                value={valori.peso ?? ''}
                onChange={(e) =>
                  setValue(
                    'peso',
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
                className="h-14 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
              />
            </CampoForm>
          </div>
        </StepLayout>
      )}

      {step === 'note' && (
        <StepLayout
          contentRef={contenutoRef}
          action={
            <StepActionButton
              label="Vai al riepilogo →"
              onClick={() => vaiAvanti()}
            />
          }
        >
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Note
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Ultimo campo facoltativo prima della creazione
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm label="Note" opzionale>
              <Textarea
                id="note"
                placeholder="Informazioni aggiuntive"
                value={valori.note ?? ''}
                onChange={(e) => setValue('note', e.target.value)}
                rows={5}
                className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base"
              />
            </CampoForm>
          </div>
        </StepLayout>
      )}

      {step === 'crea' && (
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

              <StepActionButton
                label={isSubmitting ? 'Creazione in corso...' : 'Crea animale'}
                onClick={handleSubmit}
                disabled={isSubmitting}
              />
            </div>
          }
        >
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Controlla e crea
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Ultimo step: il pulsante finale resta sempre visibile in basso
            </p>
          </div>

          <div className="mb-5 rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-[0_12px_30px_rgba(245,158,11,0.12)]">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white shadow-md',
                  !fotoPreview &&
                    colorePerCategoria(valori.categoria as CategoriaAnimale)
                )}
              >
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Anteprima animale"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl leading-none">
                    {categoriaSelezionata?.icona ?? '🐾'}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold text-gray-900">
                  {valori.nome || 'Nuovo animale'}
                </p>
                <p className="text-sm font-medium text-gray-500">
                  {categoriaSelezionata?.label ?? 'Animale'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <RiepilogoRiga label="Nome" value={valori.nome.trim() || '—'} />
            <RiepilogoRiga
              label="Foto"
              value={fotoFile ? 'Aggiunta' : 'Non inserita'}
            />
            <RiepilogoRiga
              label="Data nascita"
              value={
                valori.data_nascita
                  ? formatBirthDatePreview(valori.data_nascita)
                  : 'Non inserita'
              }
            />
            <RiepilogoRiga
              label={titoloCampoPrincipale}
              value={valori.specie?.trim() || 'Non inserita'}
            />
            <RiepilogoRiga
              label="Sesso"
              value={labelSesso[valori.sesso ?? 'non_specificato']}
            />
            <RiepilogoRiga
              label="Peso"
              value={
                valori.peso !== undefined && valori.peso !== null
                  ? `${valori.peso} kg`
                  : 'Non inserito'
              }
            />
            <RiepilogoRiga
              label="Note"
              value={valori.note?.trim() || 'Non inserite'}
            />
          </div>
        </StepLayout>
      )}
    </div>
  )
}