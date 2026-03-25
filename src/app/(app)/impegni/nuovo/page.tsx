'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']
type TipoImpegno = NonNullable<ImpegnoInsert['tipo']>
type FrequenzaImpegno = NonNullable<ImpegnoInsert['frequenza']>

const tipi: { valore: TipoImpegno; label: string; icona: string }[] = [
  { valore: 'visita',        label: 'Visita',        icona: '🩺' },
  { valore: 'controllo',     label: 'Controllo',     icona: '🔍' },
  { valore: 'vaccinazione',  label: 'Vaccinazione',  icona: '💉' },
  { valore: 'toelettatura',  label: 'Toelettatura',  icona: '✂️' },
  { valore: 'terapia',       label: 'Terapia',       icona: '💊' },
  { valore: 'addestramento', label: 'Addestramento', icona: '🎓' },
  { valore: 'altro',         label: 'Altro',         icona: '📌' },
]

const frequenze: { valore: FrequenzaImpegno; label: string }[] = [
  { valore: 'nessuna',     label: 'Non ripetere'  },
  { valore: 'settimanale', label: 'Settimanale'   },
  { valore: 'mensile',     label: 'Mensile'       },
  { valore: 'trimestrale', label: 'Trimestrale'   },
  { valore: 'semestrale',  label: 'Semestrale'    },
  { valore: 'annuale',     label: 'Annuale'       },
]

const titoloDefault: Record<TipoImpegno, string> = {
  visita: 'Visita', controllo: 'Controllo', vaccinazione: 'Vaccinazione',
  toelettatura: 'Toelettatura', terapia: 'Terapia', addestramento: 'Addestramento',
  compleanno: 'Compleanno', altro: 'Altro',
}

const oggi = new Date().toISOString().split('T')[0]

function CampoForm({
  label, required, opzionale, errore, children,
}: {
  label: string; required?: boolean; opzionale?: boolean; errore?: string; children: React.ReactNode
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

    if (preferenze.attive && preferenze.tipi_abilitati.includes(tipo)) {
      try {
        const permesso = await richiediPermessoNotifiche()
        if (permesso) {
          await programmaNotificaImpegno({
            id: nuovoImpegno.id, titolo: titoloDefault[tipo],
            animaleNome, data, tipo, preferenze,
          })
        }
      } catch {
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
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>

      {/* Header */}
      <header className="shrink-0 px-5 pt-10 pb-4">
        <button
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-2 text-gray-500 active:opacity-70"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
          <span className="text-sm font-semibold">Indietro</span>
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Nuovo impegno
        </h1>
        <p className="mt-0.5 text-sm text-gray-400">
          Aggiungi una visita, vaccino o appuntamento
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 px-5 pb-12 space-y-5">

        {/* Tipo impegno — griglia pill */}
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-700">
            Tipo <span className="text-red-400">*</span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            {tipi.map(t => (
              <button
                key={t.valore}
                type="button"
                onClick={() => setTipo(t.valore)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 px-1 text-center transition-all active:scale-95',
                  tipo === t.valore
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-100 bg-white'
                )}
              >
                <span className="text-2xl leading-none">{t.icona}</span>
                <span className={cn(
                  'text-[10px] font-bold leading-tight',
                  tipo === t.valore ? 'text-amber-700' : 'text-gray-500'
                )}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Animale + data + ora */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-5 py-5 space-y-5">

          {/* Animale */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">
              Animale <span className="text-red-400">*</span>
            </Label>
            <div className={animaleIdPreselezionato ? 'opacity-60 pointer-events-none' : ''}>
              <AnimaleSelect
                valore={animaleId}
                onChange={setAnimaleId}
                disabled={!!animaleIdPreselezionato || isSubmitting}
              />
            </div>
          </div>

          {/* Data */}
          <CampoForm label="Data" required>
            <Input
              id="data"
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              disabled={isSubmitting}
              className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
            />
          </CampoForm>

          {/* Ora */}
          <CampoForm label="Ora" opzionale>
            <Input
              id="ora"
              type="time"
              value={ora}
              onChange={e => setOra(e.target.value)}
              disabled={isSubmitting}
              className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
            />
          </CampoForm>

          {/* Frequenza */}
          <CampoForm label="Ripetizione" opzionale>
            <Select
              value={frequenza}
              onValueChange={v => setFrequenza(v as FrequenzaImpegno)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequenze.map(f => (
                  <SelectItem key={f.valore} value={f.valore}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CampoForm>

          {/* Note */}
          <CampoForm label="Note" opzionale>
            <Textarea
              id="note"
              placeholder="Informazioni aggiuntive"
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base"
            />
          </CampoForm>

        </div>

        {erroreSrv && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm font-medium text-red-600">{erroreSrv}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? 'Salvataggio in corso...' : 'Salva impegno'}
        </button>

      </form>
    </div>
  )
}