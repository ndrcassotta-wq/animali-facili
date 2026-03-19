'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { documentoSchema } from '@/lib/utils/validation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputFile } from '@/components/ui/InputFile'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AnimaleSelect } from '@/components/scadenze/AnimaleSelect'
import type { Database } from '@/lib/types/database.types'

type FormValori = z.infer<typeof documentoSchema>
type DocumentoInsert = Database['public']['Tables']['documenti']['Insert']

const categorie = [
  { valore: 'ricetta',             label: 'Ricetta' },
  { valore: 'referto',             label: 'Referto' },
  { valore: 'analisi',             label: 'Analisi' },
  { valore: 'certificato',         label: 'Certificato' },
  { valore: 'documento_sanitario', label: 'Documento sanitario' },
  { valore: 'ricevuta',            label: 'Ricevuta' },
  { valore: 'altro',               label: 'Altro' },
]

const valoriIniziali: FormValori = {
  titolo:         '',
  categoria:      'altro',
  data_documento: '',
  note:           '',
}

export default function CaricaDocumentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const animaleIdPreselezionato = searchParams.get('animale_id') ?? ''

  const [animaleId, setAnimaleId] = useState(animaleIdPreselezionato)
  const [file, setFile] = useState<File | null>(null)
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [valori, setValori] = useState<FormValori>(valoriIniziali)
  const [erroriForm, setErroriForm] = useState<Partial<Record<keyof FormValori, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setValue(field: keyof FormValori, value: unknown) {
    setValori(prev => ({ ...prev, [field]: value }))
    setErroriForm(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): FormValori | null {
    const result = documentoSchema.safeParse(valori)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)
    if (!animaleId) { setErroreSrv('Seleziona un animale.'); return }
    if (!file) { setErroreSrv('Seleziona un file da caricare.'); return }
    const data = validate()
    if (!data) return

    setIsSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Path: {user_id}/{animale_id}/{timestamp}_{nome_file_sanitizzato}
    const nomeSanitizzato = file.name.replace(/[^a-z0-9.\-_]/gi, '_')
    const filePath = `${user.id}/${animaleId}/${Date.now()}_${nomeSanitizzato}`

    // Step 1: upload file
    const { error: uploadError } = await supabase.storage
      .from('documenti-animali')
      .upload(filePath, file)

    if (uploadError) {
      setErroreSrv('Errore durante il caricamento del file. Riprova.')
      setIsSubmitting(false)
      return
    }

    // Step 2: salva path nel DB
    const payload: DocumentoInsert = {
      animale_id:     animaleId,
      titolo:         data.titolo,
      categoria:      data.categoria,
      data_documento: data.data_documento || null,
      file_url:       filePath,
      note:           data.note || null,
    }

    const { error: dbError } = await supabase
      .from('documenti')
      .insert(payload)

    // Step 3: rollback se DB fallisce
    if (dbError) {
      await supabase.storage
        .from('documenti-animali')
        .remove([filePath])
      setErroreSrv('Errore durante il salvataggio. Riprova.')
      setIsSubmitting(false)
      return
    }

    router.push(
      animaleIdPreselezionato
        ? `/animali/${animaleId}?tab=documenti`
        : '/documenti'
    )
  }

  return (
    <div>
      <PageHeader titolo="Carica documento" backHref="/documenti" />
      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">

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
            placeholder="es. Visita 2024, Analisi sangue…"
            value={valori.titolo}
            onChange={e => setValue('titolo', e.target.value)}
            disabled={isSubmitting}
          />
          {erroriForm.titolo && <p className="text-xs text-destructive">{erroriForm.titolo}</p>}
        </div>

        <div className="space-y-1">
          <Label>Categoria</Label>
          <Select
            value={valori.categoria}
            onValueChange={v => setValue('categoria', v)}
            disabled={isSubmitting}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categorie.map(c => (
                <SelectItem key={c.valore} value={c.valore}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="data_documento">
            Data documento <span className="text-xs text-muted-foreground">(opzionale)</span>
          </Label>
          <Input
            id="data_documento"
            type="date"
            value={valori.data_documento ?? ''}
            onChange={e => setValue('data_documento', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <InputFile
          id="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          capture={false}
          label="File"
          descrizione="Carica un documento o una foto del documento"
          onChange={setFile}
          fileSelezionato={file}
          disabled={isSubmitting}
        />

        <div className="space-y-1">
          <Label htmlFor="note">
            Note <span className="text-xs text-muted-foreground">(opzionale)</span>
          </Label>
          <Textarea
            id="note"
            placeholder="Note sul documento"
            value={valori.note ?? ''}
            onChange={e => setValue('note', e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        {erroreSrv && <p className="text-sm text-destructive text-center">{erroreSrv}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting || !file}>
          {isSubmitting ? 'Caricamento...' : 'Carica documento'}
        </Button>

      </form>
    </div>
  )
}