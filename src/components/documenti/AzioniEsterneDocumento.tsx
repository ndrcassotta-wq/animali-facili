'use client'

import { useState } from 'react'
import { Download, ExternalLink, Loader2, Share2 } from 'lucide-react'
import {
  condividiDocumentoEsterno,
  apriDocumentoEsterno,
  scaricaDocumentoEsterno,
} from '@/lib/documenti/azioni-esterne'

type Props = {
  signedUrl: string
  titolo: string
  filePath: string
}

type AzioneInCorso = 'condividi' | 'scarica' | 'apri' | null

function getNomeFile(titolo: string, filePath: string) {
  const estensione = filePath.split('.').pop()?.toLowerCase()
  const titoloPulito = titolo.trim()

  if (!estensione) return titoloPulito || 'documento'
  if (titoloPulito.toLowerCase().endsWith(`.${estensione}`)) return titoloPulito

  return titoloPulito ? `${titoloPulito}.${estensione}` : `documento.${estensione}`
}

export function AzioniEsterneDocumento({
  signedUrl,
  titolo,
  filePath,
}: Props) {
  const [azioneInCorso, setAzioneInCorso] = useState<AzioneInCorso>(null)
  const [messaggio, setMessaggio] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  const nomeFile = getNomeFile(titolo, filePath)

  async function handleCondividi() {
    try {
      setAzioneInCorso('condividi')
      setErrore(null)
      setMessaggio(null)

      const risultato = await condividiDocumentoEsterno({
        signedUrl,
        nomeFile,
        titolo,
      })

      if (risultato === 'link-copiato') {
        setMessaggio('Link del documento copiato negli appunti.')
        return
      }

      setMessaggio('Pannello di condivisione aperto.')
    } catch (error) {
      console.error(error)
      setErrore('Non sono riuscito a condividere il documento.')
    } finally {
      setAzioneInCorso(null)
    }
  }

  async function handleScarica() {
    try {
      setAzioneInCorso('scarica')
      setErrore(null)
      setMessaggio(null)

      const risultato = await scaricaDocumentoEsterno({
        signedUrl,
        nomeFile,
      })

      if (risultato === 'web') {
        setMessaggio('Download avviato correttamente.')
        return
      }

      setMessaggio('Documento salvato sul dispositivo.')
    } catch (error) {
      console.error(error)
      setErrore('Non sono riuscito a scaricare il documento.')
    } finally {
      setAzioneInCorso(null)
    }
  }

  async function handleApri() {
    try {
      setAzioneInCorso('apri')
      setErrore(null)
      setMessaggio(null)

      const risultato = await apriDocumentoEsterno({
        signedUrl,
        nomeFile,
      })

      if (risultato === 'web') {
        setMessaggio('Documento aperto in una nuova scheda.')
        return
      }

      setMessaggio('Documento aperto nel viewer del dispositivo.')
    } catch (error) {
      console.error(error)
      setErrore(
        'Non sono riuscito ad aprire il documento. Prova prima a scaricarlo.'
      )
    } finally {
      setAzioneInCorso(null)
    }
  }

  const disabilitato = azioneInCorso !== null

  return (
    <div className="rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleCondividi}
          disabled={disabilitato}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] px-4 py-3 text-sm font-semibold text-gray-900 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {azioneInCorso === 'condividi' ? (
            <Loader2 size={16} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <Share2 size={16} strokeWidth={2.2} />
          )}
          Condividi
        </button>

        <button
          type="button"
          onClick={handleScarica}
          disabled={disabilitato}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] px-4 py-3 text-sm font-semibold text-gray-900 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {azioneInCorso === 'scarica' ? (
            <Loader2 size={16} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <Download size={16} strokeWidth={2.2} />
          )}
          Scarica
        </button>

        <button
          type="button"
          onClick={handleApri}
          disabled={disabilitato}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] px-4 py-3 text-sm font-semibold text-gray-900 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {azioneInCorso === 'apri' ? (
            <Loader2 size={16} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <ExternalLink size={16} strokeWidth={2.2} />
          )}
          Apri / Stampa
        </button>
      </div>

      {messaggio ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">{messaggio}</p>
      ) : null}

      {errore ? (
        <p className="mt-3 text-sm font-medium text-red-600">{errore}</p>
      ) : null}
    </div>
  )
}