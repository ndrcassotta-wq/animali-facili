'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { eventoSchema } from '@/lib/utils/validation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Database } from '@/lib/types/database.types'

type FormValori = z.infer<typeof eventoSchema>
type EventoInsert = Database['public']['Tables']['eventi']['Insert']

const tipiEvento = [
  { valore: 'visita',             label: 'Visita' },
  { valore: 'trattamento',        label: 'Trattamento' },
  { valore: 'controllo',          label: 'Controllo' },
  { valore: 'aggiornamento_peso', label: 'Aggiornamento peso' },
  { valore: 'analisi_esame',      label: 'Analisi / Esame' },
  { valore: 'nota',               label: 'Nota' },
  { valore: 'altro',              label: 'Altro' },
]

const oggi = new Date().toISOString().split('T')[0]

const valoriIniziali: FormValori = {
  tipo:        'nota',
  titolo:      '',
  data:        oggi,
  descrizione: '',
}

export default function NuovoEventoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [valori, setValori] = useState<FormValori>(valoriIniziali)
  const [erroriForm, setErroriForm] = useState<Partial<Record<keyof FormValori, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setValue(field: keyof FormValori, value: unknown) {
    setValori(prev => ({ ...prev, [field]: value }))
    setErroriForm(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): FormValori | null {
    const result = eventoSchema.safeParse(valori)
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
    const data = validate()
    if (!data) return

    setIsSubmitting(true)
    const supabase = createClient()

    const payload: EventoInsert = {
      animale_id:  id,
      tipo:        data.tipo,
      titolo:      data.titolo || null,
      data:        data.data,
      descrizione: data.descrizione || null,
    }

    const { error } = await supabase.from('eventi').insert(payload)
    setIsSubmitting(false)

    if (error) { setErroreSrv('Errore durante il salvataggio. Riprova.'); return }

    router.push(`/animali/${id}?tab=eventi`)
  }

  return (
    <div>
      <PageHeader
        titolo="Nuovo evento"
        backHref={`/animali/${id}?tab=eventi`}
      />
      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">

        <div className="space-y-1">
          <Label>
            Tipo <span className="text-destructive">*</span>
          </Label>
          <Select
            value={valori.tipo}
            onValueChange={v => setValue('tipo', v)}
            disabled={isSubmitting}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {tipiEvento.map(t => (
                <SelectItem key={t.valore} value={t.valore}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="titolo">
            Titolo <span className="text-xs text-muted-foreground">(opzionale)</span>
          </Label>
          <Input
            id="titolo"
            placeholder="es. Visita annuale Dr. Rossi"
            value={valori.titolo ?? ''}
            onChange={e => setValue('titolo', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="data">
            Data <span className="text-destructive">*</span>
          </Label>
          <Input
            id="data"
            type="date"
            value={valori.data}
            onChange={e => setValue('data', e.target.value)}
            disabled={isSubmitting}
          />
          {erroriForm.data && <p className="text-xs text-destructive">{erroriForm.data}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="descrizione">
            Descrizione <span className="text-xs text-muted-foreground">(opzionale)</span>
          </Label>
          <Textarea
            id="descrizione"
            placeholder="Note sull'evento"
            value={valori.descrizione ?? ''}
            onChange={e => setValue('descrizione', e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        {erroreSrv && <p className="text-sm text-destructive text-center">{erroreSrv}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Salvataggio...' : 'Salva evento'}
        </Button>

      </form>
    </div>
  )
}