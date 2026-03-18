import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { LogoutButton } from '@/components/profilo/LogoutButton'

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
    .select('nome, email, created_at')
    .eq('id', user.id)
    .single()

  const profilo = rawProfilo as {
    nome: string
    email: string
    created_at: string
  } | null

  return (
    <div>
      <PageHeader titolo="Profilo" />
      <div className="px-4 py-4 space-y-6">

        <div className="space-y-0">
          <Campo label="Nome"  valore={profilo?.nome  ?? '—'} />
          <Campo label="Email" valore={profilo?.email ?? '—'} />
        </div>

        <LogoutButton />

      </div>
    </div>
  )
}