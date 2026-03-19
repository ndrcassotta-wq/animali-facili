import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { SegnaLetta } from '@/components/notifiche/SegnaLetta'
import { formatRelativo } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/types/database.types'

type Notifica = Database['public']['Tables']['notifiche']['Row']

export default async function NotifichePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawNotifiche } = await supabase
    .from('notifiche')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifiche = (rawNotifiche ?? []) as Notifica[]
  const nonLette = notifiche.filter(n => !n.letta).length

  return (
    <div>
      <PageHeader titolo="Notifiche" backHref="/home" />

      <div className="px-4 py-4 space-y-2">
        {notifiche.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nessuna notifica.
          </p>
        )}

        {notifiche.length > 0 && nonLette > 0 && (
          <div className="flex justify-end pb-2">
            <SegnaLetta userId={user.id} tutte />
          </div>
        )}

        {notifiche.map(n => (
          <div
            key={n.id}
            className={cn(
              'flex items-start justify-between gap-3 p-3 rounded-xl border border-border transition-colors',
              n.letta ? 'bg-card' : 'bg-muted/50'
            )}
          >
            <div className="flex-1 min-w-0 space-y-0.5">
              <p
                className={cn(
                  'text-sm truncate',
                  n.letta
                    ? 'text-muted-foreground font-normal'
                    : 'text-foreground font-medium'
                )}
              >
                {n.titolo}
              </p>

              {n.corpo && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {n.corpo}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                {formatRelativo(n.created_at)}
              </p>
            </div>

            {!n.letta && <SegnaLetta notificaId={n.id} />}
          </div>
        ))}
      </div>
    </div>
  )
}