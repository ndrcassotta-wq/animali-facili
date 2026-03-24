'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AnimaleSelect } from '@/components/scadenze/AnimaleSelect'
import {
  programmaNotificaImpegno,
  richiediPermessoNotifiche,
  PREFERENZE_DEFAULT,
} from '@/hooks/useNotifiche'
import type { Database, PreferenzeNotifiche } from '@/lib/types/database.types'

type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']
type TipoImpegno = NonNullable<ImpegnoInsert['tipo']>
type FrequenzaImpegno = NonNullable<ImpegnoInsert['frequenza']>

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
  { valore: 'nessuna',     label: 'Non ripetere' },
  { valore: 'settimanale', label: 'Settimanale' },
  { valore: 'mensile',     label: 'Mensile' },
  { valore: 'trimestrale', label: 'Trimestrale' },
  { valore: 'semestrale',  label: 'Semestrale' },
  { valore: 'annuale',     label: 'Annuale' },
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

const oggi = new Date().toISOString().split('T')[0]

export default function NuovoImpegnoPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const animaleIdPreselezionato = searchParams.get('animale_id') ?? ''

  const [animaleId,    setAnimaleId]    = useState(animaleIdPreselezionato)
  const [tipo,         setTipo]         = useState<TipoImpegno>('visita')
  const [data,         setData]         = useState(oggi)
  const [ora,          setOra]          = useState('')
  const [frequenza,    setFrequenza]    = useState<FrequenzaImpegno>('nessuna')
  const [note,         setNote]         = useState('')
  const [erroreSrv,    setErroreSrv]    = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)

    if (!animaleId) { setErroreSrv('Seleziona un animale.'); return }
    if (!data)      { setErroreSrv('La data è obbligatoria.'); return }

    setIsSubmitting(true)
    const supabase = createClient()

    // Carica preferenze notifiche utente
    const { data: { user } } = await supabase.auth.getUser()
    let preferenze: PreferenzeNotifiche = PREFERENZE_DEFAULT
    if (user) {
      const { data: profilo } = await supabase
        .from('profili')
        .select('preferenze_notifiche')
        .eq('id', user.id)
        .single()
      if (profilo?.preferenze_notifiche) {
        preferenze = profilo.preferenze_notifiche as PreferenzeNotifiche
      }
    }

    // Carica nome animale per la notifica
    const { data: animaleData } = await supabase
      .from('animali')
      .select('nome')
      .eq('id', animaleId)
      .single()
    const animaleNome = animaleData?.nome ?? ''

    const payload: ImpegnoInsert = {
      animale_id:       animaleId,
      titolo:           titoloDefault[tipo],
      tipo,
      data,
      ora:              ora.trim() || null,
      frequenza,
      notifiche_attive: preferenze.attive && preferenze.tipi_abilitati.includes(tipo),
      stato:            'programmato',
      note:             note.trim() || null,
    }

    const { data: nuovoImpegno, error } = await supabase
      .from('impegni')
      .insert(payload)
      .select('id')
      .single()

    if (error || !nuovoImpegno) {
      setErroreSrv('Errore durante il salvataggio. Riprova.')
      setIsSubmitting(false)
      return
    }

    // Programma notifica automaticamente se abilitata
    if (preferenze.attive && preferenze.tipi_abilitati.includes(tipo)) {
      try {
        const permesso = await richiediPermessoNotifiche()
        if (permesso) {
          await programmaNotificaImpegno({
            id:          nuovoImpegno.id,
            titolo:      titoloDefault[tipo],
            animaleNome,
            data,
            tipo,
            preferenze,
          })
        }
      } catch {
        // Non blocchiamo il salvataggio se la notifica fallisce
        console.error('Errore programmazione notifica')
      }
    }

    setIsSubmitting(false)
    router.push(
      animaleIdPreselezionato
        ? `/animali/${animaleId}?tab=impegni`
        : '/impegni'
    )
  }

  return (
    <div>
      <PageHeader titolo="Nuovo impegno" backHref="/impegni" />
      <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">

        <AnimaleSelect
          valore={animaleId}
          onChange={setAnimaleId}
          disabled={!!animaleIdPreselezionato || isSubmitting}
        />

        <div className="space-y-1">
          <Label>
            Tipo <span className="text-destructive">*</span>
          </Label>
          <Select value={tipo} onValueChange={v => setTipo(v as TipoImpegno)} disabled={isSubmitting}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {tipi.map(t => (
                <SelectItem key={t.valore} value={t.valore}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="data">
              Data <span className="text-destructive">*</span>
            </Label>
            <Input
              id="data"
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
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
              onChange={e => setOra(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Ripetizione</Label>
          <Select value={frequenza} onValueChange={v => setFrequenza(v as FrequenzaImpegno)} disabled={isSubmitting}>
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
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        {erroreSrv && (
          <p className="text-center text-sm text-destructive">{erroreSrv}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Salvataggio...' : 'Salva impegno'}
        </Button>

      </form>
    </div>
  )
}