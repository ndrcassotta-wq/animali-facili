'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import type { Impegno } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'

type ImpegnoUpdate = Database['public']['Tables']['impegni']['Update']
type TipoImpegno = NonNullable<ImpegnoUpdate['tipo']>
type FrequenzaImpegno = NonNullable<ImpegnoUpdate['frequenza']>

const tipi: { valore: TipoImpegno; label: string }[] = [
  { valore: 'visita',        label: 'Visita' },
  { valore: 'controllo',     label: 'Controllo' },
  { valore: 'vaccinazione',  label: 'Vaccinazione' },
  { valore: 'toelettatura',  label: 'Toelettatura' },
  { valore: 'terapia',       label: 'Terapia' },
  { valore: 'addestramento', label: 'Addestramento' },
  { valore: 'altro',         label: 'Altro' },
]

const frequenze: { valore: FrequenzaImpegno; label: string }[] = [
  { valore: 'nessuna', label: 'Non ripetere' },
  { valore: 'settimanale', label: 'Settimanale' },
  { valore: 'mensile', label: 'Mensile' },
  { valore: 'trimestrale', label: 'Trimestrale' },
  { valore: 'semestrale', label: 'Semestrale' },
  { valore: 'annuale', label: 'Annuale' },
]

const titoloDefault: Record<TipoImpegno, string> = {
  visita:        'Visita',
  controllo:     'Controllo',
  vaccinazione:  'Vaccinazione',
  toelettatura:  'Toelettatura',
  terapia:       'Terapia',
  addestramento: 'Addestramento',
  compleanno:    'Compleanno',
  altro:         'Altro',
}

export function ModificaImpegnoForm({ impegno }: { impegno: Impegno }) {
  const router = useRouter()
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoImpegno>(impegno.tipo)
  const [data, setData] = useState(impegno.data)
  const [ora, setOra] = useState(impegno.ora ?? '')
  const [frequenza, setFrequenza] = useState<FrequenzaImpegno>(
    impegno.frequenza
  )
  const [note, setNote] = useState(impegno.note ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)

    if (!data) {
      setErroreSrv('La data è obbligatoria.')
      return
    }

    const payload: ImpegnoUpdate = {
      titolo: titoloDefault[tipo],
      tipo,
      data,
      ora: ora.trim() || null,
      frequenza,
      note: note.trim() || null,
    }

    setIsSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('impegni')
      .update(payload)
      .eq('id', impegno.id)

    setIsSubmitting(false)

    if (error) {
      setErroreSrv('Errore durante il salvataggio. Riprova.')
      return
    }

    router.push(`/impegni/${impegno.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
      <div className="space-y-1">
        <Label>Tipo</Label>
        <Select
          value={tipo}
          onValueChange={(v) => setTipo(v as TipoImpegno)}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tipi.map((t) => (
              <SelectItem key={t.valore} value={t.valore}>
                {t.label}
              </SelectItem>
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
          value={data}
          onChange={(e) => setData(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="ora">
          Ora <span className="text-xs text-muted-foreground">(opzionale)</span>
        </Label>
        <Input
          id="ora"
          type="time"
          value={ora}
          onChange={(e) => setOra(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <Label>Ripetizione</Label>
        <Select
          value={frequenza}
          onValueChange={(v) => setFrequenza(v as FrequenzaImpegno)}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frequenze.map((f) => (
              <SelectItem key={f.valore} value={f.valore}>
                {f.label}
              </SelectItem>
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
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      {erroreSrv && (
        <p className="text-center text-sm text-destructive">{erroreSrv}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
      </Button>
    </form>
  )
}