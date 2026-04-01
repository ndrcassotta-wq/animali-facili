'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export function AzioniAnimale({
  animaleId,
  animaleNome,
  ownerUserId,
}: {
  animaleId: string
  animaleNome: string
  ownerUserId: string
}) {
  const router = useRouter()
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return
      setIsOwner(user?.id === ownerUserId)
    }

    loadUser()

    return () => {
      mounted = false
    }
  }, [ownerUserId])

  async function eliminaAnimale() {
    const conferma = window.confirm(
      `Vuoi davvero eliminare ${animaleNome}? Verranno rimossi anche i dati collegati.`
    )
    if (!conferma) return

    setErrore(null)
    setCaricamento(true)

    const supabase = createClient()

    const { error } = await supabase
      .from('animali')
      .delete()
      .eq('id', animaleId)

    if (error) {
      setErrore(error.message)
      setCaricamento(false)
      return
    }

    setCaricamento(false)
    router.push('/home')
    router.refresh()
  }

  if (isOwner === false) return null
  if (isOwner === null) return null

  return (
    <div className="space-y-3">
      <button
        onClick={eliminaAnimale}
        disabled={caricamento}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-bold text-red-600 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        <Trash2 size={16} strokeWidth={2.5} />
        {caricamento ? 'Eliminazione...' : 'Elimina animale'}
      </button>

      {errore && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">{errore}</p>
        </div>
      )}
    </div>
  )
}