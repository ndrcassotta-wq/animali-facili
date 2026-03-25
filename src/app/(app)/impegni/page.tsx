export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FiltroImpegni } from '@/components/impegni/FiltroImpegni'
import { asImpegniConAnimale } from '@/lib/types/query.types'

export default async function ListaImpegniPage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string }>
}) {
  const { stato } = await searchParams

  const statoFiltro =
    stato === 'completati' ? 'completato' :
    stato === 'annullati'  ? 'annullato'  :
    'programmato'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('impegni')
    .select('*, animali(nome)')
    .eq('stato', statoFiltro)
    .order('data', { ascending: true })

  const impegni = asImpegniConAnimale(data)

  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>
      <header className="shrink-0 px-5 pt-10 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Impegni</h1>
        <p className="mt-0.5 text-sm text-gray-400">Visite, vaccini e appuntamenti</p>
      </header>
      <FiltroImpegni statoAttivo={statoFiltro} impegni={impegni} />
    </div>
  )
}