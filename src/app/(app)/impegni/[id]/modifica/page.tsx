import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { ModificaImpegnoForm } from '@/components/impegni/ModificaImpegnoForm'
import type { Impegno } from '@/lib/types/query.types'

export default async function ModificaImpegnoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('impegni')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const rawI = data as Impegno | null

  if (error || !rawI || rawI.stato !== 'programmato') notFound()

  return (
    <div>
      <PageHeader
        titolo="Modifica impegno"
        backHref={`/impegni/${rawI.id}`}
      />
      <ModificaImpegnoForm impegno={rawI} />
    </div>
  )
}