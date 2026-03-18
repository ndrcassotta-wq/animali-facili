import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { formatData } from '@/lib/utils/date'
import type { Animale } from '@/lib/types/query.types'

const labelCategoria: Record<string, string> = {
  cani: 'Cane', gatti: 'Gatto', pesci: 'Pesce', uccelli: 'Uccello',
  rettili: 'Rettile', piccoli_mammiferi: 'Piccolo mammifero', altri_animali: 'Altro',
}

function iconaCategoria(cat: string): string {
  const m: Record<string, string> = {
    cani: '🐕', gatti: '🐈', pesci: '🐟', uccelli: '🦜',
    rettili: '🦎', piccoli_mammiferi: '🐹', altri_animali: '🐾',
  }
  return m[cat] ?? '🐾'
}

export default async function ListaAnimaliPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: animaliRaw } = await supabase
    .from('animali')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const lista = (animaliRaw ?? []) as Animale[]

  return (
    <div>
      <PageHeader
        titolo="I tuoi animali"
        azione={
          <Button asChild size="sm" variant="outline">
            <Link href="/animali/nuovo">+ Aggiungi</Link>
          </Button>
        }
      />

      <div className="px-4 py-4">
        {lista.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Non hai ancora aggiunto nessun animale.
            </p>
            <Button asChild size="sm">
              <Link href="/animali/nuovo">Aggiungi il tuo animale</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {lista.map(a => (
              <Link
                key={a.id}
                href={`/animali/${a.id}`}
                className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
                  {a.foto_url
                    ? (
                      <img
                        src={a.foto_url}
                        alt={a.nome}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    )
                    : (
                      <span className="text-2xl" role="img" aria-label={a.categoria}>
                        {iconaCategoria(a.categoria)}
                      </span>
                    )
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {labelCategoria[a.categoria] ?? a.categoria} · {a.specie}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatData(a.created_at)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}