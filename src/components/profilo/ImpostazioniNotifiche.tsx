'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    <div className="space-y-6 px-4 py-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Notifiche globali</p>
            <p className="text-xs text-muted-foreground">
              Qui gestisci solo compleanni e terapie. Gli impegni normali si
              impostano direttamente durante la creazione del singolo impegno.
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
      </div>

      {preferenze.attive && (
        <>
          <div className="space-y-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Compleanni
            </h2>
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifica compleanno</p>
                  <p className="text-xs text-muted-foreground">
                    Regola globale valida per tutti i compleanni.
                  </p>
                </div>
                <Switch
                  checked={compleanniAttivi}
                  onCheckedChange={() => toggleTipo('compleanno')}
                  disabled={isSubmitting}
                />
              </div>

              {compleanniAttivi && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Anticipo compleanno
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {opzioniGiorni.map((o) => (
                        <button
                          key={o.valore}
                          onClick={() =>
                            setPreferenze((prev) => ({
                              ...prev,
                              giorni_prima: o.valore,
                            }))
                          }
                          disabled={isSubmitting}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            preferenze.giorni_prima === o.valore
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Terapie
            </h2>
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifica terapia</p>
                  <p className="text-xs text-muted-foreground">
                    Se la terapia ha un orario, la notifica segue quello.
                    Altrimenti usa l’orario di default qui sotto.
                  </p>
                </div>
                <Switch
                  checked={terapieAttive}
                  onCheckedChange={() => toggleTipo('terapia')}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Orario default globale
            </h2>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-xs text-muted-foreground">
                Usato per i compleanni e come fallback per le terapie senza
                orario specifico.
              </p>
              <div className="flex flex-wrap gap-2">
                {opzioniOre.map((o) => (
                  <button
                    key={o}
                    onClick={() =>
                      setPreferenze((prev) => ({ ...prev, ore: o }))
                    }
                    disabled={isSubmitting}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      preferenze.ore === o
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {String(o).padStart(2, '0')}:00
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