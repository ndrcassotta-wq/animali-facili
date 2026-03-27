'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { Camera, FileText, Images, Paperclip, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { documentoSchema } from '@/lib/utils/validation'
import { PageHeader } from '@/components/layout/PageHeader'
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

type FormValori = z.infer<typeof documentoSchema>
type DocumentoInsert = Database['public']['Tables']['documenti']['Insert']

const BUCKET_DOCUMENTI = 'documenti-animali'
const MAX_FILE_SIZE_MB = 20
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

const categorie = [
  { valore: 'ricetta', label: 'Ricetta' },
  { valore: 'referto', label: 'Referto' },
  { valore: 'analisi', label: 'Analisi' },
  { valore: 'certificato', label: 'Certificato' },
  { valore: 'documento_sanitario', label: 'Documento sanitario' },
  { valore: 'ricevuta', label: 'Ricevuta' },
  { valore: 'altro', label: 'Altro' },
]

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

export default function CaricaDocumentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const animaleIdPreselezionato = searchParams.get('animale_id') ?? ''

  const inputCameraRef = useRef<HTMLInputElement | null>(null)
  const inputFileRef = useRef<HTMLInputElement | null>(null)

  const [animaleId, setAnimaleId] = useState(animaleIdPreselezionato)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [valori, setValori] = useState<FormValori>(valoriIniziali)
  const [erroriForm, setErroriForm] = useState<
    Partial<Record<keyof FormValori, string>>
  >({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  function setValue(field: keyof FormValori, value: unknown) {
    setValori((prev) => ({ ...prev, [field]: value }))
    setErroriForm((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): FormValori | null {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)

    if (!animaleId) {
      setErroreSrv('Seleziona un animale.')
      return
    }

    if (!file) {
      setErroreSrv('Seleziona un file da caricare.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErroreSrv(`Il file non può superare ${MAX_FILE_SIZE_MB}MB.`)
      return
    }

    const data = validate()
    if (!data) return

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

  const backHref = animaleIdPreselezionato
    ? `/animali/${animaleIdPreselezionato}?tab=documenti`
    : '/documenti'

  return (
    <div>
      <PageHeader titolo="Carica documento" backHref={backHref} />

      <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
        <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Nuovo documento
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
              Carica un file o una foto
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Puoi scattare una foto del documento oppure scegliere un file già
              presente sul telefono.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => inputCameraRef.current?.click()}
              disabled={isSubmitting}
              className="flex items-center gap-3 rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] px-4 py-4 text-left transition-all active:scale-[0.99] disabled:opacity-60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
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
              className="flex items-center gap-3 rounded-2xl border border-[#EADFD3] bg-white px-4 py-4 text-left transition-all active:scale-[0.99] disabled:opacity-60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F4F5] text-slate-700 shadow-sm">
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

          {file && (
            <div className="mt-4 rounded-2xl border border-[#EADFD3] bg-[#FAFAFA] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
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
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#EADFD3] bg-white">
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

        <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="space-y-4">
            <AnimaleSelect
              valore={animaleId}
              onChange={setAnimaleId}
              disabled={!!animaleIdPreselezionato || isSubmitting}
            />

            <div className="space-y-1">
              <Label htmlFor="titolo">
                Titolo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titolo"
                placeholder="es. Visita 2024, Analisi sangue..."
                value={valori.titolo}
                onChange={(e) => setValue('titolo', e.target.value)}
                disabled={isSubmitting}
              />
              {erroriForm.titolo && (
                <p className="text-xs text-destructive">{erroriForm.titolo}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select
                value={valori.categoria}
                onValueChange={(v) => setValue('categoria', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorie.map((categoria) => (
                    <SelectItem key={categoria.valore} value={categoria.valore}>
                      {categoria.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="data_documento">
                Data documento{' '}
                <span className="text-xs text-muted-foreground">(opzionale)</span>
              </Label>
              <Input
                id="data_documento"
                type="date"
                value={valori.data_documento ?? ''}
                onChange={(e) => setValue('data_documento', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="note">
                Note{' '}
                <span className="text-xs text-muted-foreground">(opzionale)</span>
              </Label>
              <Textarea
                id="note"
                placeholder="Note sul documento"
                value={valori.note ?? ''}
                onChange={(e) => setValue('note', e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>
        </div>

        {erroreSrv && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">{erroreSrv}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting || !file}>
          {isSubmitting ? 'Caricamento...' : 'Carica documento'}
        </Button>
      </form>
    </div>
  )
}