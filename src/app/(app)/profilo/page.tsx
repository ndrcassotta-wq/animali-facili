import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { LogoutButton } from '@/components/profilo/LogoutButton'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import type { PreferenzeNotifiche } from '@/lib/types/database.types'
import { normalizzaPreferenzeNotifiche } from '@/hooks/useNotifiche'

function Campo({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{valore}</span>
    </div>
  )
}

function formattaAnticipo(giorniPrima: number) {
  if (giorniPrima === 0) return 'il giorno stesso'
  if (giorniPrima === 1) return '1 giorno prima'
  return `${giorniPrima} giorni prima`
}

export default async function ProfiloPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfilo } = await supabase
    .from('profili')
    .select('nome, email, created_at, preferenze_notifiche')
    .eq('id', user.id)
    .single()

  const profilo = rawProfilo as {
    nome: string
    email: string
    created_at: string
    preferenze_notifiche: PreferenzeNotifiche | null
  } | null

  const preferenze = normalizzaPreferenzeNotifiche(
    profilo?.preferenze_notifiche ?? null
  )

  const compleanniAttivi =
    preferenze.attive && preferenze.tipi_abilitati.includes('compleanno')

  const terapieAttive =
    preferenze.attive && preferenze.tipi_abilitati.includes('terapia')

  return (
    <div>
      <PageHeader titolo="Profilo" />
      <div className="space-y-6 px-4 py-4">
        <div className="space-y-0">
          <Campo label="Nome" valore={profilo?.nome ?? '—'} />
          <Campo label="Email" valore={profilo?.email ?? '—'} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Notifiche
          </h2>
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {preferenze.attive
                    ? 'Notifiche globali attive'
                    : 'Notifiche globali disattivate'}
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  preferenze.attive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {preferenze.attive ? 'On' : 'Off'}
              </span>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                Compleanni:{' '}
                {compleanniAttivi
                  ? `${formattaAnticipo(preferenze.giorni_prima)} alle ${String(
                      preferenze.ore
                    ).padStart(2, '0')}:00`
                  : 'disattivati'}
              </p>
              <p>
                Terapie:{' '}
                {terapieAttive
                  ? `seguono l’orario della terapia o il default delle ${String(
                      preferenze.ore
                    ).padStart(2, '0')}:00`
                  : 'disattivate'}
              </p>
              <p>
                Impegni normali: la notifica si sceglie direttamente quando crei
                il singolo impegno
              </p>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/profilo/notifiche">Configura notifiche</Link>
            </Button>
          </div>
        </div>

        <LogoutButton />
      </div>
    </div>
  )
}