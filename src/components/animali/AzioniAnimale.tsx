'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export function AzioniAnimale({
  animaleId,
  animaleNome,
}: {
  animaleId: string
  animaleNome: string
}) {
  const router = useRouter()
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  async function rimuoviAnimale() {
    const conferma = window.confirm(
      `Vuoi rimuovere ${animaleNome} solo dal tuo account?\n\nL'animale resterà agli altri utenti collegati. Se sei l'ultimo account collegato, verranno rimossi definitivamente anche i dati dell'animale.`
    )
    if (!conferma) return

    setErrore(null)
    setCaricamento(true)

    const supabase = createClient()

    const { error } = await supabase.rpc('rimuovi_animale_dal_mio_account', {
      p_animale_id: animaleId,
    })

    if (error) {
      setErrore(error.message)
      setCaricamento(false)
      return
    }

    setCaricamento(false)
    router.push('/home')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <button
        onClick={rimuoviAnimale}
        disabled={caricamento}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-bold text-red-600 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        <Trash2 size={16} strokeWidth={2.5} />
        {caricamento ? 'Rimozione...' : 'Rimuovi dal mio account'}
      </button>

      {errore && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">{errore}</p>
        </div>
      )}
    </div>
  )
}