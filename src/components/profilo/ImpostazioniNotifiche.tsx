'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CalendarHeart,
  Clock3,
  Info,
  Stethoscope,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { PreferenzeNotifiche } from '@/lib/types/database.types'
import {
  normalizzaPreferenzeNotifiche,
  richiediPermessoNotifiche,
} from '@/hooks/useNotifiche'

const opzioniGiorni = [
  { valore: 0, label: 'Giorno stesso' },
  { valore: 1, label: '1 giorno prima' },
  { valore: 2, label: '2 giorni prima' },
  { valore: 3, label: '3 giorni prima' },
  { valore: 7, label: '1 settimana prima' },
]

const opzioniOre = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

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

function SezioneHeader({
  icona,
  titolo,
  descrizione,
  children,
}: {
  icona: React.ReactNode
  titolo: string
  descrizione: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FCF3E8] text-amber-500">
          {icona}
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
            {titolo}
          </h2>
          <p className="mt-1 text-sm leading-5 text-gray-400">{descrizione}</p>
        </div>
      </div>

      {children}
    </div>
  )
}

function Chip({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
        active
          ? 'border-amber-300 bg-amber-50 text-amber-700'
          : 'border-gray-200 bg-gray-50 text-gray-600 active:bg-gray-100'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {children}
    </button>
  )
}

export function ImpostazioniNotifiche({
  userId,
  preferenzeIniziali,
}: {
  userId: string
  preferenzeIniziali: PreferenzeNotifiche
}) {
  const router = useRouter()
  const [preferenze, setPreferenze] = useState<PreferenzeNotifiche>(
    normalizzaPreferenzeNotifiche(preferenzeIniziali)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messaggio, setMessaggio] = useState<string | null>(null)

  function toggleTipo(tipo: 'compleanno' | 'terapia') {
    setPreferenze((prev) => {
      const abilitati = prev.tipi_abilitati.includes(tipo)
        ? prev.tipi_abilitati.filter((t) => t !== tipo)
        : [...prev.tipi_abilitati, tipo]

      return { ...prev, tipi_abilitati: abilitati }
    })
  }

  async function handleSalva() {
    setIsSubmitting(true)
    setMessaggio(null)

    try {
      const haNotificheGlobaliAttive =
        preferenze.attive &&
        (preferenze.tipi_abilitati.includes('compleanno') ||
          preferenze.tipi_abilitati.includes('terapia'))

      if (haNotificheGlobaliAttive) {
        const permesso = await richiediPermessoNotifiche()
        if (!permesso) {
          setMessaggio(
            'Permesso notifiche negato. Abilitalo nelle impostazioni del telefono.'
          )
          setIsSubmitting(false)
          return
        }
      }

      const supabase = createClient()
      const { error } = await supabase
        .from('profili')
        .update({
          preferenze_notifiche: normalizzaPreferenzeNotifiche(preferenze),
        })
        .eq('id', userId)

      if (error) throw error

      setMessaggio('Impostazioni salvate.')
      router.refresh()
    } catch {
      setMessaggio('Errore durante il salvataggio. Riprova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const compleanniAttivi = preferenze.tipi_abilitati.includes('compleanno')
  const terapieAttive = preferenze.tipi_abilitati.includes('terapia')

  return (
    <div className="space-y-5 px-5 py-4 pb-32">
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
                Profilo
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
                Notifiche globali
              </h1>
              <p className="mt-1 text-sm leading-5 text-gray-400">
                Qui gestisci solo le impostazioni generali di compleanni e
                terapie.
              </p>
            </div>

            <Switch
              checked={preferenze.attive}
              onCheckedChange={(v) =>
                setPreferenze((prev) => ({ ...prev, attive: v }))
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="rounded-2xl bg-[#FCF8F3] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-amber-500">
                <Info size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  Gli impegni normali non si gestiscono qui
                </p>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Le notifiche di visite, controlli e altri impegni si scelgono
                  durante la creazione del singolo impegno.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {preferenze.attive && (
        <>
          <Card>
            <div className="space-y-5">
              <SezioneHeader
                icona={<CalendarHeart size={22} strokeWidth={2.2} />}
                titolo="Compleanni"
                descrizione="Impostazione globale valida per tutti i compleanni registrati nell’app."
              >
                <Switch
                  checked={compleanniAttivi}
                  onCheckedChange={() => toggleTipo('compleanno')}
                  disabled={isSubmitting}
                />
              </SezioneHeader>

              {compleanniAttivi && (
                <div className="rounded-2xl bg-[#FCF8F3] px-4 py-4">
                  <p className="text-sm font-semibold text-gray-800">
                    Anticipo notifica
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Scegli con quanto anticipo ricevere il promemoria del
                    compleanno.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {opzioniGiorni.map((opzione) => (
                      <Chip
                        key={opzione.valore}
                        active={preferenze.giorni_prima === opzione.valore}
                        onClick={() =>
                          setPreferenze((prev) => ({
                            ...prev,
                            giorni_prima: opzione.valore,
                          }))
                        }
                        disabled={isSubmitting}
                      >
                        {opzione.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="space-y-5">
              <SezioneHeader
                icona={<Stethoscope size={22} strokeWidth={2.2} />}
                titolo="Terapie"
                descrizione="Questa impostazione resta un default globale e viene usata solo quando serve."
              >
                <Switch
                  checked={terapieAttive}
                  onCheckedChange={() => toggleTipo('terapia')}
                  disabled={isSubmitting}
                />
              </SezioneHeader>

              <div className="rounded-2xl bg-[#FCF8F3] px-4 py-4">
                <p className="text-sm font-semibold text-gray-800">
                  Come funziona
                </p>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Se una terapia ha già un suo orario, la notifica segue quello.
                  Se invece non è presente un orario specifico, viene usato
                  l’orario default qui sotto come fallback.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-5">
              <SezioneHeader
                icona={<Clock3 size={22} strokeWidth={2.2} />}
                titolo="Orario default"
                descrizione="Usato per i compleanni attivi e come fallback per le terapie senza orario specifico."
              />

              <div className="flex flex-wrap gap-2">
                {opzioniOre.map((ora) => (
                  <Chip
                    key={ora}
                    active={preferenze.ore === ora}
                    onClick={() =>
                      setPreferenze((prev) => ({ ...prev, ore: ora }))
                    }
                    disabled={isSubmitting}
                  >
                    {String(ora).padStart(2, '0')}:00
                  </Chip>
                ))}
              </div>

              <div className="rounded-2xl bg-[#FCF8F3] px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-amber-500">
                    <Bell size={18} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      Fallback, non regola rigida
                    </p>
                    <p className="mt-1 text-sm leading-5 text-gray-500">
                      Questo orario non sostituisce quello già impostato dentro
                      una terapia. Entra in gioco solo quando manca un orario
                      specifico.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {messaggio && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            messaggio.includes('Errore') || messaggio.includes('negato')
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {messaggio}
        </div>
      )}

      <Button
        className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-base font-bold text-white shadow-md shadow-orange-200 transition-all hover:opacity-100 active:scale-[0.98] disabled:opacity-60"
        onClick={handleSalva}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Salvataggio...' : 'Salva impostazioni'}
      </Button>
    </div>
  )
}