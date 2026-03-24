'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function AzioniDocumento({
  documentoId,
  filePath,
}: {
  documentoId: string
  filePath: string
}) {
  const router = useRouter()
  const [caricamento, setCaricamento] = useState(false)

  async function eliminaDocumento() {
    const conferma = window.confirm('Vuoi davvero eliminare questo documento?')
    if (!conferma) return

    setCaricamento(true)
    const supabase = createClient()

    await supabase.storage
      .from('documenti-animali')
      .remove([filePath])

    await supabase
      .from('documenti')
      .delete()
      .eq('id', documentoId)

    setCaricamento(false)
    router.push('/documenti')
    router.refresh()
  }

  return (
    <Button
      variant="destructive"
      className="w-full"
      onClick={eliminaDocumento}
      disabled={caricamento}
    >
      Elimina documento
    </Button>
  )
}