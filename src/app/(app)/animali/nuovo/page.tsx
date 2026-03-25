'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { ArrowLeft, Camera, ChevronDown, ChevronUp } from 'lucide-react'
import { CropFoto } from '@/components/ui/CropFoto'

type FormValori = z.infer<typeof animaleSchema>
type AnimaleInsert = Database['public']['Tables']['animali']['Insert']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']

const BUCKET_FOTO_ANIMALI = 'foto-animali'
const MAX_FOTO_SIZE_MB = 10
const MAX_FOTO_SIZE_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024

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
  { valore: 'cani',              label: 'Cane',              icona: '🐕' },
  { valore: 'gatti',             label: 'Gatto',             icona: '🐈' },
  { valore: 'pesci',             label: 'Pesce',             icona: '🐟' },
  { valore: 'uccelli',           label: 'Uccello',           icona: '🦜' },
  { valore: 'rettili',           label: 'Rettile',           icona: '🦎' },
  { valore: 'piccoli_mammiferi', label: 'Piccolo mammifero', icona: '🐹' },
  { valore: 'altri_animali',     label: 'Altro',             icona: '🐾' },
]

const metaCampi: Partial<Record<CategoriaAnimale, { label: string; chiave: string }>> = {
  cani:              { label: 'Taglia',        chiave: 'taglia' },
  pesci:             { label: 'Tipo acqua',    chiave: 'tipo_acqua' },
  rettili:           { label: 'Tipo terrario', chiave: 'tipo_terrario' },
  uccelli:           { label: 'Tipo gabbia',   chiave: 'tipo_gabbia' },
  piccoli_mammiferi: { label: 'Tipo habitat',  chiave: 'tipo_habitat' },
}

function speciePresentate(categoria: CategoriaAnimale): boolean {
  return categoria !== 'cani' && categoria !== 'gatti'
}

function specieSuggerita(categoria: CategoriaAnimale): string {
  const mappa: Record<CategoriaAnimale, string> = {
    cani:              '',
    gatti:             '',
    pesci:             'es. Betta, Carassio',
    uccelli:           'es. Canarino, Cocorita',
    rettili:           'es. Geco, Iguana',
    piccoli_mammiferi: 'es. Criceto, Coniglio',
    altri_animali:     'Indica la specie del tuo animale',
  }
  return mappa[categoria] ?? ''
}

function metaSuggerito(categoria: CategoriaAnimale): string {
  const mappa: Partial<Record<CategoriaAnimale, string>> = {
    cani:              'piccola, media, grande',
    pesci:             'dolce, salata, salmastra',
    rettili:           'desertico, tropicale, temperato',
    uccelli:           'piccola, media, voliera',
    piccoli_mammiferi: 'gabbia, recinto, libero',
  }
  return mappa[categoria] ?? ''
}

function colorePerCategoria(categoria: CategoriaAnimale): string {
  const mappa: Record<CategoriaAnimale, string> = {
    cani:              'bg-amber-100',
    gatti:             'bg-orange-100',
    pesci:             'bg-sky-100',
    uccelli:           'bg-lime-100',
    rettili:           'bg-green-100',
    piccoli_mammiferi: 'bg-rose-100',
    altri_animali:     'bg-violet-100',
  }
  return mappa[categoria] ?? 'bg-gray-100'
}

function getEstensioneFile(file: File) {
  const parti = file.name.split('.')
  return parti[parti.length - 1]?.toLowerCase() || 'jpg'
}

function generaUuidCompatibile() {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    globalThis.crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'))
    return [hex.slice(0,4).join(''), hex.slice(4,6).join(''), hex.slice(6,8).join(''), hex.slice(8,10).join(''), hex.slice(10,16).join('')].join('-')
  }
  throw new Error('Impossibile generare un ID valido su questo dispositivo.')
}

