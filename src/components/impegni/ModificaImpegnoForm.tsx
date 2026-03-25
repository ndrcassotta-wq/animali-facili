'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Impegno } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type ImpegnoUpdate = Database['public']['Tables']['impegni']['Update']
type TipoImpegno = NonNullable<ImpegnoUpdate['tipo']>
type FrequenzaImpegno = NonNullable<ImpegnoUpdate['frequenza']>

// Terapia rimossa — ha la sua sezione dedicata
const tipi: { valore: TipoImpegno; label: string; icona: string }[] = [
  { valore: 'visita',        label: 'Visita',        icona: '🩺' },
  { valore: 'controllo',     label: 'Controllo',     icona: '🔍' },
  { valore: 'vaccinazione',  label: 'Vaccinazione',  icona: '💉' },
  { valore: 'toelettatura',  label: 'Toelettatura',  icona: '✂️' },
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

function CampoForm({
  label, required, opzionale, errore, children,
}: {
  label: string; required?: boolean; opzionale?: boolean
  errore?: string; children: React.ReactNode
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

export function ModificaImpegnoForm({ impegno }: { impegno: Impegno }) {
  const router = useRouter()

  const [tipo,         setTipo]         = useState<TipoImpegno>(
    // Se il tipo salvato è 'terapia' (legacy), fallback su 'altro'
    tipi.find(t => t.valore === impegno.tipo) ? impegno.tipo as TipoImpegno : 'altro'
  )
  const [data,         setData]         = useState(impegno.data)
  const [ora,          setOra]          = useState(impegno.ora ?? '')
  const [frequenza,    setFrequenza]    = useState<FrequenzaImpegno>(impegno.frequenza)
  const [note,         setNote]         = useState(impegno.note ?? '')
  const [erroreSrv,    setErroreSrv]    = useState<string | null>(null)
  const [erroreData,   setErroreData]   = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tipoSelezionato = tipi.find(t => t.valore === tipo)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)
    if (!data) { setErroreData('La data è obbligatoria.'); return }

    setIsSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('impegni')
      .update({
        titolo:    titoloDefault[tipo],
        tipo,
        data,
        ora:       ora.trim() || null,
        frequenza,
        note:      note.trim() || null,
      })
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
        <div className="flex items-center gap-3">
          <span className="text-4xl leading-none">{tipoSelezionato?.icona ?? '📌'}</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Modifica impegno
            </h1>
            <p className="text-sm text-gray-400">Aggiorna i dettagli</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 px-5 pb-12 space-y-5">

        {/* Tipo — griglia 2 colonne */}
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-700">Tipo</p>
          <div className="grid grid-cols-2 gap-3">
            {tipi.map(t => (
              <button
                key={t.valore}
                type="button"
                onClick={() => setTipo(t.valore)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-3xl border-2 py-5 px-2 text-center transition-all active:scale-95',
                  tipo === t.valore
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-100 bg-white'
                )}
              >
                <span className="text-3xl leading-none">{t.icona}</span>
                <span className={cn(
                  'text-sm font-extrabold',
                  tipo === t.valore ? 'text-amber-700' : 'text-gray-600'
                )}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Data + ora + frequenza + note */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-5 py-5 space-y-5">

          <CampoForm label="Data" required errore={erroreData}>
            <Input
              type="date"
              value={data}
              onChange={e => { setData(e.target.value); setErroreData('') }}
              disabled={isSubmitting}
              className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
            />
          </CampoForm>

          <CampoForm label="Ora" opzionale>
            <Input
              type="time"
              value={ora}
              onChange={e => setOra(e.target.value)}
              disabled={isSubmitting}
              className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
            />
          </CampoForm>

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

          <CampoForm label="Note" opzionale>
            <Textarea
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
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {isSubmitting ? 'Salvataggio in corso...' : 'Salva modifiche'}
        </button>

      </form>
    </div>
  )
}