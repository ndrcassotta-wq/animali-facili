'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type StatoScadenza = 'attiva' | 'completata' | 'archiviata'

export function AzioniScadenza({
  scadenzaId,
  statoAttuale,
}: {
  scadenzaId: string
  statoAttuale: string
}) {
  const router = useRouter()
  const [caricamento, setCaricamento] = useState(false)

  async function aggiornaStato(nuovoStato: StatoScadenza) {
    setCaricamento(true)
    const supabase = createClient()
    await supabase
      .from('scadenze')
      .update({ stato: nuovoStato })
      .eq('id', scadenzaId)
    setCaricamento(false)
    router.refresh()
  }

  if (statoAttuale === 'completata' || statoAttuale === 'archiviata') {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => aggiornaStato('attiva')}
        disabled={caricamento}
      >
        Riporta ad attiva
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        className="flex-1"
        onClick={() => aggiornaStato('completata')}
        disabled={caricamento}
      >
        Segna completata
      </Button>
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => aggiornaStato('archiviata')}
        disabled={caricamento}
      >
        Archivia
      </Button>
    </div>
  )
}