'use client'

import { useMemo, useState } from 'react'
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
import type { Animale } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'
import { ArrowLeft, Camera, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CropFoto } from '@/components/ui/CropFoto'

type FormValori = z.infer<typeof animaleSchema>
type AnimaleUpdate = Database['public']['Tables']['animali']['Update']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']

const BUCKET_FOTO_ANIMALI = 'foto-animali'
const MAX_FOTO_SIZE_MB = 10
const MAX_FOTO_SIZE_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024

const metaCampi: Partial<Record<string, { label: string; chiave: string }>> = {
  cani:              { label: 'Taglia',        chiave: 'taglia' },
  pesci:             { label: 'Tipo acqua',    chiave: 'tipo_acqua' },
  rettili:           { label: 'Tipo terrario', chiave: 'tipo_terrario' },
  uccelli:           { label: 'Tipo gabbia',   chiave: 'tipo_gabbia' },
  piccoli_mammiferi: { label: 'Tipo habitat',  chiave: 'tipo_habitat' },
}

const iconaCategoria: Record<string, string> = {
  cani: '🐕', gatti: '🐈', pesci: '🐟', uccelli: '🦜',
  rettili: '🦎', piccoli_mammiferi: '🐹', altri_animali: '🐾',
}

const coloreCategoria: Record<string, string> = {
  cani: 'bg-amber-100', gatti: 'bg-orange-100', pesci: 'bg-sky-100',
  uccelli: 'bg-lime-100', rettili: 'bg-green-100',
  piccoli_mammiferi: 'bg-rose-100', altri_animali: 'bg-violet-100',
}

function getEstensioneFile(file: File) {
  const nome = file.name.split('.')
  return nome[nome.length - 1]?.toLowerCase() || 'jpg'
}

function prossimCompleanno(dataNascita: string): string {
  const nascita = new Date(dataNascita)
  const oggi = new Date()
  const anno = oggi.getFullYear()
  const candidato = new Date(anno, nascita.getMonth(), nascita.getDate())
  if (candidato < oggi) candidato.setFullYear(anno + 1)
  return candidato.toISOString().split('T')[0]
}

