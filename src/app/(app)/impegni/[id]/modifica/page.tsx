export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModificaImpegnoForm } from '@/components/impegni/ModificaImpegnoForm'
import type { Impegno } from '@/lib/types/query.types'

function getAutoTerapiaId(note?: string | null) {
  if (!note) return null
  const match = note.match(/\[AUTO_TERAPIA:([^[\]]+)\]/)
  return match?.[1] ?? null
}

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
  if (error || !rawI) notFound()

  const autoTerapiaId =
    rawI.tipo === 'terapia' ? getAutoTerapiaId(rawI.note) : null

  if (autoTerapiaId) {
    redirect(`/terapie/${autoTerapiaId}/modifica`)
  }

  if (rawI.stato !== 'programmato') notFound()

  return <ModificaImpegnoForm impegno={rawI} />
}