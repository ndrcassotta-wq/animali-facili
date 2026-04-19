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
  const [errore, setErrore] = useState<string | null>(null)

  async function eliminaDocumento() {
    const conferma = window.confirm('Vuoi davvero eliminare questo documento?')
    if (!conferma || caricamento) return

    setCaricamento(true)
    setErrore(null)

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('documenti')
        .delete()
        .eq('id', documentoId)

      if (deleteError) {
        throw new Error('Non è stato possibile eliminare il documento.')
      }

      const { error: storageError } = await supabase.storage
        .from('documenti-animali')
        .remove([filePath])

      if (storageError) {
        console.warn('File documento non rimosso dallo storage:', storageError.message)
      }

      router.push('/documenti')
      router.refresh()
    } catch (error) {
      console.error(error)
      setErrore(
        error instanceof Error
          ? error.message
          : 'Errore durante l’eliminazione del documento.'
      )
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <div className="space-y-3">
      {errore ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">{errore}</p>
        </div>
      ) : null}

      <Button
        type="button"
        variant="destructive"
        className="w-full"
        onClick={eliminaDocumento}
        disabled={caricamento}
      >
        {caricamento ? 'Eliminazione...' : 'Elimina documento'}
      </Button>
    </div>
  )
}