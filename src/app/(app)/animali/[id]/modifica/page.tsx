export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ModificaAnimaleForm from '@/components/animali/ModificaAnimaleForm'
import type { Animale } from '@/lib/types/query.types'

export default async function ModificaAnimalePage({
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

  const { data: rawAnimale } = await supabase
    .from('animali')
    .select('*')
    .eq('id', id)
    .single()

  if (!rawAnimale) notFound()

  const animale = rawAnimale as Animale

  return <ModificaAnimaleForm animale={animale} />
}