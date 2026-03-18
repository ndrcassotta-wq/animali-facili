'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TabProfilo }   from '@/components/animali/TabProfilo'
import { TabScadenze }  from '@/components/animali/TabScadenze'
import { TabEventi }    from '@/components/animali/TabEventi'
import { TabDocumenti } from '@/components/animali/TabDocumenti'
import type { Animale, Scadenza, Evento, Documento } from '@/lib/types/query.types'

type TabId = 'profilo' | 'scadenze' | 'eventi' | 'documenti'
const TAB_VALIDI: TabId[] = ['profilo', 'scadenze', 'eventi', 'documenti']

interface Props {
  animale:     Animale
  scadenze:    Scadenza[]
  eventi:      Evento[]
  documenti:   Documento[]
  tabIniziale: TabId
}

export function SchedaAnimaleTab({
  animale,
  scadenze,
  eventi,
  documenti,
  tabIniziale,
}: Props) {
  const [tabAttivo, setTabAttivo] = useState<TabId>(tabIniziale)

  function cambiaTab(val: string) {
    const tab = TAB_VALIDI.includes(val as TabId) ? (val as TabId) : 'profilo'
    setTabAttivo(tab)
    const url = new URL(window.location.href)
    if (tab === 'profilo') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tab)
    }
    window.history.replaceState(null, '', url.toString())
  }

  return (
    <Tabs value={tabAttivo} onValueChange={cambiaTab} className="w-full">
      <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
        {TAB_VALIDI.map(tab => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-3 text-xs capitalize"
          >
            {tab}
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
    </Tabs>
  )
}