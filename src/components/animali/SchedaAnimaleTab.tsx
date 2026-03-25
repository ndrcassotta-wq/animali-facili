'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, FileText, Pill, User, ChevronRight } from 'lucide-react'
import { TabProfilo }   from '@/components/animali/TabProfilo'
import { TabImpegni }   from '@/components/animali/TabImpegni'
import { TabDocumenti } from '@/components/animali/TabDocumenti'
import TabTerapie       from '@/components/animali/TabTerapie'
import type { Animale, Impegno, Documento } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'

type Terapia = Database['public']['Tables']['terapie']['Row']
type SomministrazioneTerapia = Database['public']['Tables']['somministrazioni_terapia']['Row']
type TerapiaConUltimaSomministrazione = Terapia & {
  ultimaSomministrazione: SomministrazioneTerapia | null
}

type TabId = 'home' | 'profilo' | 'impegni' | 'documenti' | 'terapie'
const TAB_VALIDI: TabId[] = ['home', 'profilo', 'impegni', 'documenti', 'terapie']

const iconaCategoria: Record<string, string> = {
  cani: '🐕', gatti: '🐈', pesci: '🐟', uccelli: '🦜',
  rettili: '🦎', piccoli_mammiferi: '🐹', altri_animali: '🐾',
}

interface Props {
  animale:    Animale
  impegni:    Impegno[]
  documenti:  Documento[]
  terapie:    TerapiaConUltimaSomministrazione[]
  tabIniziale: TabId
}

export function SchedaAnimaleTab({ animale, impegni, documenti, terapie, tabIniziale }: Props) {
  const [tabAttivo, setTabAttivo] = useState<TabId>(
    tabIniziale === 'profilo' || tabIniziale === 'impegni' ||
    tabIniziale === 'documenti' || tabIniziale === 'terapie'
      ? tabIniziale : 'home'
  )

  function cambiaTab(tab: TabId) {
    setTabAttivo(tab)
    const url = new URL(window.location.href)
    if (tab === 'home') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tab)
    }
    window.history.replaceState(null, '', url.toString())
  }

  const impegniProssimi = impegni.filter(i => i.stato === 'programmato').length
  const terapieAttive   = terapie.filter(t => t.stato === 'attiva').length

  if (tabAttivo !== 'home') {
    return (
      <div>
        {/* Mini header con foto e nome */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
          <button onClick={() => cambiaTab('home')} className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0 border border-border">
              {animale.foto_url
                ? <img src={animale.foto_url} alt={animale.nome} className="w-full h-full object-cover" />
                : <span className="w-full h-full flex items-center justify-center text-base">{iconaCategoria[animale.categoria] ?? '🐾'}</span>
              }
            </div>
            <span className="text-sm font-semibold truncate">{animale.nome}</span>
          </button>

          {/* Tab pills */}
          <div className="flex gap-1">
            {(['impegni', 'terapie', 'documenti', 'profilo'] as TabId[]).map(tab => (
              <button
                key={tab}
                onClick={() => cambiaTab(tab)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  tabAttivo === tab
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {tabAttivo === 'profilo'   && <TabProfilo animale={animale} />}
        {tabAttivo === 'impegni'   && <TabImpegni animaleId={animale.id} impegni={impegni} />}
        {tabAttivo === 'documenti' && <TabDocumenti animaleId={animale.id} documenti={documenti} />}
        {tabAttivo === 'terapie'   && <TabTerapie animaleId={animale.id} terapie={terapie} />}
      </div>
    )
  }

  // HOME dell'animale
  return (
    <div>
      {/* Hero foto */}
      <div className="relative">
        <div className="w-full h-56 bg-muted overflow-hidden">
          {animale.foto_url
            ? <img src={animale.foto_url} alt={animale.nome} className="w-full h-full object-cover" />
            : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
                <span className="text-7xl">{iconaCategoria[animale.categoria] ?? '🐾'}</span>
              </div>
            )
          }
        </div>

        {/* Modifica button */}
        <Link
          href={`/animali/${animale.id}/modifica`}
          className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full"
        >
          Modifica
        </Link>
      </div>

      {/* Nome e info base */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-foreground">{animale.nome}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {animale.specie}
          {animale.razza ? ` · ${animale.razza}` : ''}
          {animale.sesso && animale.sesso !== 'non_specificato' ? ` · ${animale.sesso}` : ''}
        </p>
        {animale.data_nascita && (
          <p className="text-xs text-muted-foreground mt-1">
            🎂 {new Date(animale.data_nascita).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Card grandi 2x2 */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-3">

        <button
          onClick={() => cambiaTab('impegni')}
          className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-left active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Impegni</p>
            <p className="text-xs text-blue-600">
              {impegniProssimi > 0 ? `${impegniProssimi} programmati` : 'Nessuno in arrivo'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 self-end" />
        </button>

        <button
          onClick={() => cambiaTab('terapie')}
          className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-green-50 border border-green-100 text-left active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Pill className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">Terapie</p>
            <p className="text-xs text-green-600">
              {terapieAttive > 0 ? `${terapieAttive} attive` : 'Nessuna attiva'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-green-400 self-end" />
        </button>

        <button
          onClick={() => cambiaTab('documenti')}
          className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-left active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Documenti</p>
            <p className="text-xs text-amber-600">
              {documenti.length > 0 ? `${documenti.length} salvati` : 'Nessun documento'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 self-end" />
        </button>

        <button
          onClick={() => cambiaTab('profilo')}
          className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-purple-50 border border-purple-100 text-left active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900">Profilo</p>
            <p className="text-xs text-purple-600">Info e dettagli</p>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 self-end" />
        </button>

      </div>

      {/* Note se presenti */}
      {animale.note && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">{animale.note}</p>
        </div>
      )}
    </div>
  )
}