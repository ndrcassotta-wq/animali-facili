'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Calendar, Plus, Stethoscope, FolderOpen, X,
  PawPrint,
} from 'lucide-react'
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
  { icon: PawPrint,    label: 'Nuovo animale',   href: '/animali/nuovo', color: 'text-amber-500',  bg: 'bg-amber-50' },
  { icon: Calendar,    label: 'Nuovo impegno',   href: '/impegni/nuovo', color: 'text-blue-500',   bg: 'bg-blue-50' },
  { icon: Stethoscope, label: 'Nuova terapia',   href: '/terapie/nuovo', color: 'text-teal-500',   bg: 'bg-teal-50' },
  { icon: FolderOpen,  label: 'Nuovo documento', href: '/documenti',     color: 'text-violet-500', bg: 'bg-violet-50' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [aperto, setAperto] = useState(false)

  return (
    <>
      {aperto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setAperto(false)}
          />

          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white px-5 shadow-2xl"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mt-3 mb-6 h-1 w-12 rounded-full bg-gray-200" />

            <p className="mb-5 text-center text-sm font-bold uppercase tracking-widest text-gray-400">
              Cosa vuoi aggiungere?
            </p>

            <div className="space-y-3 pb-2">
              {SCELTE.map((scelta) => {
                const Icona = scelta.icon

                return (
                  <button
                    key={scelta.href}
                    onClick={() => {
                      setAperto(false)
                      router.push(scelta.href)
                    }}
                    className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left shadow-sm transition-colors active:bg-gray-50"
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                        scelta.bg
                      )}
                    >
                      <Icona
                        size={24}
                        strokeWidth={2}
                        className={scelta.color}
                      />
                    </div>

                    <span className="text-lg font-bold text-gray-800">
                      {scelta.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setAperto(false)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-4 text-base font-semibold text-gray-400 active:bg-gray-50"
            >
              <X size={18} />
              Annulla
            </button>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 bg-white/95 backdrop-blur-md">
        <div
          className="mx-auto flex max-w-lg items-end justify-around px-2 pt-2"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {VOCI.map((voce) => {
            if (voce.label === null) {
              return (
                <button
                  key="centrale"
                  onClick={() => setAperto(true)}
                  className="flex flex-col items-center -mt-5 transition-transform active:scale-90"
                >
                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200',
                      aperto
                        ? 'bg-gray-800 shadow-gray-300'
                        : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-200'
                    )}
                  >
                    <Plus
                      size={30}
                      strokeWidth={2.5}
                      color="white"
                      className={cn(
                        'transition-transform duration-200',
                        aperto ? 'rotate-45' : 'rotate-0'
                      )}
                    />
                  </div>
                </button>
              )
            }

            const Icona = voce.icon
            const attiva =
              pathname === voce.href || pathname.startsWith(voce.href + '/')

            return (
              <Link
                key={voce.href}
                href={voce.href}
                className="flex min-w-[52px] flex-col items-center gap-1 pb-1 transition-transform active:scale-90"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
                    attiva ? 'bg-amber-50' : 'bg-transparent'
                  )}
                >
                  <Icona
                    size={24}
                    strokeWidth={attiva ? 2.5 : 2}
                    className={attiva ? 'text-amber-500' : 'text-gray-500'}
                  />
                </div>

                <span
                  className={cn(
                    'text-[10px] font-semibold tracking-wide transition-colors',
                    attiva ? 'text-amber-500' : 'text-gray-500'
                  )}
                >
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