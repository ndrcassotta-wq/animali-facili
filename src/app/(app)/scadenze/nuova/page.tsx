'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { scadenzaSchema } from '@/lib/utils/validation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AnimaleSelect } from '@/components/scadenze/AnimaleSelect'
import type { Database } from '@/lib/types/database.types'

type FormValori = z.infer<typeof scadenzaSchema>
type ScadenzaInsert = Database['public']['Tables']['scadenze']['Insert']

const tipiScadenza = [
  { valore: 'visita',                     label: 'Visita' },
  { valore: 'terapia',                    label: 'Terapia' },
  { valore: 'controllo',                  label: 'Controllo' },
  { valore: 'manutenzione_habitat',       label: 'Manutenzione habitat' },
  { valore: 'alimentazione_integrazione', label: 'Alimentazione / Integrazione' },
  { valore: 'altro',                      label: 'Altro' },
]

const frequenze = [
  { valore: 'nessuna',     label: 'Non ripetere' },
  { valore: 'settimanale', label: 'Settimanale' },
  { valore: 'mensile',     label: 'Mensile' },
  { valore: 'trimestrale', label: 'Trimestrale' },
  { valore: 'semestrale',  label: 'Semestrale' },
  { valore: 'annuale',     label: 'Annuale' },
]

const valoriIniziali: FormValori = {
  titolo:           '',
  tipo:             'visita',
  data:             '',
  frequenza:        'nessuna',
  note:             '',
  notifiche_attive: false,
}

export default function NuovaScadenzaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const animaleIdPreselezionato = searchParams.get('animale_id') ?? ''

  const [animaleId, setAnimaleId] = useState(animaleIdPreselezionato)
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [valori, setValori] = useState<FormValori>(valoriIniziali)
  const [erroriForm, setErroriForm] = useState<Partial<Record<keyof FormValori, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setValue(field: keyof FormValori, value: unknown) {
    setValori(prev => ({ ...prev, [field]: value }))
    setErroriForm(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): FormValori | null {
    const result = scadenzaSchema.safeParse(valori)
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
    const data = validate()
    if (!data) return

    setIsSubmitting(true)
    const supabase = createClient()

    const payload: ScadenzaInsert = {
      animale_id:       animaleId,
      titolo:           data.titolo,
      tipo:             data.tipo,
      data:             data.data,
      frequenza:        (data.frequenza ?? 'nessuna') as ScadenzaInsert['frequenza'],
      notifiche_attive: data.notifiche_attive,
      note:             data.note || null,
      stato:            'attiva',
    }

    const { error } = await supabase.from('scadenze').insert(payload)
    setIsSubmitting(false)

    if (error) { setErroreSrv('Errore durante il salvataggio. Riprova.'); return }

    router.push(
      animaleIdPreselezionato
        ? `/animali/${animaleId}?tab=scadenze`
        : '/scadenze'
    )
  }

  return (
    <div>
      <PageHeader titolo="Nuova scadenza" backHref="/scadenze" />
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
            placeholder="es. Visita annuale, Vaccino antirabbia…"
            value={valori.titolo}
            onChange={e => setValue('titolo', e.target.value)}
            disabled={isSubmitting}
          />
          {erroriForm.titolo && <p className="text-xs text-destructive">{erroriForm.titolo}</p>}
        </div>

        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select
            value={valori.tipo}
            onValueChange={v => setValue('tipo', v)}
            disabled={isSubmitting}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {tipiScadenza.map(t => (
                <SelectItem key={t.valore} value={t.valore}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label>Ripetizione</Label>
          <Select
            value={valori.frequenza ?? 'nessuna'}
            onValueChange={v => setValue('frequenza', v)}
            disabled={isSubmitting}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {frequenze.map(f => (
                <SelectItem key={f.valore} value={f.valore}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="note">
            Note <span className="text-xs text-muted-foreground">(opzionale)</span>
          </Label>
          <Textarea
            id="note"
            placeholder="Informazioni aggiuntive"
            value={valori.note ?? ''}
            onChange={e => setValue('note', e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        {erroreSrv && <p className="text-sm text-destructive text-center">{erroreSrv}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Salvataggio...' : 'Salva scadenza'}
        </Button>

      </form>
    </div>
  )
}