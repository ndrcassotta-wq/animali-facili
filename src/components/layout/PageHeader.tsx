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
    <header className={cn('flex items-center gap-3 px-4 py-4 border-b border-border', className)}>
      {backElement}
      <h1 className="flex-1 text-base font-semibold truncate">{titolo}</h1>
      {azione && <div className="shrink-0">{azione}</div>}
    </header>
  )
}