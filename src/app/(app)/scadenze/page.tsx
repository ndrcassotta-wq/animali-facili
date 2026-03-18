import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { FiltroScadenze } from '@/components/scadenze/FiltroScadenze'
import { asScadenzeConAnimale } from '@/lib/types/query.types'

export default async function ListaScadenzePage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string }>
}) {
  const { stato } = await searchParams

  const statoFiltro =
    stato === 'completate' ? 'completata' :
    stato === 'archiviate' ? 'archiviata' :
    'attiva'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('scadenze')
    .select('*, animali(nome)')
    .eq('stato', statoFiltro)
    .order('data', { ascending: true })

  const scadenze = asScadenzeConAnimale(data)

  return (
    <div>
      <PageHeader
        titolo="Scadenze"
        azione={
          <Button asChild size="sm" variant="outline">
            <Link href="/scadenze/nuova">+ Nuova</Link>
          </Button>
        }
      />
      <FiltroScadenze statoAttivo={statoFiltro} scadenze={scadenze} />
    </div>
  )
}