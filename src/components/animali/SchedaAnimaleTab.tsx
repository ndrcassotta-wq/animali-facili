'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, FolderOpen, Stethoscope, User, ArrowLeft, Pencil } from 'lucide-react'
import { TabProfilo }   from '@/components/animali/TabProfilo'
import { TabImpegni }   from '@/components/animali/TabImpegni'
import { TabDocumenti } from '@/components/animali/TabDocumenti'
import TabTerapie       from '@/components/animali/TabTerapie'
import type { Animale, Impegno, Documento } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

type Terapia = Database['public']['Tables']['terapie']['Row']
type SomministrazioneTerapia = Database['public']['Tables']['somministrazioni_terapia']['Row']
type TerapiaConUltimaSomministrazione = Terapia & {
  ultimaSomministrazione: SomministrazioneTerapia | null
}

type TabId = 'home' | 'profilo' | 'impegni' | 'documenti' | 'terapie'

const iconaCategoria: Record<string, string> = {
  cani: '🐕', gatti: '🐈', pesci: '🐟', uccelli: '🦜',
  rettili: '🦎', piccoli_mammiferi: '🐹', altri_animali: '🐾',
}

const coloreCategoria: Record<string, string> = {
  cani: 'bg-amber-100', gatti: 'bg-orange-100', pesci: 'bg-sky-100',
  uccelli: 'bg-lime-100', rettili: 'bg-green-100',
  piccoli_mammiferi: 'bg-rose-100', altri_animali: 'bg-violet-100',
}

interface Props {
  animale:     Animale
  impegni:     Impegno[]
  documenti:   Documento[]
  terapie:     TerapiaConUltimaSomministrazione[]
  tabIniziale: TabId
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'impegni',   label: 'Impegni' },
  { id: 'terapie',   label: 'Terapie' },
  { id: 'documenti', label: 'Documenti' },
  { id: 'profilo',   label: 'Profilo' },
]

export function SchedaAnimaleTab({ animale, impegni, documenti, terapie, tabIniziale }: Props) {
  const router = useRouter()
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

  // ── TAB CONTENT ────────────────────────────────────────────────────────────
  if (tabAttivo !== 'home') {
    return (
      <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>

        <header className="shrink-0 bg-[#FDF8F3] px-5 pt-10 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => cambiaTab('home')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 active:opacity-70"
            >
              <ArrowLeft size={20} strokeWidth={2.2} className="text-gray-600" />
            </button>

            <div className="flex flex-1 items-center gap-2.5 min-w-0">
              <div className={cn(
                'h-9 w-9 shrink-0 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center',
                !animale.foto_url && (coloreCategoria[animale.categoria] ?? 'bg-gray-100')
              )}>
                {animale.foto_url
                  ? <img src={animale.foto_url} alt={animale.nome} className="h-full w-full object-cover" />
                  : <span className="text-base leading-none">{iconaCategoria[animale.categoria] ?? '🐾'}</span>
                }
              </div>
              <span className="text-base font-extrabold text-gray-900 truncate">{animale.nome}</span>
            </div>

            <Link
              href={`/animali/${animale.id}/modifica`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100"
            >
              <Pencil size={16} strokeWidth={2.2} className="text-gray-500" />
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-5 px-5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => cambiaTab(tab.id)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors',
                  tabAttivo === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="border-b border-gray-100" />
        </header>

        <div className="flex-1 overflow-y-auto">
          {tabAttivo === 'profilo'   && <TabProfilo   animale={animale} />}
          {tabAttivo === 'impegni'   && <TabImpegni   animaleId={animale.id} impegni={impegni} />}
          {tabAttivo === 'documenti' && <TabDocumenti animaleId={animale.id} documenti={documenti} />}
          {tabAttivo === 'terapie'   && <TabTerapie   animaleId={animale.id} terapie={terapie} />}
        </div>

      </div>
    )
  }

  // ── HOME ANIMALE ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>

      {/* Hero */}
      <div className="relative w-full" style={{ height: '300px' }}>
        {animale.foto_url ? (
          <img
            src={animale.foto_url}
            alt={animale.nome}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={cn(
            'h-full w-full flex items-center justify-center',
            coloreCategoria[animale.categoria] ?? 'bg-gray-100'
          )}>
            <span style={{ fontSize: '7rem', lineHeight: 1 }}>
              {iconaCategoria[animale.categoria] ?? '🐾'}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <button
          onClick={() => router.back()}
          className="absolute left-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm active:opacity-70"
        >
          <ArrowLeft size={20} strokeWidth={2.2} className="text-white" />
        </button>

        <Link
          href={`/animali/${animale.id}/modifica`}
          className="absolute right-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
        >
          <Pencil size={16} strokeWidth={2.2} className="text-white" />
        </Link>

        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            {animale.nome}
          </h1>
          <p className="mt-0.5 text-sm text-white/80">
            {animale.specie}
            {animale.razza ? ` · ${animale.razza}` : ''}
            {animale.sesso && animale.sesso !== 'non_specificato' ? ` · ${animale.sesso}` : ''}
          </p>
          {animale.data_nascita && (
            <p className="mt-0.5 text-xs text-white/70">
              🎂 {new Date(animale.data_nascita).toLocaleDateString('it-IT', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          )}
        </div>
      </div>

      {/* Card 2x2 centrate */}
      <div className="px-5 pt-5 pb-32 grid grid-cols-2 gap-4">

        <button
          onClick={() => cambiaTab('impegni')}
          className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-blue-50 border border-blue-100 text-center active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Calendar size={24} strokeWidth={2} className="text-blue-600" />
          </div>
          <div>
            <p className="text-base font-extrabold text-blue-900">Impegni</p>
            <p className="text-xs text-blue-500 mt-0.5">
              {impegniProssimi > 0 ? `${impegniProssimi} programmati` : 'Nessuno in arrivo'}
            </p>
          </div>
        </button>

        <button
          onClick={() => cambiaTab('terapie')}
          className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-teal-50 border border-teal-100 text-center active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
            <Stethoscope size={24} strokeWidth={2} className="text-teal-600" />
          </div>
          <div>
            <p className="text-base font-extrabold text-teal-900">Terapie</p>
            <p className="text-xs text-teal-500 mt-0.5">
              {terapieAttive > 0 ? `${terapieAttive} attive` : 'Nessuna attiva'}
            </p>
          </div>
        </button>

        <button
          onClick={() => cambiaTab('documenti')}
          className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-slate-100 border border-slate-200 text-center active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center">
            <FolderOpen size={24} strokeWidth={2} className="text-slate-600" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-800">Documenti</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {documenti.length > 0 ? `${documenti.length} salvati` : 'Nessun documento'}
            </p>
          </div>
        </button>

        <button
          onClick={() => cambiaTab('profilo')}
          className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-violet-50 border border-violet-100 text-center active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
            <User size={24} strokeWidth={2} className="text-violet-600" />
          </div>
          <div>
            <p className="text-base font-extrabold text-violet-900">Profilo</p>
            <p className="text-xs text-violet-500 mt-0.5">Info e dettagli</p>
          </div>
        </button>

      </div>

      {/* Note */}
      {animale.note && (
        <div className="mx-5 mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Note</p>
          <p className="text-sm text-gray-600">{animale.note}</p>
        </div>
      )}

    </div>
  )
}