import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import type { Animale } from '@/lib/types/query.types'

const labelCategoria: Record<string, string> = {
  cani: 'Cane',
  gatti: 'Gatto',
  pesci: 'Pesce',
  uccelli: 'Uccello',
  rettili: 'Rettile',
  piccoli_mammiferi: 'Piccolo mammifero',
  altri_animali: 'Altro',
}

function iconaCategoria(cat: string): string {
  const m: Record<string, string> = {
    cani: '🐕',
    gatti: '🐈',
    pesci: '🐟',
    uccelli: '🦜',
    rettili: '🦎',
    piccoli_mammiferi: '🐹',
    altri_animali: '🐾',
  }
  return m[cat] ?? '🐾'
}

function getSottotitolo(animale: Animale) {
  const categoria = labelCategoria[animale.categoria] ?? animale.categoria

  if (animale.razza) {
    return `${categoria} · ${animale.specie} · ${animale.razza}`
  }

  return `${categoria} · ${animale.specie}`
}

export default async function ListaAnimaliPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: animaliRaw } = await supabase
    .from('animali')
    .select('*')
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
          <div className="space-y-3 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Non hai ancora aggiunto nessun animale.
            </p>
            <Button asChild size="sm">
              <Link href="/animali/nuovo">Aggiungi il tuo animale</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {lista.map((animale) => (
              <Link
                key={animale.id}
                href={`/animali/${animale.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                  {animale.foto_url ? (
                    <img
                      src={animale.foto_url}
                      alt={animale.nome}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-2xl"
                      role="img"
                      aria-label={animale.categoria}
                    >
                      {iconaCategoria(animale.categoria)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{animale.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getSottotitolo(animale)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}