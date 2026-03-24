'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

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
    router.push('/animali')
    router.refresh()
  }

  return (
    <Button
      variant="destructive"
      className="w-full"
      onClick={eliminaAnimale}
      disabled={caricamento}
    >
      Elimina animale
    </Button>
  )
}