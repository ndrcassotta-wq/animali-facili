'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Mail, X } from 'lucide-react'

type InvitoRicevuto = {
  condivisione_id: string
  animale_id: string
  animale_nome: string
  owner_user_id: string
  owner_nome: string | null
  owner_email: string | null
  created_at: string
}

export function InvitiCondivisioneCard() {
  const router = useRouter()
  const supabase = createClient()

  const [inviti, setInviti] = useState<InvitoRicevuto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [azioneId, setAzioneId] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  async function caricaInviti() {
    setIsLoading(true)
    setErrore(null)

    const { data, error } = await supabase.rpc('get_inviti_condivisione_ricevuti')

    if (error) {
      setErrore(error.message)
      setInviti([])
      setIsLoading(false)
      return
    }

    setInviti((data ?? []) as InvitoRicevuto[])
    setIsLoading(false)
  }

  useEffect(() => {
    caricaInviti()
  }, [])

  async function rispondi(
    condivisioneId: string,
    azione: 'accepted' | 'revoked'
  ) {
    setErrore(null)
    setAzioneId(condivisioneId)

    const { error } = await supabase.rpc('rispondi_invito_condivisione', {
      p_condivisione_id: condivisioneId,
      p_azione: azione,
    })

    if (error) {
      setErrore(error.message)
      setAzioneId(null)
      return
    }

    await caricaInviti()
    router.refresh()
    setAzioneId(null)
  }

  if (isLoading) {
    return null
  }

  if (!errore && inviti.length === 0) {
    return null
  }

  return (
    <div className="rounded-3xl border border-[#EADFD3] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
          Inviti
        </p>
        <h2 className="mt-1 text-lg font-extrabold text-gray-900">
          Condivisioni ricevute
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Accetta o rifiuta gli inviti ai profili animali condivisi con te.
        </p>
      </div>

      {errore && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">{errore}</p>
        </div>
      )}

      <div className="space-y-3">
        {inviti.map((invito) => (
          <div
            key={invito.condivisione_id}
            className="rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] p-4"
          >
            <p className="text-sm font-bold text-gray-900">
              {invito.animale_nome}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Invitato da {invito.owner_nome?.trim() || invito.owner_email || 'un utente'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => rispondi(invito.condivisione_id, 'accepted')}
                disabled={azioneId === invito.condivisione_id}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <Check size={14} strokeWidth={2.6} />
                {azioneId === invito.condivisione_id ? 'Attendo...' : 'Accetta'}
              </button>

              <button
                type="button"
                onClick={() => rispondi(invito.condivisione_id, 'revoked')}
                disabled={azioneId === invito.condivisione_id}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <X size={14} strokeWidth={2.6} />
                {azioneId === invito.condivisione_id ? 'Attendo...' : 'Rifiuta'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}