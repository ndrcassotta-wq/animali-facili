'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TabProfilo } from '@/components/animali/TabProfilo'
import { TabScadenze } from '@/components/animali/TabScadenze'
import { TabEventi } from '@/components/animali/TabEventi'
import { TabDocumenti } from '@/components/animali/TabDocumenti'
import TabTerapie from '@/components/animali/TabTerapie'
import type { Animale, Scadenza, Evento, Documento } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'

type Terapia = Database['public']['Tables']['terapie']['Row']
type SomministrazioneTerapia =
  Database['public']['Tables']['somministrazioni_terapia']['Row']

type TerapiaConUltimaSomministrazione = Terapia & {
  ultimaSomministrazione: SomministrazioneTerapia | null
}

type TabId = 'profilo' | 'scadenze' | 'eventi' | 'documenti' | 'terapie'

const TAB_VALIDI: TabId[] = [
  'profilo',
  'scadenze',
  'eventi',
  'documenti',
  'terapie',
]

const TAB_LABELS: Record<TabId, string> = {
  profilo: 'Profilo',
  scadenze: 'Scadenze',
  eventi: 'Eventi',
  documenti: 'Documenti',
  terapie: 'Terapie',
}

interface Props {
  animale: Animale
  scadenze: Scadenza[]
  eventi: Evento[]
  documenti: Documento[]
  terapie: TerapiaConUltimaSomministrazione[]
  tabIniziale: TabId
}

export function SchedaAnimaleTab({
  animale,
  scadenze,
  eventi,
  documenti,
  terapie,
  tabIniziale,
}: Props) {
  const [tabAttivo, setTabAttivo] = useState<TabId>(tabIniziale)

  function cambiaTab(valore: string) {
    const nuovaTab = TAB_VALIDI.includes(valore as TabId)
      ? (valore as TabId)
      : 'profilo'

    setTabAttivo(nuovaTab)

    const url = new URL(window.location.href)

    if (nuovaTab === 'profilo') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', nuovaTab)
    }

    window.history.replaceState(null, '', url.toString())
  }

  return (
    <Tabs value={tabAttivo} onValueChange={cambiaTab} className="w-full">
      <TabsList className="h-auto w-full rounded-none border-b border-border bg-transparent p-0">
        {TAB_VALIDI.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="flex-1 rounded-none border-b-2 border-transparent py-3 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent"
          >
            {TAB_LABELS[tab]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="profilo">
        <TabProfilo animale={animale} />
      </TabsContent>

      <TabsContent value="scadenze">
        <TabScadenze animaleId={animale.id} scadenze={scadenze} />
      </TabsContent>

      <TabsContent value="eventi">
        <TabEventi animaleId={animale.id} eventi={eventi} />
      </TabsContent>

      <TabsContent value="documenti">
        <TabDocumenti animaleId={animale.id} documenti={documenti} />
      </TabsContent>

      <TabsContent value="terapie">
        <TabTerapie animaleId={animale.id} terapie={terapie} />
      </TabsContent>
    </Tabs>
  )
}