function prossimCompleanno(dataNascita: string): string {
  const nascita = new Date(dataNascita)
  const oggi = new Date()
  const anno = oggi.getFullYear()
  const candidato = new Date(anno, nascita.getMonth(), nascita.getDate())
  if (candidato < oggi) candidato.setFullYear(anno + 1)
  return candidato.toISOString().split('T')[0]
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

export default function NuovoAnimalePage() {
  const router = useRouter()

  const [step,             setStep]           = useState<'categoria' | 'form'>('categoria')
  const [erroreSrv,        setErroreSrv]      = useState<string | null>(null)
  const [metaValore,       setMetaValore]     = useState('')
  const [fotoFile,         setFotoFile]       = useState<File | null>(null)
  const [cropSrc,          setCropSrc]        = useState<string | null>(null)
  const [cropNome,         setCropNome]       = useState<string>('')
  const [valori,           setValori]         = useState<FormValori>(valoriIniziali)
  const [erroriForm,       setErroriForm]     = useState<Partial<Record<keyof FormValori, string>>>({})
  const [isSubmitting,     setIsSubmitting]   = useState(false)
  const [dettagliAperti,   setDettagliAperti] = useState(false)

  const fotoPreview = useMemo(() => {
    if (!fotoFile) return null
    return URL.createObjectURL(fotoFile)
  }, [fotoFile])

  useEffect(() => {
    return () => { if (fotoPreview) URL.revokeObjectURL(fotoPreview) }
  }, [fotoPreview])

  function setValue(field: keyof FormValori, value: unknown) {
    setValori(prev => ({ ...prev, [field]: value }))
    setErroriForm(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): FormValori | null {
    const valoriDaValidare = { ...valori }
    if (!speciePresentate(valori.categoria as CategoriaAnimale)) {
      valoriDaValidare.specie = valori.categoria === 'cani' ? 'Cane' : 'Gatto'
    }
    const result = animaleSchema.safeParse(valoriDaValidare)
    if (!result.success) {
      const fe: Partial<Record<keyof FormValori, string>> = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof FormValori
        if (field && !fe[field]) fe[field] = issue.message
      })
      setErroriForm(fe)
      return null
    }
    return result.data
  }

  const metaCampo = metaCampi[valori.categoria as CategoriaAnimale]
  const categoriaSelezionata = categorie.find(c => c.valore === valori.categoria)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)

    const data = validate()
    if (!data) return

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const nuovoId = generaUuidCompatibile()

      let fotoUrl: string | null = null
      if (fotoFile) {
        const estensione = getEstensioneFile(fotoFile)
        const filePath = `animali/${nuovoId}/foto-${Date.now()}.${estensione}`
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_FOTO_ANIMALI)
          .upload(filePath, fotoFile, { cacheControl: '3600', upsert: true, contentType: fotoFile.type || undefined })
        if (uploadError) throw new Error(`Upload foto non riuscito: ${uploadError.message}`)
        const { data: publicUrlData } = supabase.storage.from(BUCKET_FOTO_ANIMALI).getPublicUrl(filePath)
        fotoUrl = publicUrlData.publicUrl
      }

      const meta = metaCampo && metaValore ? { [metaCampo.chiave]: metaValore } : null
      const dataNascita = data.data_nascita && data.data_nascita.trim() !== '' ? data.data_nascita : null

      const payload: AnimaleInsert = {
        id:             nuovoId,
        user_id:        user.id,
        nome:           data.nome,
        categoria:      data.categoria,
        specie:         data.specie ?? '',
        razza:          data.razza ?? null,
        sesso:          data.sesso ?? 'non_specificato',
        data_nascita:   dataNascita,
        peso:           data.peso ?? null,
        note:           data.note ?? null,
        foto_url:       fotoUrl,
        meta_categoria: meta,
      }

      const { error } = await supabase.from('animali').insert(payload)
      if (error) throw new Error(`Errore durante il salvataggio: ${error.message}`)

      if (dataNascita) {
        const impegnoCompleanno: ImpegnoInsert = {
          animale_id:       nuovoId,
          titolo:           'Compleanno',
          tipo:             'compleanno',
          data:             prossimCompleanno(dataNascita),
          frequenza:        'annuale',
          notifiche_attive: true,
          stato:            'programmato',
          note:             `Compleanno di ${data.nome}`,
        }
        await supabase.from('impegni').insert(impegnoCompleanno)
      }

      router.push(`/animali/${nuovoId}`)
    } catch (error) {
      console.error('handleSubmit nuovo animale:', error)
      setErroreSrv(error instanceof Error ? error.message : 'Errore durante il salvataggio. Riprova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── STEP 1: scelta categoria ──────────────────────────────────────────────

  if (step === 'categoria') {
    return (
      <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>
        <header className="shrink-0 px-5 pt-10 pb-4">
          <button
            onClick={() => router.back()}
            className="mb-5 flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">Indietro</span>
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Che animale hai?
          </h1>
          <p className="mt-1 text-sm text-gray-400">Scegli il tipo per iniziare</p>
        </header>

        <div className="px-5 pb-12">
          <div className="grid grid-cols-2 gap-4">
            {categorie.map(cat => (
              <button
                key={cat.valore}
                onClick={() => { setValue('categoria', cat.valore); setStep('form') }}
                className="flex flex-col items-center gap-3 rounded-3xl border-2 border-gray-100 bg-white px-4 py-6 text-center shadow-sm transition-all active:scale-95 active:border-amber-300 active:bg-amber-50"
              >
                <span className="text-5xl leading-none" role="img" aria-label={cat.label}>
                  {cat.icona}
                </span>
                <span className="text-lg font-extrabold text-gray-800">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: form dati animale ─────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>

      {/* Crop overlay — appare sopra tutto quando l'utente sceglie una foto */}
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

      <header className="shrink-0 px-5 pt-10 pb-4">
        <button
          onClick={() => setStep('categoria')}
          className="mb-5 flex items-center gap-2 text-gray-500 active:opacity-70"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
          <span className="text-sm font-semibold">Cambia tipo</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl leading-none">{categoriaSelezionata?.icona}</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Nuovo {categoriaSelezionata?.label.toLowerCase() ?? 'animale'}
            </h1>
            <p className="text-sm text-gray-400">Inserisci i dati del tuo animale</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 px-5 pb-12 space-y-5">

        {/* ── FOTO ───────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white border border-gray-100 shadow-sm py-6">
          <div className="relative">
            <div className={`h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg flex items-center justify-center ${fotoPreview ? '' : colorePerCategoria(valori.categoria as CategoriaAnimale)}`}>
              {fotoPreview
                ? <img src={fotoPreview} alt="Anteprima" className="h-full w-full object-cover" />
                : <span className="text-6xl leading-none">{categoriaSelezionata?.icona ?? '🐾'}</span>
              }
            </div>
            <label
              htmlFor="foto"
              className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-amber-500 shadow-md active:bg-amber-600"
            >
              <Camera size={16} strokeWidth={2.2} className="text-white" />
            </label>
          </div>
          <p className="text-xs text-gray-400">Tocca la fotocamera per aggiungere una foto</p>
          <input
            id="foto"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={isSubmitting}
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

        {/* ── CAMPI PRINCIPALI ───────────────────────────────────────── */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-5 py-5 space-y-5">

          <CampoForm label="Nome" required errore={erroriForm.nome}>
            <Input
              id="nome"
              placeholder="Il nome del tuo animale"
              value={valori.nome}
              onChange={e => setValue('nome', e.target.value)}
              disabled={isSubmitting}
              className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
            />
          </CampoForm>

          {speciePresentate(valori.categoria as CategoriaAnimale) && (
            <CampoForm label="Specie" required errore={erroriForm.specie}>
              <Input
                id="specie"
                placeholder={specieSuggerita(valori.categoria as CategoriaAnimale)}
                value={valori.specie}
                onChange={e => setValue('specie', e.target.value)}
                disabled={isSubmitting}
                className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
              />
            </CampoForm>
          )}

        </div>

        {/* ── DETTAGLI OPZIONALI ─────────────────────────────────────── */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setDettagliAperti(v => !v)}
            className="flex w-full items-center justify-between px-5 py-4"
          >
            <span className="text-sm font-bold text-gray-700">Altri dettagli</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
              <span>{dettagliAperti ? 'Nascondi' : 'Mostra'}</span>
              {dettagliAperti
                ? <ChevronUp size={16} strokeWidth={2.5} />
                : <ChevronDown size={16} strokeWidth={2.5} />
              }
            </div>
          </button>

          {dettagliAperti && (
            <div className="border-t border-gray-100 px-5 py-5 space-y-5">

              <CampoForm label="Razza" opzionale>
                <Input
                  id="razza"
                  placeholder="Razza o varietà"
                  value={valori.razza ?? ''}
                  onChange={e => setValue('razza', e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                />
              </CampoForm>

              <CampoForm label="Sesso" opzionale>
                <Select
                  value={valori.sesso ?? 'non_specificato'}
                  onValueChange={v => setValue('sesso', v)}
                  disabled={isSubmitting}
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

              <CampoForm label="Data di nascita" opzionale>
                <Input
                  id="data_nascita"
                  type="date"
                  value={valori.data_nascita ?? ''}
                  onChange={e => setValue('data_nascita', e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                />
              </CampoForm>

              <CampoForm label="Peso in kg" opzionale>
                <Input
                  id="peso"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="es. 4.250"
                  value={valori.peso ?? ''}
                  onChange={e => setValue('peso', e.target.value === '' ? undefined : Number(e.target.value))}
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  rows={3}
                  className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base"
                />
              </CampoForm>

            </div>
          )}
        </div>

        {/* ── ERRORE SERVER ──────────────────────────────────────────── */}
        {erroreSrv && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm font-medium text-red-600">{erroreSrv}</p>
          </div>
        )}

        {/* ── SUBMIT ─────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? 'Salvataggio in corso...' : `Salva ${categoriaSelezionata?.label.toLowerCase() ?? 'animale'}`}
        </button>

      </form>
    </div>
  )
}