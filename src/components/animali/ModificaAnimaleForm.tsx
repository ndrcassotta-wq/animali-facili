// src/components/animali/ModificaAnimaleForm.tsx
'use client'

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
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
} from '@/components/ui/select'
import type { CategoriaAnimale } from '@/lib/types/app.types'
import type { Database } from '@/lib/types/database.types'
import type { Animale } from '@/lib/types/query.types'
import { ArrowLeft, Camera, Images } from 'lucide-react'
import { CropFoto } from '@/components/ui/CropFoto'
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'
import { SUGGERIMENTI_ANIMALE_PER_CATEGORIA } from '@/lib/utils/specieSuggerimenti'
import {
  cancellaNotificaImpegno,
  normalizzaPreferenzeNotifiche,
  programmaNotificaImpegno,
  richiediPermessoNotifiche,
} from '@/hooks/useNotifiche'

type FormValori = z.infer<typeof animaleSchema>
type AnimaleUpdate = Database['public']['Tables']['animali']['Update']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']

const BUCKET_FOTO_ANIMALI = 'foto-animali'
const MAX_FOTO_SIZE_MB = 10
const MAX_FOTO_SIZE_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024

const labelSesso: Record<string, string> = {
  maschio: 'Maschio',
  femmina: 'Femmina',
  non_specificato: 'Non specificato',
}

const CATEGORIE: { value: CategoriaAnimale; label: string }[] = [
  { value: 'cani', label: 'Cane' },
  { value: 'gatti', label: 'Gatto' },
  { value: 'pesci', label: 'Pesce' },
  { value: 'uccelli', label: 'Uccello' },
  { value: 'rettili', label: 'Rettile' },
  { value: 'piccoli_mammiferi', label: 'Piccolo mammifero' },
  { value: 'altri_animali', label: 'Altro animale' },
]

const metaCampi: Partial<
  Record<CategoriaAnimale, { label: string; chiave: string }>
> = {
  cani: { label: 'Taglia', chiave: 'taglia' },
  pesci: { label: 'Tipo acqua', chiave: 'tipo_acqua' },
  rettili: { label: 'Tipo terrario', chiave: 'tipo_terrario' },
  uccelli: { label: 'Tipo gabbia', chiave: 'tipo_gabbia' },
  piccoli_mammiferi: { label: 'Tipo habitat', chiave: 'tipo_habitat' },
}

const TAGLIE_ANIMALE = [
  { value: 'toy', label: 'Toy' },
  { value: 'piccola', label: 'Piccola' },
  { value: 'media', label: 'Media' },
  { value: 'grande', label: 'Grande' },
  { value: 'gigante', label: 'Gigante' },
]

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
    altri_animali: 'Altro animale',
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

