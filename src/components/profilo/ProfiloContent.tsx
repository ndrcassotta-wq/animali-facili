'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Info,
  Mail,
  PencilLine,
  UserRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/profilo/LogoutButton'

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  )
}

function RigaRiepilogo({
  label,
  valore,
}: {
  label: string
  valore: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#F1E7DC] py-3 last:border-0 last:pb-0 first:pt-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="max-w-[62%] text-right text-sm font-semibold text-gray-800">
        {valore}
      </span>
    </div>
  )
}

export function ProfiloContent({
  userId,
  nomeIniziale,
  email,
  notificheAttive,
  riepilogoCompleanni,
  riepilogoTerapie,
}: {
  userId: string
  nomeIniziale: string
  email: string
  notificheAttive: boolean
  riepilogoCompleanni: string
  riepilogoTerapie: string
}) {
  const router = useRouter()
  const [nome, setNome] = useState(nomeIniziale)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messaggio, setMessaggio] = useState<string | null>(null)

  async function handleSave() {
    const nomePulito = nome.trim()

    if (!nomePulito) {
      setMessaggio('Inserisci un nome valido.')
      return
    }

    setIsSubmitting(true)
    setMessaggio(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profili')
        .update({ nome: nomePulito })
        .eq('id', userId)

      if (error) throw error

      setNome(nomePulito)
      setMessaggio('Profilo aggiornato.')
      router.refresh()
    } catch {
      setMessaggio('Errore durante il salvataggio. Riprova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 px-5 py-4 pb-32">
      <Card>
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FCF3E8] text-amber-500">
              <UserRound size={22} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
                Profilo
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
                I tuoi dati
              </h1>
              <p className="mt-1 text-sm leading-5 text-gray-400">
                Qui puoi controllare le informazioni principali del tuo account e
                aggiornare il nome quando vuoi.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl bg-[#FCF8F3] px-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <PencilLine size={16} strokeWidth={2.2} />
                <span>Nome</span>
              </div>

              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Inserisci il tuo nome"
                maxLength={80}
                disabled={isSubmitting}
                className="h-12 rounded-xl border-gray-200 bg-white px-4 text-base"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Mail size={16} strokeWidth={2.2} />
                <span>Email</span>
              </div>

              <Input
                value={email}
                disabled
                className="h-12 rounded-xl border-gray-200 bg-gray-100 px-4 text-base text-gray-500 opacity-100"
              />
            </div>
          </div>

          {messaggio && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                messaggio.includes('Errore') || messaggio.includes('valido')
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {messaggio}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-base font-bold text-white shadow-md shadow-orange-200 transition-all hover:opacity-100 active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? 'Salvataggio...' : 'Salva nome'}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FCF3E8] text-amber-500">
              <Bell size={22} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
                Notifiche
              </h2>
              <p className="mt-1 text-sm leading-5 text-gray-400">
                Riepilogo rapido delle notifiche globali attive nel tuo profilo.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FCF8F3] px-4 py-4">
            <RigaRiepilogo
              label="Stato generale"
              valore={notificheAttive ? 'Attive' : 'Disattivate'}
            />
            <RigaRiepilogo
              label="Compleanni"
              valore={riepilogoCompleanni}
            />
            <RigaRiepilogo label="Terapie" valore={riepilogoTerapie} />

            <div className="mt-3 rounded-2xl bg-white px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-amber-500">
                  <Info size={18} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    Impegni normali
                  </p>
                  <p className="mt-1 text-sm leading-5 text-gray-500">
                    La notifica degli impegni normali si sceglie direttamente
                    quando crei il singolo impegno.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/profilo/notifiche"
            className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-4 text-sm font-bold text-gray-800 transition-all active:scale-[0.98]"
          >
            Configura notifiche
          </Link>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
              Account
            </h2>
            <p className="mt-1 text-sm leading-5 text-gray-400">
              Da qui puoi uscire in sicurezza dal tuo account.
            </p>
          </div>

          <LogoutButton />
        </div>
      </Card>
    </div>
  )
}