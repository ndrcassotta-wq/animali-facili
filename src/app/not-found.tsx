import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
      <p className="text-sm text-muted-foreground">Pagina non trovata.</p>
      <Button asChild size="sm" variant="outline">
        <Link href="/home">Torna alla home</Link>
      </Button>
    </div>
  )
}