export default function ModificaAnimaleForm({ animale }: { animale: Animale }) {
  const router = useRouter()

  const categoriaIniziale = animale.categoria as CategoriaAnimale

  const [valori, setValori] = useState<FormValori>({
    nome: animale.nome ?? '',
    categoria: categoriaIniziale,
    specie: animale.specie || animale.razza || '',
    razza: '',
    sesso: animale.sesso ?? 'non_specificato',
    data_nascita: animale.data_nascita ?? '',
    peso: animale.peso ?? undefined,
    note: animale.note ?? '',
  })

  const [erroriForm, setErroriForm] = useState<
    Partial<Record<keyof FormValori, string>>
  >({})
  const [metaValore, setMetaValore] = useState(() => {
    const metaCampo = metaCampi[categoriaIniziale]
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

  const categoriaCorrente = valori.categoria as CategoriaAnimale
  const categoriaLabel = getLabelCategoria(categoriaCorrente)
  const categoriaIcona = getIconaCategoria(categoriaCorrente)
  const metaCampo = metaCampi[categoriaCorrente]

  const fotoPreview = useMemo(() => {
    if (fotoFile) return URL.createObjectURL(fotoFile)
    return animale.foto_url ?? null
  }, [fotoFile, animale.foto_url])

  useEffect(() => {
    if (!fotoFile || !fotoPreview) return
    return () => URL.revokeObjectURL(fotoPreview)
  }, [fotoFile, fotoPreview])

  function setValue(field: keyof FormValori, value: unknown) {
    setValori((prev) => ({ ...prev, [field]: value }))
    setErroriForm((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleCategoriaChange(nuovaCategoria: CategoriaAnimale) {
    setValori((prev) => ({ ...prev, categoria: nuovaCategoria }))
    setErroriForm((prev) => ({ ...prev, specie: undefined }))

    const nuovaMeta = metaCampi[nuovaCategoria]
    const metaOriginale = animale.meta_categoria as Record<string, unknown> | null

    if (!nuovaMeta) {
      setMetaValore('')
      return
    }

    const valoreOriginale = metaOriginale?.[nuovaMeta.chiave]
    setMetaValore(typeof valoreOriginale === 'string' ? valoreOriginale : '')
  }

  function apriCropDaFile(file: File) {
    if (file.size > MAX_FOTO_SIZE_BYTES) {
      setErroreSrv(`La foto non può superare ${MAX_FOTO_SIZE_MB}MB.`)
      return
    }

    setErroreSrv(null)
    setCropNome(file.name)
    setCropSrc(URL.createObjectURL(file))
  }

  function handleSelezioneFoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (file) apriCropDaFile(file)
    event.target.value = ''
  }

  async function handleSubmit() {
    setErroreSrv(null)

    const nomePulito = valori.nome.trim()
    const campoPrincipalePulito = (valori.specie ?? '').trim()

    const nuoviErrori: Partial<Record<keyof FormValori, string>> = {}

    if (!nomePulito) nuoviErrori.nome = 'Il nome è obbligatorio'
    if (!campoPrincipalePulito) {
      nuoviErrori.specie = 'Questo campo è obbligatorio'
    }

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

      const peso =
        valori.peso === undefined || valori.peso === null || Number.isNaN(valori.peso)
          ? null
          : valori.peso

      const meta =
        metaCampo && metaValore.trim() !== ''
          ? { [metaCampo.chiave]: metaValore.trim() }
          : null

      const payload: AnimaleUpdate = {
        nome: nomePulito,
        categoria: valori.categoria,
        specie: campoPrincipalePulito,
        razza: null,
        sesso: valori.sesso ?? 'non_specificato',
        data_nascita: dataNascita,
        peso,
        note: valori.note?.trim() ? valori.note.trim() : null,
        foto_url: fotoUrl,
        meta_categoria: meta,
      }

      const { error } = await supabase
        .from('animali')
        .update(payload)
        .eq('id', animale.id)        

      if (error) {
        throw new Error(`Errore durante il salvataggio: ${error.message}`)
      }

      const dataNascitaPrecedente = animale.data_nascita ?? null
      const nomePrecedente = animale.nome ?? ''
      const dataNascitaCambiata = dataNascitaPrecedente !== dataNascita
      const nomeCambiato = nomePrecedente !== nomePulito

      if (dataNascitaCambiata || nomeCambiato) {
        const { data: compleannoEsistente, error: erroreCompleannoEsistente } =
          await supabase
            .from('impegni')
            .select('id')
            .eq('animale_id', animale.id)
            .eq('tipo', 'compleanno')
            .maybeSingle()

        if (erroreCompleannoEsistente) {
          throw new Error(
            `Errore durante il recupero del compleanno: ${erroreCompleannoEsistente.message}`
          )
        }

        if (!dataNascita) {
          if (compleannoEsistente) {
            const { error: erroreDeleteCompleanno } = await supabase
              .from('impegni')
              .delete()
              .eq('id', compleannoEsistente.id)

            if (erroreDeleteCompleanno) {
              throw new Error(
                `Errore durante la rimozione del compleanno: ${erroreDeleteCompleanno.message}`
              )
            }

            try {
              await cancellaNotificaImpegno(compleannoEsistente.id)
            } catch {
              console.warn('Notifica compleanno non cancellata')
            }
          }
        } else {
          const dataCompleanno = prossimoCompleanno(dataNascita)

          const payloadCompleanno: ImpegnoInsert = {
            animale_id: animale.id,
            titolo: 'Compleanno',
            tipo: 'compleanno',
            data: dataCompleanno,
            frequenza: 'annuale',
            notifiche_attive: true,
            stato: 'programmato',
            note: `Compleanno di ${nomePulito}`,
          }

          let compleannoId = compleannoEsistente?.id ?? null

          if (compleannoEsistente) {
            const { error: erroreUpdateCompleanno } = await supabase
              .from('impegni')
              .update({
                titolo: 'Compleanno',
                tipo: 'compleanno',
                data: dataCompleanno,
                frequenza: 'annuale',
                notifiche_attive: true,
                stato: 'programmato',
                note: `Compleanno di ${nomePulito}`,
              })
              .eq('id', compleannoEsistente.id)

            if (erroreUpdateCompleanno) {
              throw new Error(
                `Errore durante l'aggiornamento del compleanno: ${erroreUpdateCompleanno.message}`
              )
            }
          } else {
            const { data: nuovoCompleanno, error: erroreInsertCompleanno } =
              await supabase
                .from('impegni')
                .insert(payloadCompleanno)
                .select('id')
                .single()

            if (erroreInsertCompleanno || !nuovoCompleanno) {
              throw new Error(
                `Errore durante la creazione del compleanno: ${erroreInsertCompleanno?.message ?? 'sconosciuto'}`
              )
            }

            compleannoId = nuovoCompleanno.id
          }

          if (compleannoId) {
            const { data: profiloData } = await supabase
              .from('profili')
              .select('notifiche_attive, preferenze_notifiche')
              .eq('id', user.id)
              .maybeSingle()

            const preferenzeCompleanno = normalizzaPreferenzeNotifiche(
              profiloData?.preferenze_notifiche
                ? {
                    ...profiloData.preferenze_notifiche,
                    attive:
                      typeof profiloData.notifiche_attive === 'boolean'
                        ? profiloData.notifiche_attive
                        : profiloData.preferenze_notifiche.attive,
                  }
                : undefined
            )

            try {
              await cancellaNotificaImpegno(compleannoId)

              const permesso = await richiediPermessoNotifiche()

              if (permesso) {
                await programmaNotificaImpegno({
                  id: compleannoId,
                  titolo: 'Compleanno',
                  animaleNome: nomePulito,
                  data: dataCompleanno,
                  tipo: 'compleanno',
                  preferenze: preferenzeCompleanno,
                })
              }
            } catch {
              console.warn('Notifica compleanno non programmata')
            }
          }
        }
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

      <header className="sticky top-0 z-10 border-b border-black/5 bg-[#FDF8F3]/95 px-5 pt-10 pb-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(`/animali/${animale.id}`)}
            className="flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">Annulla</span>
          </button>

          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            Modifica animale
          </span>
        </div>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
        className="flex-1 px-5 pt-5 pb-8"
      >
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-3">
            <span className="text-3xl">{categoriaIcona}</span>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Modifica profilo
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            Aggiorna tutti i dati del tuo {categoriaLabel.toLowerCase()} in una
            sola schermata
          </p>
        </div>

        <div className="mb-4 rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div
                className={`flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-xl ${
                  fotoPreview ? '' : colorePerCategoria(categoriaCorrente)
                }`}
              >
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Anteprima foto animale"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-6xl leading-none">{categoriaIcona}</span>
                )}
              </div>

              <div className="absolute right-0 bottom-0 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 shadow-md">
                <Camera size={18} strokeWidth={2.2} className="text-white" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">
                {fotoPreview ? 'Foto aggiornata' : 'Nessuna foto caricata'}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Puoi usare fotocamera o galleria. Il crop resta attivo.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
              <label
                htmlFor="foto-camera"
                className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-700 active:opacity-80"
              >
                <Camera size={16} strokeWidth={2.2} />
                Fotocamera
              </label>

              <label
                htmlFor="foto-galleria"
                className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-700 active:opacity-80"
              >
                <Images size={16} strokeWidth={2.2} />
                Galleria
              </label>
            </div>

            <input
              id="foto-camera"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleSelezioneFoto}
            />

            <input
              id="foto-galleria"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSelezioneFoto}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <div className="space-y-5">
              <CampoForm label="Tipo / categoria" required>
                <Select
                  value={categoriaCorrente}
                  onValueChange={(value) =>
                    handleCategoriaChange(value as CategoriaAnimale)
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base">
                    <span>{getLabelCategoria(categoriaCorrente)}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIE.map((categoria) => (
                      <SelectItem key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CampoForm>

              <CampoForm label="Nome" required errore={erroriForm.nome}>
                <Input
                  id="nome"
                  placeholder={`Il nome del tuo ${categoriaLabel.toLowerCase()}`}
                  value={valori.nome}
                  onChange={(e) => setValue('nome', e.target.value)}
                  autoFocus
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                />
              </CampoForm>

              <CampoForm label="Data di nascita" opzionale>
                <Input
                  id="data_nascita"
                  type="date"
                  value={valori.data_nascita ?? ''}
                  onChange={(e) => setValue('data_nascita', e.target.value)}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                />
              </CampoForm>

              <CampoForm
                label={labelCampoPrincipale(categoriaCorrente)}
                required
                errore={erroriForm.specie}
              >
                <AutocompleteInput
                  id="specie"
                  placeholder={placeholderCampoPrincipale(categoriaCorrente)}
                  value={valori.specie}
                  onChange={(v) => setValue('specie', v)}
                  suggerimenti={
                    SUGGERIMENTI_ANIMALE_PER_CATEGORIA[categoriaCorrente] ?? []
                  }
                  disabled={isSubmitting}
                  className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base"
                />
              </CampoForm>

              <CampoForm label="Sesso" opzionale>
                <Select
                  value={valori.sesso ?? 'non_specificato'}
                  onValueChange={(value) => setValue('sesso', value)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base">
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

              <CampoForm label="Peso in kg" opzionale>
                <Input
                  id="peso"
                  type="number"
                  step="0.001"
                  min="0"
                  inputMode="decimal"
                  placeholder="es. 4.250"
                  value={valori.peso ?? ''}
                  onChange={(e) => {
                    const valore = e.target.value
                    setValue(
                      'peso',
                      valore === ''
                        ? undefined
                        : Number(valore.replace(',', '.'))
                    )
                  }}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                />
              </CampoForm>

              {metaCampo && (
                <CampoForm label={metaCampo.label} opzionale>
                  <div className="space-y-2">
                    {metaCampo.chiave === 'taglia' ? (
                      <>
                        <Select
                          value={metaValore}
                          onValueChange={(value) => setMetaValore(value ?? '')}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base">
                            <span>
                              {TAGLIE_ANIMALE.find(
                                (taglia) => taglia.value === metaValore
                              )?.label ?? 'Seleziona la taglia'}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {TAGLIE_ANIMALE.map((taglia) => (
                              <SelectItem key={taglia.value} value={taglia.value}>
                                {taglia.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {metaValore && (
                          <button
                            type="button"
                            onClick={() => setMetaValore('')}
                            className="text-xs font-semibold text-gray-400 underline underline-offset-2"
                          >
                            Rimuovi valore
                          </button>
                        )}
                      </>
                    ) : (
                      <Input
                        id="meta"
                        placeholder={`es. ${metaSuggerito(categoriaCorrente)}`}
                        value={metaValore}
                        onChange={(e) => setMetaValore(e.target.value)}
                        className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                      />
                    )}
                  </div>
                </CampoForm>
              )}

              <CampoForm label="Note" opzionale>
                <Textarea
                  id="note"
                  placeholder="Informazioni aggiuntive"
                  value={valori.note ?? ''}
                  onChange={(e) => setValue('note', e.target.value)}
                  rows={4}
                  className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base"
                />
              </CampoForm>
            </div>
          </div>

          {erroreSrv && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">{erroreSrv}</p>
            </div>
          )}

          <div className="pt-2 pb-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? 'Salvataggio in corso...' : 'Salva modifiche'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}