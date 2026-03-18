'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PawPrint, Bell, FileText, Plus } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const voci = [
  { href: '/home',      label: 'Home',      icon: Home },
  { href: '/animali',   label: 'Animali',   icon: PawPrint },
  null,
  { href: '/scadenze',  label: 'Scadenze',  icon: Bell },
  { href: '/documenti', label: 'Documenti', icon: FileText },
]

const vociAggiungi = [
  { href: '/animali/nuovo',    label: 'Nuovo animale',   descrizione: 'Aggiungi un profilo animale' },
  { href: '/scadenze/nuova',   label: 'Nuova scadenza',  descrizione: 'Visita, terapia, promemoria' },
  { href: '/documenti/carica', label: 'Nuovo documento', descrizione: 'Ricetta, referto, certificato' },
  { href: '/animali',          label: 'Nuovo evento',    descrizione: 'Scegli prima l\'animale a cui aggiungere l\'evento' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [menuAperto, setMenuAperto] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
          {voci.map((voce, i) => {
            if (!voce) {
              return (
                <button
                  key="add"
                  onClick={() => setMenuAperto(true)}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-foreground text-background -mt-5 shadow-md transition-transform active:scale-95"
                  aria-label="Aggiungi"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )
            }

            const Icon = voce.icon
            const attiva = pathname === voce.href || pathname.startsWith(voce.href + '/')

            return (
              <Link
                key={voce.href}
                href={voce.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                  attiva ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{voce.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <Sheet open={menuAperto} onOpenChange={setMenuAperto}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base">Aggiungi</SheetTitle>
          </SheetHeader>
          <div className="space-y-1">
            {vociAggiungi.map(voce => (
              <Link
                key={voce.href + voce.label}
                href={voce.href}
                onClick={() => setMenuAperto(false)}
                className="flex flex-col gap-0.5 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium">{voce.label}</span>
                <span className="text-xs text-muted-foreground">{voce.descrizione}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}