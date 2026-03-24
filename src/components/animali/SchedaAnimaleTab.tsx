'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TabProfilo } from '@/components/animali/TabProfilo'
import { TabImpegni } from '@/components/animali/TabImpegni'
import { TabDocumenti } from '@/components/animali/TabDocumenti'
import TabTerapie from '@/components/animali/TabTerapie'
import type { Animale, Impegno, Documento } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'

type Terapia = Database['public']['Tables']['terapie']['Row']
type SomministrazioneTerapia =
  Database['public']['Tables']['somministrazioni_terapia']['Row']
type TerapiaConUltimaSomministrazione = Terapia & {
  ultimaSomministrazione: SomministrazioneTerapia | null
}

type TabId = 'profilo' | 'impegni' | 'documenti' | 'terapie'

const TAB_VALIDI: TabId[] = ['profilo', 'impegni', 'documenti', 'terapie']

const TAB_LABELS: Record<TabId, string> = {
  profilo: 'Profilo',
  impegni: 'Impegni',
  documenti: 'Documenti',
  terapie: 'Terapie',
}

interface Props {
  animale: Animale
  impegni: Impegno[]
  documenti: Documento[]
  terapie: TerapiaConUltimaSomministrazione[]
  tabIniziale: TabId
}

export function SchedaAnimaleTab({
  animale,
  impegni,
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
      <div className="border-b border-border">
        <TabsList className="grid h-auto w-full grid-cols-4 rounded-none bg-transparent p-0">
          {TAB_VALIDI.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="min-w-0 rounded-none border-b-2 border-transparent px-2 py-3 text-center text-xs whitespace-nowrap data-[state=active]:border-foreground data-[state=active]:bg-transparent sm:text-sm"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabAttivo !== 'profilo' && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              {animale.foto_url ? (
                <img
                  src={animale.foto_url}
                  alt={animale.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm">🐾</span>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{animale.nome}</p>
            </div>
          </div>
        </div>
      )}

      <TabsContent value="profilo" className="mt-0">
        <TabProfilo animale={animale} />
      </TabsContent>

      <TabsContent value="impegni" className="mt-0">
        <TabImpegni animaleId={animale.id} impegni={impegni} />
      </TabsContent>

      <TabsContent value="documenti" className="mt-0">
        <TabDocumenti animaleId={animale.id} documenti={documenti} />
      </TabsContent>

      <TabsContent value="terapie" className="mt-0">
        <TabTerapie animaleId={animale.id} terapie={terapie} />
      </TabsContent>
    </Tabs>
  )
}