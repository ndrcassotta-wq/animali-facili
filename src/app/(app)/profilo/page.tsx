import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { LogoutButton } from '@/components/profilo/LogoutButton'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import type { PreferenzeNotifiche } from '@/lib/types/database.types'
import { PREFERENZE_DEFAULT } from '@/hooks/useNotifiche'

function Campo({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{valore}</span>
    </div>
  )
}

export default async function ProfiloPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  const preferenze: PreferenzeNotifiche =
    (profilo?.preferenze_notifiche ?? PREFERENZE_DEFAULT)

  return (
    <div>
      <PageHeader titolo="Profilo" />
      <div className="px-4 py-4 space-y-6">

        <div className="space-y-0">
          <Campo label="Nome"  valore={profilo?.nome  ?? '—'} />
          <Campo label="Email" valore={profilo?.email ?? '—'} />
        </div>

        {/* Sezione notifiche */}
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Notifiche
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {preferenze.attive ? 'Notifiche attive' : 'Notifiche disattivate'}
                </span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                preferenze.attive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {preferenze.attive ? 'On' : 'Off'}
              </span>
            </div>
            {preferenze.attive && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Avviso: {preferenze.giorni_prima === 0
                  ? 'il giorno stesso'
                  : preferenze.giorni_prima === 1
                  ? '1 giorno prima'
                  : `${preferenze.giorni_prima} giorni prima`}
                </p>
                <p>Orario: {String(preferenze.ore).padStart(2, '0')}:00</p>
                <p>Tipi abilitati: {preferenze.tipi_abilitati.length} su 11</p>
              </div>
            )}
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