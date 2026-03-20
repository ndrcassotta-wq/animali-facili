import { notFound } from 'next/navigation'

import { SchedaAnimaleTab } from '@/components/animali/SchedaAnimaleTab'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import type {
  Animale,
  Scadenza,
  Evento,
  Documento,
} from '@/lib/types/query.types'

type Terapia = Database['public']['Tables']['terapie']['Row']
type SomministrazioneTerapia =
  Database['public']['Tables']['somministrazioni_terapia']['Row']

type TerapiaConUltimaSomministrazione = Terapia & {
  ultimaSomministrazione: SomministrazioneTerapia | null
}

type TabId =
  | 'profilo'
  | 'scadenze'
  | 'eventi'
  | 'documenti'
  | 'terapie'

const TAB_VALIDE: TabId[] = [
  'profilo',
  'scadenze',
  'eventi',
  'documenti',
  'terapie',
]

function getTabValida(tab?: string | string[]): TabId {
  const valore = Array.isArray(tab) ? tab[0] : tab

  if (valore && TAB_VALIDE.includes(valore as TabId)) {
    return valore as TabId
  }

  return 'profilo'
}

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string | string[] }>
}

export default async function AnimalePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { tab } = await searchParams

  const tabIniziale = getTabValida(tab)

  const supabase = await createClient()

  const [
    { data: animaleData, error: animaleError },
    { data: scadenzeData, error: scadenzeError },
    { data: eventiData, error: eventiError },
    { data: documentiData, error: documentiError },
    { data: terapieData, error: terapieError },
  ] = await Promise.all([
    supabase
      .from('animali')
      .select('*')
      .eq('id', id)
      .single(),

    supabase
      .from('scadenze')
      .select('*')
      .eq('animale_id', id),

    supabase
      .from('eventi')
      .select('*')
      .eq('animale_id', id),

    supabase
      .from('documenti')
      .select('*')
      .eq('animale_id', id),

    supabase
      .from('terapie')
      .select('*')
      .eq('animale_id', id),
  ])

  if (animaleError || !animaleData) {
    notFound()
  }

  if (scadenzeError) {
    console.error('Errore caricamento scadenze:', scadenzeError)
  }

  if (eventiError) {
    console.error('Errore caricamento eventi:', eventiError)
  }

  if (documentiError) {
    console.error('Errore caricamento documenti:', documentiError)
  }

  if (terapieError) {
    console.error('Errore caricamento terapie:', terapieError)
  }

  const animale = animaleData as Animale
  const scadenze = (scadenzeData ?? []) as Scadenza[]
  const eventi = (eventiData ?? []) as Evento[]
  const documenti = (documentiData ?? []) as Documento[]
  const terapieBase = (terapieData ?? []) as Terapia[]

  const terapiaIds = terapieBase.map((terapia) => terapia.id)

  let tutteLeSomministrazioni: SomministrazioneTerapia[] = []

  if (terapiaIds.length > 0) {
    const { data: somministrazioniData, error: somministrazioniError } =
      await supabase
        .from('somministrazioni_terapia')
        .select('*')
        .in('terapia_id', terapiaIds)
        .order('somministrata_il', { ascending: false })

    if (somministrazioniError) {
      console.error(
        'Errore caricamento somministrazioni terapia:',
        somministrazioniError
      )
    } else {
      tutteLeSomministrazioni =
        (somministrazioniData ?? []) as SomministrazioneTerapia[]
    }
  }

  const somministrazioniPerTerapia = new Map<string, SomministrazioneTerapia>()

  for (const somministrazione of tutteLeSomministrazioni) {
    if (!somministrazioniPerTerapia.has(somministrazione.terapia_id)) {
      somministrazioniPerTerapia.set(
        somministrazione.terapia_id,
        somministrazione
      )
    }
  }

  const terapie: TerapiaConUltimaSomministrazione[] = terapieBase.map(
    (terapia) => ({
      ...terapia,
      ultimaSomministrazione:
        somministrazioniPerTerapia.get(terapia.id) ?? null,
    })
  )

  return (
    <SchedaAnimaleTab
      animale={animale}
      scadenze={scadenze}
      eventi={eventi}
      documenti={documenti}
      terapie={terapie}
      tabIniziale={tabIniziale}
    />
  )
}