'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
import type { Animale } from '@/lib/types/query.types'
import { ArrowLeft, Camera } from 'lucide-react'
import { CropFoto } from '@/components/ui/CropFoto'
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'
import { SUGGERIMENTI_ANIMALE_PER_CATEGORIA } from '@/lib/utils/specieSuggerimenti'

type FormValori = z.infer<typeof animaleSchema>
type AnimaleUpdate = Database['public']['Tables']['animali']['Update']
type Step = 'nome-foto' | 'nascita' | 'dettagli'

const BUCKET_FOTO_ANIMALI = 'foto-animali'
const MAX_FOTO_SIZE_MB = 10
const MAX_FOTO_SIZE_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024

const STEPS: Step[] = ['nome-foto', 'nascita', 'dettagli']
const STEP_LABELS: Record<Step, string> = {
  'nome-foto': 'Nome',
  nascita: 'Nascita',
  dettagli: 'Dettagli',
}

const metaCampi: Partial<Record<CategoriaAnimale, { label: string; chiave: string }>> = {
  cani: { label: 'Taglia', chiave: 'taglia' },
  pesci: { label: 'Tipo acqua', chiave: 'tipo_acqua' },
  rettili: { label: 'Tipo terrario', chiave: 'tipo_terrario' },
  uccelli: { label: 'Tipo gabbia', chiave: 'tipo_gabbia' },
  piccoli_mammiferi: { label: 'Tipo habitat', chiave: 'tipo_habitat' },
}

