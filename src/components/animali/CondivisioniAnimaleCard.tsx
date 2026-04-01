'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, RefreshCcw, Users, Link2Off } from 'lucide-react'

type StatoCondivisione = 'pending' | 'accepted' | 'revoked'

type CondivisioneItem = {
  id: string
  shared_user_id: string
  shared_nome: string | null
  shared_email: string | null
  status: StatoCondivisione
  invited_by_user_id: string | null
  created_at: string
  updated_at: string
  accepted_at: string | null
  revoked_at: string | null
}

function labelStato(status: StatoCondivisione) {
  if (status === 'accepted') return 'Attiva'
  if (status === 'pending') return 'In attesa'
  return 'Revocata'
}

function statoClasses(status: StatoCondivisione) {
  if (status === 'accepted') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  }
  if (status === 'pending') {
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  }
  return 'bg-slate-100 text-slate-600 border border-slate-200'
}

export function CondivisioniAnimaleCard({
  animaleId,
  ownerUserId,
}: {
  animaleId: string
  ownerUserId: string
}) {
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [condivisioni, setCondivisioni] = useState<CondivisioneItem[]>([])
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [azioneId, setAzioneId] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [messaggio, setMessaggio] = useState<string | null>(null)

  const isOwner = useMemo(
    () => currentUserId !== null && currentUserId === ownerUserId,
    [currentUserId, ownerUserId]
  )

  async function caricaCondivisioni() {
    setIsLoading(true)
    setErrore(null)

    const { data, error } = await supabase.rpc('get_animale_condivisioni', {
      p_animale_id: animaleId,
    })

    if (error) {
      setErrore(error.message)
      setCondivisioni([])
      setIsLoading(false)
      return
    }

    setCondivisioni((data ?? []) as CondivisioneItem[])
    setIsLoading(false)
  }

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      setCurrentUserId(user?.id ?? null)
      await caricaCondivisioni()
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [animaleId])

  async function invitaFamiliare() {
    const emailPulita = email.trim().toLowerCase()

    setErrore(null)
    setMessaggio(null)

    if (!emailPulita) {
      setErrore('Inserisci l’email dell’account da invitare.')
      return
    }

    setIsInviting(true)

    const { error } = await supabase.rpc('invita_condivisione_animale', {
      p_animale_id: animaleId,
      p_email: emailPulita,
    })

    if (error) {
      setErrore(error.message)
      setIsInviting(false)
      return
    }

    setEmail('')
    setMessaggio('Invito salvato correttamente.')
    await caricaCondivisioni()
    setIsInviting(false)
  }

  async function revocaCondivisione(condivisioneId: string) {
    setErrore(null)
    setMessaggio(null)
    setAzioneId(condivisioneId)

    const { error } = await supabase.rpc('revoca_condivisione_animale', {
      p_condivisione_id: condivisioneId,
    })

    if (error) {
      setErrore(error.message)
      setAzioneId(null)
      return
    }

    setMessaggio('Condivisione revocata.')
    await caricaCondivisioni()
    setAzioneId(null)
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FCF8F3] text-amber-600">
            <Users size={20} strokeWidth={2.2} />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">
            Condivisione familiari
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Condividi questo animale con altri account senza creare copie.
          </p>
        </div>

        <button
          type="button"
          onClick={caricaCondivisioni}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm active:scale-95"
          aria-label="Aggiorna condivisioni"
        >
          <RefreshCcw size={16} strokeWidth={2.2} />
        </button>
      </div>

      {isOwner && (
        <div className="mt-4 rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] p-4">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Invita tramite email
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail
                size={16}
                strokeWidth={2.2}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrore(null)
                  setMessaggio(null)
                }}
                placeholder="email del familiare"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400"
              />
            </div>

            <button
              type="button"
              onClick={invitaFamiliare}
              disabled={isInviting}
              className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isInviting ? 'Invio...' : 'Invita'}
            </button>
          </div>
        </div>
      )}

      {errore && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">{errore}</p>
        </div>
      )}

      {messaggio && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-700">{messaggio}</p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-[#EADFD3] bg-[#FCF8F3] px-4 py-5 text-center">
            <p className="text-sm font-semibold text-gray-700">
              Caricamento condivisioni...
            </p>
          </div>
        ) : condivisioni.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#EADFD3] bg-[#FCF8F3] px-4 py-5 text-center">
            <p className="text-sm font-semibold text-gray-700">
              Nessuna condivisione attiva
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              {isOwner
                ? 'Invita un familiare inserendo l’email del suo account.'
                : 'Questo animale non è condiviso con altri account.'}
            </p>
          </div>
        ) : (
          condivisioni.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-100 bg-white px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {item.shared_nome?.trim() || 'Utente'}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {item.shared_email || 'Email non disponibile'}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${statoClasses(item.status)}`}
                >
                  {labelStato(item.status)}
                </span>
              </div>

              {isOwner && (item.status === 'accepted' || item.status === 'pending') && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => revocaCondivisione(item.id)}
                    disabled={azioneId === item.id}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    <Link2Off size={14} strokeWidth={2.4} />
                    {azioneId === item.id ? 'Revoca...' : 'Revoca'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}