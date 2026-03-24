'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  titolo: string
  backHref?: string
  onBack?: () => void
  azione?: React.ReactNode
  className?: string
}

export function PageHeader({ titolo, backHref, onBack, azione, className }: PageHeaderProps) {
  const backElement = onBack ? (
    <button
      onClick={onBack}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Indietro"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  ) : backHref ? (
    <Link
      href={backHref}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Indietro"
    >
      <ArrowLeft className="w-5 h-5" />
    </Link>
  ) : null

  return (
    <>
      <header
        className={cn(
          'fixed left-0 right-0 top-0 z-40 flex items-center gap-3 px-4 border-b border-border bg-background',
          className
        )}
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          paddingBottom: '12px',
        }}
      >
        {backElement}
        <h1 className="flex-1 text-base font-semibold truncate">{titolo}</h1>
        {azione && <div className="shrink-0">{azione}</div>}
      </header>
      <div style={{ height: 'calc(env(safe-area-inset-top) + 20px)' }} />
    </>
  )
}