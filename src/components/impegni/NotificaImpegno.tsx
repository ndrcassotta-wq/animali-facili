'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
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
  routeDettaglio,
}: {
  impegnoId: string
  titolo: string
  animaleNome: string
  data: string
  tipo: string
  routeDettaglio?: string
}) {
  const pathname = usePathname()
  const [attiva, setAttiva] = useState(false)
  const [caricamento, setCaricamento] = useState(false)
  const [messaggio, setMessaggio] = useState<string | null>(null)

  async function handleAttiva() {
    setCaricamento(true)
    setMessaggio(null)

    try {
      const permesso = await richiediPermessoNotifiche()

      if (!permesso) {
        setMessaggio(
          'Notifiche non disponibili. Controlla permesso notifiche e allarmi precisi nelle impostazioni Android.'
        )
        setCaricamento(false)
        return
      }

      await programmaNotificaImpegno({
        id: impegnoId,
        titolo,
        animaleNome,
        data,
        tipo,
        routeDettaglio: routeDettaglio ?? pathname,
      })

      setAttiva(true)
      setMessaggio("Riceverai una notifica prima dell'impegno.")
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
        {attiva ? (
          <>
            <BellOff className="h-4 w-4" /> Rimuovi notifica
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" /> Attiva notifica
          </>
        )}
      </Button>

      {messaggio && (
        <p className="text-center text-xs text-muted-foreground">{messaggio}</p>
      )}
    </div>
  )
}