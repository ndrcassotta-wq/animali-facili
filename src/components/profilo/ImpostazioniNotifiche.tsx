'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Cake, Clock3, Info, Pill } from 'lucide-react'
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

const cardClass =
  'rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]'

function getChipClass(attivo: boolean) {
  return `rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
    attivo
      ? 'border-[#2F231A] bg-[#2F231A] text-white'
      : 'border-[#E6DDD2] bg-[#FFFDFC] text-[#6B5B4D] hover:bg-[#F7F1E8]'
  }`
}

function SectionBadge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F4EE] px-3 py-1 text-xs font-medium text-[#6B5B4D]">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
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
    <div className="space-y-5 px-5 py-5 pb-32">
      <div className={cardClass}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <SectionBadge icon={Bell} label="Impostazione generale" />

            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[#2F231A]">
                Notifiche globali
              </h2>
              <p className="text-sm leading-6 text-[#6B5B4D]">
                Qui gestisci solo le impostazioni generali per compleanni e
                terapie.
              </p>
            </div>
          </div>

          <Switch
            checked={preferenze.attive}
            onCheckedChange={(v) =>
              setPreferenze((prev) => ({ ...prev, attive: v }))
            }
            disabled={isSubmitting}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-[#EFE5D8] bg-[#FCF8F2] p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6A45]" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#2F231A]">
                Gli impegni normali non si gestiscono qui
              </p>
              <p className="text-xs leading-5 text-[#6B5B4D]">
                La notifica degli impegni normali si decide durante la creazione
                del singolo impegno, così puoi sceglierla caso per caso.
              </p>
            </div>
          </div>
        </div>
      </div>

      {preferenze.attive && (
        <>
          <div className={cardClass}>
            <div className="space-y-4">
              <div className="space-y-3">
                <SectionBadge icon={Cake} label="Compleanni" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2F231A]">
                      Notifiche compleanni
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#6B5B4D]">
                      Impostazione globale valida per tutti i compleanni
                      registrati nell’app.
                    </p>
                  </div>

                  <Switch
                    checked={compleanniAttivi}
                    onCheckedChange={() => toggleTipo('compleanno')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {compleanniAttivi && (
                <div className="rounded-2xl border border-[#EFE5D8] bg-[#FFFDFC] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#8E7C6A]">
                    Anticipo notifica
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#6B5B4D]">
                    Scegli con quanto anticipo avvisare per i compleanni.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {opzioniGiorni.map((opzione) => (
                      <button
                        key={opzione.valore}
                        type="button"
                        onClick={() =>
                          setPreferenze((prev) => ({
                            ...prev,
                            giorni_prima: opzione.valore,
                          }))
                        }
                        disabled={isSubmitting}
                        className={getChipClass(
                          preferenze.giorni_prima === opzione.valore
                        )}
                      >
                        {opzione.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <div className="space-y-4">
              <div className="space-y-3">
                <SectionBadge icon={Pill} label="Terapie" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2F231A]">
                      Notifiche terapie
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#6B5B4D]">
                      Questa impostazione vale come default globale. Quando una
                      terapia ha un suo orario, la notifica segue quello.
                    </p>
                  </div>

                  <Switch
                    checked={terapieAttive}
                    onCheckedChange={() => toggleTipo('terapia')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#EFE5D8] bg-[#FCF8F2] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#8E7C6A]">
                  Come funziona
                </p>
                <p className="mt-1 text-xs leading-5 text-[#6B5B4D]">
                  Se nella singola terapia è presente un orario, viene usato
                  quello. Se invece manca, l’app usa l’orario default globale
                  qui sotto come fallback.
                </p>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="space-y-4">
              <div className="space-y-3">
                <SectionBadge icon={Clock3} label="Orario default / fallback" />

                <div>
                  <p className="text-sm font-semibold text-[#2F231A]">
                    Orario default globale
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#6B5B4D]">
                    Usato per i compleanni attivi e come fallback per le terapie
                    senza orario specifico.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {opzioniOre.map((ora) => (
                  <button
                    key={ora}
                    type="button"
                    onClick={() =>
                      setPreferenze((prev) => ({ ...prev, ore: ora }))
                    }
                    disabled={isSubmitting}
                    className={getChipClass(preferenze.ore === ora)}
                  >
                    {String(ora).padStart(2, '0')}:00
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {messaggio && (
        <p className="text-center text-sm text-muted-foreground">{messaggio}</p>
      )}

      <Button className="w-full" onClick={handleSalva} disabled={isSubmitting}>
        {isSubmitting ? 'Salvataggio...' : 'Salva impostazioni'}
      </Button>
    </div>
  )
}