import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatData } from '@/lib/utils/date'
import type { Animale } from '@/lib/types/query.types'

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

function Campo({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm capitalize text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium whitespace-pre-wrap">
        {valore}
      </span>
    </div>
  )
}

export function TabProfilo({ animale }: { animale: Animale }) {
  const meta = animale.meta_categoria as Record<string, string> | null

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex justify-center">
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
      </div>

      <Button asChild variant="outline" className="w-full">
        <Link href={`/animali/${animale.id}/modifica`}>
          Modifica animale
        </Link>
      </Button>

      <div className="space-y-3">
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
        {animale.note && <Campo label="Note" valore={animale.note} />}
      </div>
    </div>
  )
}