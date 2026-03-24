import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { SegnaLetta } from '@/components/notifiche/SegnaLetta'
import { formatRelativo } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/types/database.types'

type Notifica = Database['public']['Tables']['notifiche']['Row']

function getLabelNonLette(count: number) {
  if (count === 0) return 'Tutte lette'
  if (count === 1) return '1 non letta'
  return `${count} non lette`
}

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
  const nonLette = notifiche.filter((notifica) => !notifica.letta).length

  return (
    <div>
      <PageHeader titolo="Notifiche" backHref="/home" />

      <div className="space-y-4 px-4 py-4">
        {notifiche.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Nessuna notifica.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {getLabelNonLette(nonLette)}
              </p>

              {nonLette > 0 && <SegnaLetta userId={user.id} tutte />}
            </div>

            <div className="space-y-2">
              {notifiche.map((notifica) => (
                <div
                  key={notifica.id}
                  className={cn(
                    'flex items-start justify-between gap-3 rounded-xl border border-border p-3 transition-colors',
                    notifica.letta
                      ? 'bg-card'
                      : 'bg-muted/50 ring-1 ring-primary/5'
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start gap-2">
                      {!notifica.letta && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}

                      <p
                        className={cn(
                          'text-sm leading-5',
                          notifica.letta
                            ? 'font-normal text-muted-foreground'
                            : 'font-medium text-foreground'
                        )}
                      >
                        {notifica.titolo}
                      </p>
                    </div>

                    {notifica.corpo && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {notifica.corpo}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {formatRelativo(notifica.created_at)}
                    </p>
                  </div>

                  {!notifica.letta && <SegnaLetta notificaId={notifica.id} />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}