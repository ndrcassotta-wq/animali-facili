'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Plus, Stethoscope, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const VOCI = [
  { label: 'Home',      href: '/home',      icon: Home },
  { label: 'Impegni',   href: '/impegni',   icon: Calendar },
  { label: null,        href: '/nuovo',      icon: Plus },
  { label: 'Terapie',   href: '/terapie',   icon: Stethoscope },
  { label: 'Documenti', href: '/documenti',  icon: FolderOpen },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100">
      <div className="flex items-end justify-around px-2 pt-2 pb-safe max-w-lg mx-auto"
           style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        {VOCI.map((voce) => {
          if (voce.label === null) {
            return (
              <Link
                key="centrale"
                href={voce.href}
                className="flex flex-col items-center -mt-5 active:scale-90 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-200 flex items-center justify-center">
                  <Plus size={28} strokeWidth={2.5} className="text-white" />
                </div>
              </Link>
            )
          }

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
  )
}