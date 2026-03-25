import { notFound } from 'next/navigation'
import { SchedaAnimaleTab } from '@/components/animali/SchedaAnimaleTab'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import type { Animale, Impegno, Documento } from '@/lib/types/query.types'

type Terapia = Database['public']['Tables']['terapie']['Row']
type SomministrazioneTerapia = Database['public']['Tables']['somministrazioni_terapia']['Row']
type TerapiaConUltimaSomministrazione = Terapia & {
  ultimaSomministrazione: SomministrazioneTerapia | null
}

type TabId = 'home' | 'profilo' | 'impegni' | 'documenti' | 'terapie'
const TAB_VALIDE: TabId[] = ['home', 'profilo', 'impegni', 'documenti', 'terapie']

function getTabValida(tab?: string | string[]): TabId {
  const valore = Array.isArray(tab) ? tab[0] : tab
  if (valore && TAB_VALIDE.includes(valore as TabId)) return valore as TabId
  return 'home'
}

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string | string[] }>
}

export default async function AnimalePage({ params, searchParams }: PageProps) {
  const { id }  = await params
  const { tab } = await searchParams
  const tabIniziale = getTabValida(tab)

  const supabase = await createClient()

  const [
    { data: animaleData,   error: animaleError },
    { data: impegniData,   error: impegniError },
    { data: documentiData, error: documentiError },
    { data: terapieData,   error: terapieError },
  ] = await Promise.all([
    supabase.from('animali').select('*').eq('id', id).single(),
    supabase.from('impegni').select('*').eq('animale_id', id).order('data', { ascending: true }),
    supabase.from('documenti').select('*').eq('animale_id', id).order('created_at', { ascending: false }),
    supabase.from('terapie').select('*').eq('animale_id', id),
  ])

  if (animaleError || !animaleData) notFound()

  if (impegniError)   console.error('Errore caricamento impegni:', impegniError)
  if (documentiError) console.error('Errore caricamento documenti:', documentiError)
  if (terapieError)   console.error('Errore caricamento terapie:', terapieError)

  const animale   = animaleData as Animale
  const impegni   = (impegniData   ?? []) as Impegno[]
  const documenti = (documentiData ?? []) as Documento[]
  const terapieBase = (terapieData ?? []) as Terapia[]

  const terapiaIds = terapieBase.map(t => t.id)
  let tutteLeSomministrazioni: SomministrazioneTerapia[] = []

  if (terapiaIds.length > 0) {
    const { data: somministrazioniData, error: somministrazioniError } =
      await supabase
        .from('somministrazioni_terapia')
        .select('*')
        .in('terapia_id', terapiaIds)
        .order('somministrata_il', { ascending: false })

    if (somministrazioniError) {
      console.error('Errore caricamento somministrazioni:', somministrazioniError)
    } else {
      tutteLeSomministrazioni = (somministrazioniData ?? []) as SomministrazioneTerapia[]
    }
  }

  const somministrazioniPerTerapia = new Map<string, SomministrazioneTerapia>()
  for (const s of tutteLeSomministrazioni) {
    if (!somministrazioniPerTerapia.has(s.terapia_id)) {
      somministrazioniPerTerapia.set(s.terapia_id, s)
    }
  }

  const terapie: TerapiaConUltimaSomministrazione[] = terapieBase.map(t => ({
    ...t,
    ultimaSomministrazione: somministrazioniPerTerapia.get(t.id) ?? null,
  }))

  return (
    <SchedaAnimaleTab
      animale={animale}
      impegni={impegni}
      documenti={documenti}
      terapie={terapie}
      tabIniziale={tabIniziale}
    />
  )
}