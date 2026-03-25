import Link from 'next/link'
import { formatData } from '@/lib/utils/date'
import type { Animale } from '@/lib/types/query.types'
import { AzioniAnimale } from '@/components/animali/AzioniAnimale'
import { Pencil } from 'lucide-react'

const labelSesso: Record<string, string> = {
  maschio: 'Maschio',
  femmina: 'Femmina',
  non_specificato: 'Non specificato',
}

const labelCategoria: Record<string, string> = {
  cani: 'Cane', gatti: 'Gatto', pesci: 'Pesce', uccelli: 'Uccello',
  rettili: 'Rettile', piccoli_mammiferi: 'Piccolo mammifero', altri_animali: 'Altro',
}

const iconaCategoria: Record<string, string> = {
  cani: '🐕', gatti: '🐈', pesci: '🐟', uccelli: '🦜',
  rettili: '🦎', piccoli_mammiferi: '🐹', altri_animali: '🐾',
}

const coloreCategoria: Record<string, string> = {
  cani: 'bg-amber-100', gatti: 'bg-orange-100', pesci: 'bg-sky-100',
  uccelli: 'bg-lime-100', rettili: 'bg-green-100',
  piccoli_mammiferi: 'bg-rose-100', altri_animali: 'bg-violet-100',
}

function RigaInfo({
  label, valore, multilinea = false,
}: {
  label: string; valore: string; multilinea?: boolean
}) {
  if (multilinea) {
    return (
      <div className="space-y-1 border-b border-gray-100 py-3 last:border-0">
        <span className="text-sm text-gray-400">{label}</span>
        <p className="whitespace-pre-wrap text-sm font-semibold text-gray-800">{valore}</p>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-right text-sm font-semibold text-gray-800">{valore}</span>
    </div>
  )
}

export function TabProfilo({ animale }: { animale: Animale }) {
  const meta = animale.meta_categoria as Record<string, string> | null

  return (
    <div className="px-5 py-5 space-y-4 pb-32">

      {/* Card foto + nome */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center gap-3">
        <div className={`h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg flex items-center justify-center ${!animale.foto_url ? (coloreCategoria[animale.categoria] ?? 'bg-gray-100') : ''}`}>
          {animale.foto_url
            ? <img src={animale.foto_url} alt={animale.nome} className="h-full w-full object-cover" />
            : <span className="text-4xl">{iconaCategoria[animale.categoria] ?? '🐾'}</span>
          }
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">{animale.nome}</h2>
          <p className="mt-0.5 text-sm text-gray-400">
            {labelCategoria[animale.categoria] ?? animale.categoria}
            {animale.razza ? ` · ${animale.razza}` : animale.specie ? ` · ${animale.specie}` : ''}
          </p>
        </div>
      </div>

      {/* Card dati */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-5 py-2">
        <RigaInfo label="Categoria" valore={labelCategoria[animale.categoria] ?? animale.categoria} />
        {animale.specie && <RigaInfo label="Specie" valore={animale.specie} />}
        {animale.razza  && <RigaInfo label="Razza"  valore={animale.razza} />}
        {animale.sesso  && animale.sesso !== 'non_specificato' && (
          <RigaInfo label="Sesso" valore={labelSesso[animale.sesso] ?? animale.sesso} />
        )}
        {animale.data_nascita && (
          <RigaInfo label="Data di nascita" valore={formatData(animale.data_nascita)} />
        )}
        {animale.peso != null && (
          <RigaInfo label="Peso" valore={`${animale.peso} kg`} />
        )}
        {meta && Object.entries(meta).map(([k, v]) => (
          <RigaInfo key={k} label={k.replace(/_/g, ' ')} valore={v} />
        ))}
        {animale.note && (
          <RigaInfo label="Note" valore={animale.note} multilinea />
        )}
      </div>

      {/* Pulsante modifica — stessa dimensione dell'elimina */}
      <Link
        href={`/animali/${animale.id}/modifica`}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-600 shadow-sm active:scale-[0.98] transition-all"
      >
        <Pencil size={16} strokeWidth={2.2} />
        Modifica animale
      </Link>

      {/* Pulsante elimina — in fondo */}
      <AzioniAnimale animaleId={animale.id} animaleNome={animale.nome} />

    </div>
  )
}