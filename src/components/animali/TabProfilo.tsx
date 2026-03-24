import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatData } from '@/lib/utils/date'
import type { Animale } from '@/lib/types/query.types'
import { AzioniAnimale } from '@/components/animali/AzioniAnimale'

const labelSesso: Record<string, string> = {
  maschio: 'Maschio',
  femmina: 'Femmina',
  non_specificato: 'Non specificato',
}

const labelCategoria: Record<string, string> = {
  cani: 'Cane',
  gatti: 'Gatto',
  pesci: 'Pesce',
  uccelli: 'Uccello',
  rettili: 'Rettile',
  piccoli_mammiferi: 'Piccolo mammifero',
  altri_animali: 'Altro',
}

function iconaCategoria(cat: string) {
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
    return `${categoria} · ${animale.razza}`
  }

  return `${categoria} · ${animale.specie}`
}

function Campo({
  label,
  valore,
  multilinea = false,
}: {
  label: string
  valore: string
  multilinea?: boolean
}) {
  if (multilinea) {
    return (
      <div className="space-y-1 border-b border-border py-3 last:border-0">
        <span className="text-sm capitalize text-muted-foreground">{label}</span>
        <p className="whitespace-pre-wrap text-sm font-medium">{valore}</p>
      </div>
    )
  }

  return (
    <div className="flex justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-sm capitalize text-muted-foreground">{label}</span>
      <span className="whitespace-pre-wrap text-right text-sm font-medium">
        {valore}
      </span>
    </div>
  )
}

export function TabProfilo({ animale }: { animale: Animale }) {
  const meta = animale.meta_categoria as Record<string, string> | null
  const sottotitolo = getSottotitolo(animale)

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
            {animale.foto_url ? (
              <img
                src={animale.foto_url}
                alt={animale.nome}
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-4xl">{iconaCategoria(animale.categoria)}</span>
            )}
          </div>

          <h2 className="mt-3 text-xl font-semibold">{animale.nome}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{sottotitolo}</p>

          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href={`/animali/${animale.id}/modifica`}>
              Modifica animale
            </Link>
          </Button>

          <div className="mt-2 w-full">
            <AzioniAnimale
              animaleId={animale.id}
              animaleNome={animale.nome}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Campo
            label="Categoria"
            valore={labelCategoria[animale.categoria] ?? animale.categoria}
          />
          <Campo label="Specie" valore={animale.specie} />
          {animale.razza && <Campo label="Razza" valore={animale.razza} />}
          {animale.sesso && (
            <Campo
              label="Sesso"
              valore={labelSesso[animale.sesso] ?? animale.sesso}
            />
          )}
          {animale.data_nascita && (
            <Campo
              label="Data di nascita"
              valore={formatData(animale.data_nascita)}
            />
          )}
          {animale.peso != null && (
            <Campo label="Peso" valore={`${animale.peso} kg`} />
          )}
          {meta &&
            Object.entries(meta).map(([k, v]) => (
              <Campo key={k} label={k.replace(/_/g, ' ')} valore={v} />
            ))}
          {animale.note && (
            <Campo label="Note" valore={animale.note} multilinea />
          )}
        </div>
      </div>
    </div>
  )
}