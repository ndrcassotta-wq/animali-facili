import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { SchedaAnimaleTab } from '@/components/animali/SchedaAnimaleTab'
import type { Animale, Scadenza, Evento, Documento } from '@/lib/types/query.types'

type TabId = 'profilo' | 'scadenze' | 'eventi' | 'documenti'
const TAB_VALIDI: TabId[] = ['profilo', 'scadenze', 'eventi', 'documenti']

function tabValido(val: string | undefined): TabId {
  return TAB_VALIDI.includes(val as TabId) ? (val as TabId) : 'profilo'
}

export default async function SchedaAnimalePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: animaleRaw } = await supabase
    .from('animali')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!animaleRaw) notFound()

  const animale = animaleRaw as Animale

  const [{ data: scadenzeRaw }, { data: eventiRaw }, { data: documentiRaw }] =
    await Promise.all([
      supabase
        .from('scadenze')
        .select('*')
        .eq('animale_id', animale.id)
        .order('data', { ascending: true }),
      supabase
        .from('eventi')
        .select('*')
        .eq('animale_id', animale.id)
        .order('data', { ascending: false }),
      supabase
        .from('documenti')
        .select('*')
        .eq('animale_id', animale.id)
        .order('created_at', { ascending: false }),
    ])

  const scadenze  = (scadenzeRaw  ?? []) as Scadenza[]
  const eventi    = (eventiRaw    ?? []) as Evento[]
  const documenti = (documentiRaw ?? []) as Documento[]

  const tabIniziale = tabValido(tab)

  return (
    <div>
      <PageHeader
        titolo={animale.nome}
        backHref="/animali"
        azione={
          <Link
            href={`/animali/${animale.id}/modifica`}
            className="text-xs text-muted-foreground underline underline-offset-4"
          >
            Modifica
          </Link>
        }
      />
      <SchedaAnimaleTab
        animale={animale}
        scadenze={scadenze}
        eventi={eventi}
        documenti={documenti}
        tabIniziale={tabIniziale}
      />
    </div>
  )
}