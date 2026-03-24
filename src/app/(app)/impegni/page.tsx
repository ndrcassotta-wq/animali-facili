import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
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
    <div>
      <PageHeader
        titolo="Impegni"
        azione={
          <Button asChild size="sm" variant="outline">
            <Link href="/impegni/nuovo">+ Nuovo</Link>
          </Button>
        }
      />
      <FiltroImpegni statoAttivo={statoFiltro} impegni={impegni} />
    </div>
  )
}