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

  async function eliminaImpegno() {
    const conferma = window.confirm('Vuoi davvero eliminare questo impegno?')
    if (!conferma) return

    setCaricamento(true)
    const supabase = createClient()

    try {
      await cancellaNotificaImpegno(impegnoId)
    } catch {
      // Non blocchiamo se la cancellazione notifica fallisce
    }

    await supabase
      .from('impegni')
      .delete()
      .eq('id', impegnoId)

    setCaricamento(false)
    router.push('/impegni')
    router.refresh()
  }

  if (statoAttuale === 'completato' || statoAttuale === 'annullato') {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => aggiornaStato('programmato')}
          disabled={caricamento}
        >
          Riporta a programmato
        </Button>

        <Button
          variant="destructive"
          className="w-full"
          onClick={eliminaImpegno}
          disabled={caricamento}
        >
          Elimina impegno
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
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

      <Button
        variant="destructive"
        className="w-full"
        onClick={eliminaImpegno}
        disabled={caricamento}
      >
        Elimina impegno
      </Button>
    </div>
  )
}