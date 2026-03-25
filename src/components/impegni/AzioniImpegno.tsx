'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cancellaNotificaImpegno } from '@/hooks/useNotifiche'
import { Check, X, Trash2, RotateCcw } from 'lucide-react'

type StatoImpegno = 'programmato' | 'completato' | 'annullato'

export function AzioniImpegno({
  impegnoId,
  statoAttuale,
}: {
  impegnoId: string
  statoAttuale: string
}) {
  const router = useRouter()
  const [caricamento, setCaricamento] = useState(false)

  async function aggiornaStato(nuovoStato: StatoImpegno) {
    setCaricamento(true)
    const supabase = createClient()
    await supabase.from('impegni').update({ stato: nuovoStato }).eq('id', impegnoId)
    if (nuovoStato === 'completato' || nuovoStato === 'annullato') {
      try { await cancellaNotificaImpegno(impegnoId) } catch {}
    }
    setCaricamento(false)
    router.refresh()
  }

  async function eliminaImpegno() {
    const conferma = window.confirm('Vuoi davvero eliminare questo impegno?')
    if (!conferma) return
    setCaricamento(true)
    const supabase = createClient()
    try { await cancellaNotificaImpegno(impegnoId) } catch {}
    await supabase.from('impegni').delete().eq('id', impegnoId)
    setCaricamento(false)
    router.push('/impegni')
    router.refresh()
  }

  if (statoAttuale === 'completato' || statoAttuale === 'annullato') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => aggiornaStato('programmato')}
          disabled={caricamento}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-700 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <RotateCcw size={16} strokeWidth={2.5} />
          Riporta a programmato
        </button>
        <button
          onClick={eliminaImpegno}
          disabled={caricamento}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-bold text-red-600 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <Trash2 size={16} strokeWidth={2.5} />
          Elimina impegno
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          onClick={() => aggiornaStato('completato')}
          disabled={caricamento}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <Check size={16} strokeWidth={2.5} />
          Completato
        </button>
        <button
          onClick={() => aggiornaStato('annullato')}
          disabled={caricamento}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-600 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <X size={16} strokeWidth={2.5} />
          Annulla
        </button>
      </div>
      <button
        onClick={eliminaImpegno}
        disabled={caricamento}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-bold text-red-600 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        <Trash2 size={16} strokeWidth={2.5} />
        Elimina impegno
      </button>
    </div>
  )
}