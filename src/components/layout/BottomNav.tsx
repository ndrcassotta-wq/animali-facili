'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PawPrint, Calendar, FileText, Plus } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const voci = [
  { href: '/home',     label: 'Home',      icon: Home },
  { href: '/animali',  label: 'Animali',   icon: PawPrint },
  null,
  { href: '/impegni',  label: 'Impegni',   icon: Calendar },
  { href: '/documenti',label: 'Documenti', icon: FileText },
]

const vociAggiungi = [
  {
    href: '/animali/nuovo',
    label: 'Nuovo animale',
    descrizione: 'Aggiungi un profilo animale',
  },
  {
    href: '/impegni/nuovo',
    label: 'Nuovo impegno',
    descrizione: 'Visita, vaccino, toelettatura...',
  },
  {
    href: '/documenti/carica',
    label: 'Nuovo documento',
    descrizione: 'Ricetta, referto, certificato',
  },
  {
    href: '/animali',
    label: 'Nuova terapia',
    descrizione: 'Scegli prima l\'animale a cui aggiungere la terapia',
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const [menuAperto, setMenuAperto] = useState(false)

  function isAttiva(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {voci.map((voce) => {
            if (!voce) {
              return (
                <button
                  key="add"
                  onClick={() => setMenuAperto(true)}
                  className="flex h-12 w-12 -mt-5 items-center justify-center rounded-full bg-foreground text-background shadow-md transition-transform active:scale-95"
                  aria-label="Aggiungi"
                  type="button"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )
            }

            const Icon = voce.icon
            const attiva = isAttiva(voce.href)

            return (
              <Link
                key={voce.href}
                href={voce.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 transition-colors',
                  attiva
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={attiva ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{voce.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <Sheet open={menuAperto} onOpenChange={setMenuAperto}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl pb-8"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base">Aggiungi</SheetTitle>
          </SheetHeader>

          <div className="space-y-1">
            {vociAggiungi.map((voce) => (
              <Link
                key={voce.href + voce.label}
                href={voce.href}
                onClick={() => setMenuAperto(false)}
                className="flex flex-col gap-0.5 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
              >
                <span className="text-sm font-medium">{voce.label}</span>
                <span className="text-xs text-muted-foreground">
                  {voce.descrizione}
                </span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}