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

  async function eliminaAnimale() {
    const conferma = window.confirm(
      `Vuoi davvero eliminare ${animaleNome}? Verranno rimossi anche i dati collegati.`
    )
    if (!conferma) return

    setCaricamento(true)
    const supabase = createClient()

    await supabase
      .from('animali')
      .delete()
      .eq('id', animaleId)

    setCaricamento(false)
    router.push('/home')
    router.refresh()
  }

  return (
    <button
      onClick={eliminaAnimale}
      disabled={caricamento}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-bold text-red-600 active:scale-[0.98] transition-all disabled:opacity-60"
    >
      <Trash2 size={16} strokeWidth={2.5} />
      {caricamento ? 'Eliminazione...' : 'Elimina animale'}
    </button>
  )
}