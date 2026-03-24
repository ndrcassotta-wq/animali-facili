import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { ImpostazioniNotifiche } from '@/components/profilo/ImpostazioniNotifiche'
import type { PreferenzeNotifiche } from '@/lib/types/database.types'
import { PREFERENZE_DEFAULT } from '@/hooks/useNotifiche'

export default async function NotifichePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfilo } = await supabase
    .from('profili')
    .select('preferenze_notifiche')
    .eq('id', user.id)
    .single()

  const preferenze: PreferenzeNotifiche =
    (rawProfilo?.preferenze_notifiche as PreferenzeNotifiche | null) ??
    PREFERENZE_DEFAULT

  return (
    <div>
      <PageHeader titolo="Notifiche" backHref="/profilo" />
      <ImpostazioniNotifiche
        userId={user.id}
        preferenzeIniziali={preferenze}
      />
    </div>
  )
}