function speciePresentate(categoria: string): boolean {
  return categoria !== 'cani' && categoria !== 'gatti'
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

export function ModificaAnimaleForm({ animale }: { animale: Animale }) {
  const router = useRouter()

  const [erroreSrv,      setErroreSrv]      = useState<string | null>(null)
  const [isSubmitting,   setIsSubmitting]   = useState(false)
  const [fotoFile,       setFotoFile]       = useState<File | null>(null)
  const [cropSrc,        setCropSrc]        = useState<string | null>(null)
  const [cropNome,       setCropNome]       = useState<string>('')
  const [dettagliAperti, setDettagliAperti] = useState(false)

  const metaEsistente = animale.meta_categoria as Record<string, string> | null
  const metaCampo     = metaCampi[animale.categoria]

  const [metaValore, setMetaValore] = useState(
    metaCampo ? (metaEsistente?.[metaCampo.chiave] ?? '') : ''
  )

  const [valori, setValori] = useState<FormValori>({
    nome:         animale.nome,
    categoria:    animale.categoria,
    specie:       animale.specie,
    razza:        animale.razza ?? '',
    sesso:        animale.sesso ?? 'non_specificato',
    data_nascita: animale.data_nascita ?? '',
    peso:         animale.peso ?? undefined,
    note:         animale.note ?? '',
  })

  const [erroriForm, setErroriForm] = useState<Partial<Record<keyof FormValori, string>>>({})

  const previewFoto = useMemo(() => {
    if (fotoFile) return URL.createObjectURL(fotoFile)
    return animale.foto_url ?? null
  }, [fotoFile, animale.foto_url])

  function setValue(field: keyof FormValori, value: unknown) {
    setValori(prev => ({ ...prev, [field]: value }))
    setErroriForm(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): FormValori | null {
    const valoriDaValidare = { ...valori }
    if (!speciePresentate(animale.categoria)) {
      valoriDaValidare.specie = animale.categoria === 'cani' ? 'Cane' : 'Gatto'
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

  async function uploadFotoSePresente() {
    if (!fotoFile) return animale.foto_url ?? null
    const supabase = createClient()
    const estensione = getEstensioneFile(fotoFile)
    const filePath = `animali/${animale.id}/foto-${Date.now()}.${estensione}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_FOTO_ANIMALI)
      .upload(filePath, fotoFile, { cacheControl: '3600', upsert: true, contentType: fotoFile.type || undefined })
    if (uploadError) throw new Error('Upload foto non riuscito.')
    const { data } = supabase.storage.from(BUCKET_FOTO_ANIMALI).getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)

    const data = validate()
    if (!data) return

    setIsSubmitting(true)

    try {
      const fotoUrl = await uploadFotoSePresente()
      const meta = metaCampo && metaValore ? { [metaCampo.chiave]: metaValore } : null
      const dataNascita = data.data_nascita || null

      const payload: AnimaleUpdate = {
        nome:           data.nome,
        specie:         data.specie ?? '',
        razza:          data.razza || null,
        sesso:          data.sesso ?? 'non_specificato',
        data_nascita:   dataNascita,
        peso:           data.peso ?? null,
        note:           data.note || null,
        meta_categoria: meta,
        foto_url:       fotoUrl,
      }

      const supabase = createClient()
      const { error } = await supabase
        .from('animali')
        .update(payload)
        .eq('id', animale.id)

      if (error) throw new Error('Errore durante il salvataggio.')

      if (dataNascita) {
        const { data: esistente } = await supabase
          .from('impegni')
          .select('id')
          .eq('animale_id', animale.id)
          .eq('tipo', 'compleanno')
          .single()

        const nuovaData = prossimCompleanno(dataNascita)

        if (esistente) {
          await supabase
            .from('impegni')
            .update({ data: nuovaData, titolo: 'Compleanno' })
            .eq('id', esistente.id)
        } else {
          const impegnoCompleanno: ImpegnoInsert = {
            animale_id:       animale.id,
            titolo:           'Compleanno',
            tipo:             'compleanno',
            data:             nuovaData,
            frequenza:        'annuale',
            notifiche_attive: true,
            stato:            'programmato',
            note:             `Compleanno di ${data.nome}`,
          }
          await supabase.from('impegni').insert(impegnoCompleanno)
        }
      } else {
        await supabase
          .from('impegni')
          .delete()
          .eq('animale_id', animale.id)
          .eq('tipo', 'compleanno')
      }

      router.push(`/animali/${animale.id}`)
      router.refresh()
    } catch (error) {
      setErroreSrv(error instanceof Error ? error.message : 'Errore durante il salvataggio. Riprova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>

      {/* Crop overlay */}
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

      {/* Header */}
      <header className="shrink-0 px-5 pt-10 pb-4">
        <button
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-2 text-gray-500 active:opacity-70"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
          <span className="text-sm font-semibold">Indietro</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl leading-none">
            {iconaCategoria[animale.categoria] ?? '🐾'}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Modifica {animale.nome}
            </h1>
            <p className="text-sm text-gray-400">
              {animale.categoria.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 px-5 pb-12 space-y-5">

        {/* ── FOTO ───────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white border border-gray-100 shadow-sm py-6">
          <div className="relative">
            <div className={cn(
              'h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg flex items-center justify-center',
              !previewFoto && (coloreCategoria[animale.categoria] ?? 'bg-gray-100')
            )}>
              {previewFoto
                ? <img src={previewFoto} alt={animale.nome} className="h-full w-full object-cover" />
                : <span className="text-5xl leading-none">{iconaCategoria[animale.categoria] ?? '🐾'}</span>
              }
            </div>
            <label
              htmlFor="foto"
              className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-amber-500 shadow-md active:bg-amber-600"
            >
              <Camera size={16} strokeWidth={2.2} className="text-white" />
            </label>
          </div>
          <p className="text-xs text-gray-400">Tocca la fotocamera per cambiare la foto</p>
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
              value={valori.nome}
              onChange={e => setValue('nome', e.target.value)}
              disabled={isSubmitting}
              className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
            />
          </CampoForm>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Categoria</Label>
            <div className="flex items-center gap-2 h-12 rounded-xl border border-gray-200 bg-gray-100 px-4">
              <span className="text-lg leading-none">{iconaCategoria[animale.categoria]}</span>
              <span className="text-base text-gray-500 capitalize">
                {animale.categoria.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-gray-400">La categoria non può essere modificata</p>
          </div>

          {speciePresentate(animale.categoria) && (
            <CampoForm label="Specie" required errore={erroriForm.specie}>
              <Input
                id="specie"
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
          {isSubmitting ? 'Salvataggio in corso...' : 'Salva modifiche'}
        </button>

      </form>
    </div>
  )
}