'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cancellaNotificaImpegno } from '@/hooks/useNotifiche'

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

    await supabase
      .from('impegni')
      .update({ stato: nuovoStato })
      .eq('id', impegnoId)

    // Cancella notifica se completato o annullato
    if (nuovoStato === 'completato' || nuovoStato === 'annullato') {
      try {
        await cancellaNotificaImpegno(impegnoId)
      } catch {
        // Non blocchiamo se la cancellazione fallisce
      }
    }

    setCaricamento(false)
    router.refresh()
  }

  if (statoAttuale === 'completato' || statoAttuale === 'annullato') {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => aggiornaStato('programmato')}
        disabled={caricamento}
      >
        Riporta a programmato
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        className="flex-1"
        onClick={() => aggiornaStato('completato')}
        disabled={caricamento}
      >
        Segna completato
      </Button>
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => aggiornaStato('annullato')}
        disabled={caricamento}
      >
        Annulla
      </Button>
    </div>
  )
}