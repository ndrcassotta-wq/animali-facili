'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  programmaNotificaImpegno,
  cancellaNotificaImpegno,
  richiediPermessoNotifiche,
} from '@/hooks/useNotifiche'
import { Bell, BellOff } from 'lucide-react'

export function NotificaImpegno({
  impegnoId,
  titolo,
  animaleNome,
  data,
  tipo,
}: {
  impegnoId: string
  titolo: string
  animaleNome: string
  data: string
  tipo: string
}) {
  const [attiva,      setAttiva]      = useState(false)
  const [caricamento, setCaricamento] = useState(false)
  const [messaggio,   setMessaggio]   = useState<string | null>(null)

  async function handleAttiva() {
    setCaricamento(true)
    setMessaggio(null)

    try {
      const permesso = await richiediPermessoNotifiche()
      if (!permesso) {
        setMessaggio('Permesso notifiche negato. Abilitalo nelle impostazioni.')
        setCaricamento(false)
        return
      }

      await programmaNotificaImpegno({
        id:          impegnoId,
        titolo,
        animaleNome,
        data,
        tipo,
      })

      setAttiva(true)
      setMessaggio('Riceverai una notifica prima dell\'impegno.')
    } catch {
      setMessaggio('Errore durante la programmazione della notifica.')
    } finally {
      setCaricamento(false)
    }
  }

  async function handleDisattiva() {
    setCaricamento(true)
    setMessaggio(null)

    try {
      await cancellaNotificaImpegno(impegnoId)
      setAttiva(false)
      setMessaggio('Notifica rimossa.')
    } catch {
      setMessaggio('Errore durante la rimozione della notifica.')
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant={attiva ? 'default' : 'outline'}
        className="w-full gap-2"
        onClick={attiva ? handleDisattiva : handleAttiva}
        disabled={caricamento}
      >
        {attiva
          ? <><BellOff className="w-4 h-4" /> Rimuovi notifica</>
          : <><Bell className="w-4 h-4" /> Attiva notifica</>
        }
      </Button>
      {messaggio && (
        <p className="text-xs text-center text-muted-foreground">{messaggio}</p>
      )}
    </div>
  )
}