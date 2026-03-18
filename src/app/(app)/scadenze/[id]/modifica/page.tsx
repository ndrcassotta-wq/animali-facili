import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { ModificaScadenzaForm } from '@/components/scadenze/ModificaScadenzaForm'
import type { Scadenza } from '@/lib/types/query.types'

export default async function ModificaScadenzaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawS } = await supabase
    .from('scadenze')
    .select('*')
    .eq('id', id)
    .single()

  if (!rawS || rawS.stato !== 'attiva') notFound()

  const scadenza = rawS as Scadenza

  return (
    <div>
      <PageHeader
        titolo="Modifica scadenza"
        backHref={`/scadenze/${scadenza.id}`}
      />
      <ModificaScadenzaForm scadenza={scadenza} />
    </div>
  )
}