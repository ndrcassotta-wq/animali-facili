'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Props {
  notificaId?: string
  userId?: string
  tutte?: boolean
}

export function SegnaLetta({ notificaId, userId, tutte = false }: Props) {
  const router = useRouter()
  const [caricamento, setCaricamento] = useState(false)

  async function handleClick() {
    setCaricamento(true)
    const supabase = createClient()

    if (tutte && userId) {
      await supabase
        .from('notifiche')
        .update({ letta: true })
        .eq('user_id', userId)
        .eq('letta', false)
    } else if (notificaId) {
      await supabase
        .from('notifiche')
        .update({ letta: true })
        .eq('id', notificaId)
    }

    setCaricamento(false)
    router.refresh()
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleClick}
      disabled={caricamento}
      className="text-xs shrink-0"
    >
      {tutte ? 'Segna tutte lette' : 'Letta'}
    </Button>
  )
}