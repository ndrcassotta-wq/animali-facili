'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { PreferenzeNotifiche } from '@/lib/types/database.types'
import { richiediPermessoNotifiche } from '@/hooks/useNotifiche'

const tipiConPreavviso = [
  { valore: 'visita',        label: 'Visita' },
  { valore: 'controllo',     label: 'Controllo' },
  { valore: 'vaccinazione',  label: 'Vaccinazione' },
  { valore: 'toelettatura',  label: 'Toelettatura' },
  { valore: 'addestramento', label: 'Addestramento' },
  { valore: 'compleanno',    label: 'Compleanno' },
  { valore: 'altro',         label: 'Altro' },
]

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
  const [preferenze, setPreferenze] = useState<PreferenzeNotifiche>(preferenzeIniziali)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messaggio, setMessaggio] = useState<string | null>(null)

  function toggleTipo(tipo: string) {
    setPreferenze(prev => {
      const abilitati = prev.tipi_abilitati.includes(tipo)
        ? prev.tipi_abilitati.filter(t => t !== tipo)
        : [...prev.tipi_abilitati, tipo]
      return { ...prev, tipi_abilitati: abilitati }
    })
  }

  async function handleSalva() {
    setIsSubmitting(true)
    setMessaggio(null)
    try {
      if (preferenze.attive) {
        const permesso = await richiediPermessoNotifiche()
        if (!permesso) {
          setMessaggio('Permesso notifiche negato. Abilitalo nelle impostazioni del telefono.')
          setIsSubmitting(false)
          return
        }
      }
      const supabase = createClient()
      const { error } = await supabase
        .from('profili')
        .update({ preferenze_notifiche: preferenze })
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

  return (
    <div className="px-4 py-4 space-y-6">

      {/* Attiva/disattiva tutto */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
        <div>
          <p className="text-sm font-medium">Notifiche impegni</p>
          <p className="text-xs text-muted-foreground">Ricevi avvisi per i tuoi impegni</p>
        </div>
        <Switch
          checked={preferenze.attive}
          onCheckedChange={v => setPreferenze(prev => ({ ...prev, attive: v }))}
          disabled={isSubmitting}
        />
      </div>

      {preferenze.attive && (
        <>
          {/* Terapie */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Terapie
            </h2>
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm">Terapia</p>
                  <p className="text-xs text-muted-foreground">
                    Notifica il giorno stesso alle {String(preferenze.ore).padStart(2, '0')}:00
                  </p>
                </div>
                <Switch
                  checked={preferenze.tipi_abilitati.includes('terapia')}
                  onCheckedChange={() => toggleTipo('terapia')}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Anticipo */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Anticipo notifica
            </h2>
            <div className="flex flex-wrap gap-2">
              {opzioniGiorni.map(o => (
                <button
                  key={o.valore}
                  onClick={() => setPreferenze(prev => ({ ...prev, giorni_prima: o.valore }))}
                  disabled={isSubmitting}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    preferenze.giorni_prima === o.valore
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orario */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Orario notifica
            </h2>
            <div className="flex flex-wrap gap-2">
              {opzioniOre.map(o => (
                <button
                  key={o}
                  onClick={() => setPreferenze(prev => ({ ...prev, ore: o }))}
                  disabled={isSubmitting}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    preferenze.ore === o
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {String(o).padStart(2, '0')}:00
                </button>
              ))}
            </div>
          </div>

          {/* Impegni con preavviso */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Impegni con preavviso
            </h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {tipiConPreavviso.map(tipo => (
                <div key={tipo.valore} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">{tipo.label}</span>
                  <Switch
                    checked={preferenze.tipi_abilitati.includes(tipo.valore)}
                    onCheckedChange={() => toggleTipo(tipo.valore)}
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {messaggio && (
        <p className="text-sm text-center text-muted-foreground">{messaggio}</p>
      )}

      <Button className="w-full" onClick={handleSalva} disabled={isSubmitting}>
        {isSubmitting ? 'Salvataggio...' : 'Salva impostazioni'}
      </Button>

    </div>
  )
}