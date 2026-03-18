'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface Props {
  signedUrl: string | null
  titolo: string
  filePath: string
}

export function BottoneDownload({ signedUrl: urlIniziale, titolo, filePath }: Props) {
  const [url, setUrl]                 = useState(urlIniziale)
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore]           = useState(false)

  async function refreshUrl() {
    setCaricamento(true)
    setErrore(false)
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('documenti-animali')
      .createSignedUrl(filePath, 3600)
    setCaricamento(false)
    if (data?.signedUrl) {
      setUrl(data.signedUrl)
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } else {
      setErrore(true)
    }
  }

  function handleClick() {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      refreshUrl()
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={caricamento}
        className="w-full"
        variant="outline"
      >
        <Download className="w-4 h-4 mr-2" />
        {caricamento ? 'Preparazione...' : `Apri ${titolo}`}
      </Button>
      {errore && (
        <p className="text-xs text-destructive text-center">
          Impossibile generare il link. Riprova.
        </p>
      )}
      {!errore && (
        <p className="text-xs text-muted-foreground text-center">
          Il link è valido per 1 ora.
        </p>
      )}
    </div>
  )
}