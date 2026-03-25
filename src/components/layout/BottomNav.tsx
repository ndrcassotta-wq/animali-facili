'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Plus, Stethoscope, FolderOpen, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const VOCI = [
  { label: 'Home',      href: '/home',      icon: Home },
  { label: 'Impegni',   href: '/impegni',   icon: Calendar },
  { label: null,        href: null,         icon: Plus },
  { label: 'Terapie',   href: '/terapie',   icon: Stethoscope },
  { label: 'Documenti', href: '/documenti', icon: FolderOpen },
] as const

const SCELTE = [
  { emoji: '🐾', label: 'Nuovo animale',   href: '/animali/nuovo' },
  { emoji: '📅', label: 'Nuovo impegno',   href: '/impegni/nuovo' },
  { emoji: '💊', label: 'Nuova terapia',   href: '/terapie/nuovo' },
  { emoji: '📄', label: 'Nuovo documento', href: '/documenti/nuovo' },
]

export function BottomNav() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [aperto, setAperto] = useState(false)

  return (
    <>
      {/* ── BOTTOM SHEET ──────────────────────────────────────────────── */}
      {aperto && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setAperto(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white px-5 pb-safe shadow-2xl"
               style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>

            {/* Handle */}
            <div className="mx-auto mt-3 mb-5 h-1 w-10 rounded-full bg-gray-200" />

            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
              Cosa vuoi aggiungere?
            </p>

            <div className="space-y-2 pb-2">
              {SCELTE.map(scelta => (
                <button
                  key={scelta.href}
                  onClick={() => { setAperto(false); router.push(scelta.href) }}
                  className="flex w-full items-center gap-4 rounded-2xl bg-gray-50 px-4 py-4 text-left transition-colors active:bg-amber-50"
                >
                  <span className="text-2xl">{scelta.emoji}</span>
                  <span className="text-base font-semibold text-gray-800">{scelta.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setAperto(false)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-400"
            >
              <X size={16} />
              Annulla
            </button>
          </div>
        </>
      )}

      {/* ── NAV ───────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100">
        <div
          className="flex items-end justify-around px-2 pt-2 max-w-lg mx-auto"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {VOCI.map((voce, i) => {

            // ── Pulsante + centrale ──────────────────────────────────────
            if (voce.label === null) {
              return (
                <button
                  key="centrale"
                  onClick={() => setAperto(true)}
                  className="flex flex-col items-center -mt-5 active:scale-90 transition-transform"
                >
                  <div className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform',
                    aperto
                      ? 'bg-gray-800 shadow-gray-300'
                      : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-200'
                  )}>
                    <Plus
                      size={28}
                      strokeWidth={2.5}
                      className={cn('transition-transform duration-200', aperto ? 'rotate-45' : 'rotate-0')}
                      color="white"
                    />
                  </div>
                </button>
              )
            }

            // ── Voci normali ─────────────────────────────────────────────
            const Icona  = voce.icon
            const attiva = pathname === voce.href || pathname.startsWith(voce.href + '/')

            return (
              <Link
                key={voce.href}
                href={voce.href}
                className="flex flex-col items-center gap-1 min-w-[52px] pb-1 active:scale-90 transition-transform"
              >
                <div className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center transition-colors',
                  attiva ? 'bg-amber-50' : 'bg-transparent'
                )}>
                  <Icona
                    size={22}
                    strokeWidth={attiva ? 2.5 : 1.8}
                    className={attiva ? 'text-amber-500' : 'text-gray-400'}
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold tracking-wide transition-colors',
                  attiva ? 'text-amber-500' : 'text-gray-400'
                )}>
                  {voce.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}