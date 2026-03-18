import { formatData } from '@/lib/utils/date'
import type { Animale } from '@/lib/types/query.types'

const labelSesso: Record<string, string> = {
  maschio: 'Maschio',
  femmina: 'Femmina',
  non_specificato: 'Non specificato',
}

const labelCategoria: Record<string, string> = {
  cani: 'Cane', gatti: 'Gatto', pesci: 'Pesce', uccelli: 'Uccello',
  rettili: 'Rettile', piccoli_mammiferi: 'Piccolo mammifero', altri_animali: 'Altro',
}

function iconaCategoria(cat: string) {
  const m: Record<string, string> = {
    cani: '🐕', gatti: '🐈', pesci: '🐟', uccelli: '🦜',
    rettili: '🦎', piccoli_mammiferi: '🐹', altri_animali: '🐾',
  }
  return m[cat] ?? '🐾'
}

function Campo({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground capitalize">{label}</span>
      <span className="text-sm font-medium text-right">{valore}</span>
    </div>
  )
}

export function TabProfilo({ animale }: { animale: Animale }) {
  const meta = animale.meta_categoria as Record<string, string> | null

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
          {animale.foto_url
            ? (
              <img
                src={animale.foto_url}
                alt={animale.nome}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            )
            : <span className="text-4xl">{iconaCategoria(animale.categoria)}</span>
          }
        </div>
      </div>

      <div className="space-y-3">
        <Campo label="Categoria" valore={labelCategoria[animale.categoria] ?? animale.categoria} />
        <Campo label="Specie"    valore={animale.specie} />
        {animale.razza      && <Campo label="Razza"          valore={animale.razza} />}
        {animale.sesso      && <Campo label="Sesso"          valore={labelSesso[animale.sesso] ?? animale.sesso} />}
        {animale.data_nascita && <Campo label="Data di nascita" valore={formatData(animale.data_nascita)} />}
        {animale.peso != null && <Campo label="Peso"         valore={`${animale.peso} kg`} />}
        {meta && Object.entries(meta).map(([k, v]) => (
          <Campo key={k} label={k.replace(/_/g, ' ')} valore={v} />
        ))}
        {animale.note && <Campo label="Note" valore={animale.note} />}
      </div>
    </div>
  )
}