function metaSuggerito(categoria: CategoriaAnimale): string {
  const m: Partial<Record<CategoriaAnimale, string>> = {
    cani: 'piccola, media, grande',
    pesci: 'dolce, salata, salmastra',
    rettili: 'desertico, tropicale, temperato',
    uccelli: 'piccola, media, voliera',
    piccoli_mammiferi: 'gabbia, recinto, libero',
  }
  return m[categoria] ?? ''
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

function getIconaCategoria(categoria: CategoriaAnimale): string {
  const m: Record<CategoriaAnimale, string> = {
    cani: '🐕',
    gatti: '🐈',
    pesci: '🐟',
    uccelli: '🦜',
    rettili: '🦎',
    piccoli_mammiferi: '🐹',
    altri_animali: '🐾',
  }
  return m[categoria] ?? '🐾'
}

function getLabelCategoria(categoria: CategoriaAnimale): string {
  const m: Record<CategoriaAnimale, string> = {
    cani: 'Cane',
    gatti: 'Gatto',
    pesci: 'Pesce',
    uccelli: 'Uccello',
    rettili: 'Rettile',
    piccoli_mammiferi: 'Piccolo mammifero',
    altri_animali: 'Altro',
  }
  return m[categoria] ?? 'Animale'
}

function getEstensioneFile(file: File) {
  const parti = file.name.split('.')
  return parti[parti.length - 1]?.toLowerCase() || 'jpg'
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

function ProgressBar({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step)
  const percent = (idx / (STEPS.length - 1)) * 100

  return (
    <div className="px-5 pt-4 pb-2">
      <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
          style={{ width: `${percent === 0 ? 8 : percent}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between">
        {STEPS.map((s, i) => (
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

export default function ModificaAnimaleForm({ animale }: { animale: Animale }) {
  const router = useRouter()

  const categoria = animale.categoria as CategoriaAnimale

  const [step, setStep] = useState<Step>('nome-foto')
  const [valori, setValori] = useState<FormValori>({
    nome: animale.nome ?? '',
    categoria,
    specie: animale.specie || animale.razza || '',
    razza: '',
    sesso: animale.sesso ?? 'non_specificato',
    data_nascita: animale.data_nascita ?? '',
    peso: animale.peso ?? undefined,
    note: animale.note ?? '',
  })

  const [erroriForm, setErroriForm] = useState<Partial<Record<keyof FormValori, string>>>({})
  const [metaValore, setMetaValore] = useState(() => {
    const metaCampo = metaCampi[categoria]
    if (!metaCampo) return ''

    const meta = animale.meta_categoria as Record<string, unknown> | null
    const valore = meta?.[metaCampo.chiave]

    return typeof valore === 'string' ? valore : ''
  })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropNome, setCropNome] = useState('')
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fotoPreview = useMemo(() => {
    if (fotoFile) return URL.createObjectURL(fotoFile)
    return animale.foto_url ?? null
  }, [fotoFile, animale.foto_url])

  useEffect(() => {
    if (!fotoFile || !fotoPreview) return
    return () => URL.revokeObjectURL(fotoPreview)
  }, [fotoFile, fotoPreview])

  function setValue(field: keyof FormValori, value: unknown) {
    setValori(prev => ({ ...prev, [field]: value }))
    setErroriForm(prev => ({ ...prev, [field]: undefined }))
  }

  const metaCampo = metaCampi[valori.categoria as CategoriaAnimale]
  const isNomeFoto = step === 'nome-foto'
  const categoriaLabel = getLabelCategoria(valori.categoria as CategoriaAnimale)
  const categoriaIcona = getIconaCategoria(valori.categoria as CategoriaAnimale)

  function vaiAvanti(nextStep: Step) {
    setStep(nextStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function vaiIndietro() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
    else router.push(`/animali/${animale.id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setErroreSrv(null)

    const nomePulito = valori.nome.trim()
    const campoPrincipalePulito = (valori.specie ?? '').trim()

    const nuoviErrori: Partial<Record<keyof FormValori, string>> = {}

    if (!nomePulito) nuoviErrori.nome = 'Il nome è obbligatorio'
    if (!campoPrincipalePulito) nuoviErrori.specie = 'Questo campo è obbligatorio'

    if (Object.keys(nuoviErrori).length > 0) {
      setErroriForm(prev => ({ ...prev, ...nuoviErrori }))
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

      let fotoUrl: string | null = animale.foto_url ?? null

      if (fotoFile) {
        const estensione = getEstensioneFile(fotoFile)
        const filePath = `${user.id}/animali/${animale.id}/foto-${Date.now()}.${estensione}`

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

      const meta = metaCampo && metaValore ? { [metaCampo.chiave]: metaValore } : null

      const payload: AnimaleUpdate = {
        nome: nomePulito,
        categoria: valori.categoria,
        specie: campoPrincipalePulito,
        razza: null,
        sesso: valori.sesso ?? 'non_specificato',
        data_nascita: dataNascita,
        peso: valori.peso ?? null,
        note: valori.note || null,
        foto_url: fotoUrl,
        meta_categoria: meta,
      }

      const { error } = await supabase
        .from('animali')
        .update(payload)
        .eq('id', animale.id)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(`Errore durante il salvataggio: ${error.message}`)
      }

      router.push(`/animali/${animale.id}`)
      router.refresh()
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

  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>
      {cropSrc && (
        <CropFoto
          imageSrc={cropSrc}
          fileName={cropNome}
          onConfirm={file => {
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

      <header className="shrink-0 px-5 pt-10 pb-0">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={vaiIndietro}
            className="flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">
              {step === 'nome-foto' ? 'Annulla' : 'Indietro'}
            </span>
          </button>

          {(step === 'nascita' || step === 'dettagli') && (
            <button
              onClick={() => (step === 'nascita' ? vaiAvanti('dettagli') : handleSubmit())}
              className="text-sm font-semibold text-amber-500 active:opacity-70"
            >
              {step === 'dettagli' ? 'Salva' : 'Salta'}
            </button>
          )}
        </div>

        {!isNomeFoto && <ProgressBar step={step} />}
      </header>

      {step === 'nome-foto' && (
        <div className="flex flex-1 flex-col px-5 pt-4 pb-12">
          <div className="mb-6">
            <div className="mb-1 flex items-center gap-3">
              <span className="text-3xl">{categoriaIcona}</span>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Modifica profilo
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              Aggiorna i dati del tuo {categoriaLabel.toLowerCase()}
            </p>
          </div>

          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="relative">
              <div
                className={`flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-xl ${
                  fotoPreview ? '' : colorePerCategoria(valori.categoria as CategoriaAnimale)
                }`}
              >
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Anteprima"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-6xl leading-none">{categoriaIcona}</span>
                )}
              </div>

              <label
                htmlFor="foto"
                className="absolute right-0 bottom-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-amber-500 shadow-md active:bg-amber-600"
              >
                <Camera size={18} strokeWidth={2.2} className="text-white" />
              </label>
            </div>

            <p className="text-xs text-gray-400">
              {fotoPreview ? 'Tocca per cambiare foto' : 'Aggiungi una foto (opzionale)'}
            </p>

            <input
              id="foto"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0] ?? null

                if (file && file.size > MAX_FOTO_SIZE_BYTES) {
                  setErroreSrv(`La foto non può superare ${MAX_FOTO_SIZE_MB}MB.`)
                  e.target.value = ''
                  return
                }

                setErroreSrv(null)

                if (file) {
                  setCropNome(file.name)
                  setCropSrc(URL.createObjectURL(file))
                }

                e.target.value = ''
              }}
            />
          </div>

          <div className="mb-4 rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm label="Nome" required errore={erroriForm.nome}>
              <Input
                id="nome"
                placeholder={`Il nome del tuo ${categoriaLabel.toLowerCase()}`}
                value={valori.nome}
                onChange={e => setValue('nome', e.target.value)}
                autoFocus
                className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
              />
            </CampoForm>
          </div>

          <button
            onClick={() => {
              const nomePulito = valori.nome.trim()
              if (!nomePulito) {
                setErroriForm(prev => ({ ...prev, nome: 'Il nome è obbligatorio' }))
                return
              }
              vaiAvanti('nascita')
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
          >
            Continua →
          </button>
        </div>
      )}

      {step === 'nascita' && (
        <div className="flex flex-1 flex-col px-5 pt-4 pb-12">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Quando è nato {valori.nome}?
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Puoi aggiornare la data di nascita quando vuoi
            </p>
          </div>

          <div className="mb-4 rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm label="Data di nascita" opzionale>
              <Input
                id="data_nascita"
                type="date"
                value={valori.data_nascita ?? ''}
                onChange={e => setValue('data_nascita', e.target.value)}
                className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
              />
            </CampoForm>
          </div>

          <button
            onClick={() => vaiAvanti('dettagli')}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
          >
            Continua →
          </button>
        </div>
      )}

      {step === 'dettagli' && (
        <div className="flex flex-1 flex-col px-5 pt-4 pb-12">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Ultimi dettagli
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Aggiorna i dati principali del profilo
            </p>
          </div>

          <div className="mb-4 space-y-5 rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <CampoForm
              label={labelCampoPrincipale(valori.categoria as CategoriaAnimale)}
              required
              errore={erroriForm.specie}
            >
              <AutocompleteInput
                id="specie"
                placeholder={placeholderCampoPrincipale(valori.categoria as CategoriaAnimale)}
                value={valori.specie}
                onChange={v => setValue('specie', v)}
                suggerimenti={
                  SUGGERIMENTI_ANIMALE_PER_CATEGORIA[
                    valori.categoria as CategoriaAnimale
                  ] ?? []
                }
                disabled={isSubmitting}
                className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base"
              />
            </CampoForm>

            <CampoForm label="Sesso" opzionale>
              <Select
                value={valori.sesso ?? 'non_specificato'}
                onValueChange={v => setValue('sesso', v)}
              >
                <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maschio">Maschio</SelectItem>
                  <SelectItem value="femmina">Femmina</SelectItem>
                  <SelectItem value="non_specificato">Non specificato</SelectItem>
                </SelectContent>
              </Select>
            </CampoForm>

            <CampoForm label="Peso in kg" opzionale>
              <Input
                id="peso"
                type="number"
                step="0.001"
                min="0"
                placeholder="es. 4.250"
                value={valori.peso ?? ''}
                onChange={e =>
                  setValue(
                    'peso',
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
                className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
              />
            </CampoForm>

            {metaCampo && (
              <CampoForm label={metaCampo.label} opzionale>
                <Input
                  id="meta"
                  placeholder={`es. ${metaSuggerito(valori.categoria as CategoriaAnimale)}`}
                  value={metaValore}
                  onChange={e => setMetaValore(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                />
              </CampoForm>
            )}

            <CampoForm label="Note" opzionale>
              <Textarea
                id="note"
                placeholder="Informazioni aggiuntive"
                value={valori.note ?? ''}
                onChange={e => setValue('note', e.target.value)}
                rows={3}
                className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base"
              />
            </CampoForm>
          </div>

          {erroreSrv && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">{erroreSrv}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? 'Salvataggio in corso...' : 'Salva modifiche'}
          </button>
        </div>
      )}
    </div>
  )
}