import Link from 'next/link'
import { Building2, Search } from 'lucide-react'
import { PartnerFilters } from '@/components/partner/PartnerFilters'
import { PartnerCard } from '@/components/partner/PartnerCard'
import {
  isPartnerCategory,
  isPartnerSpecies,
} from '@/lib/constants/partners'
import { getApprovedPartners } from '@/lib/partners/queries'

type SearchParams = Promise<{
  q?: string | string[]
  categoria?: string | string[]
  luogo?: string | string[]
  specie?: string | string[]
}>

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function ProfessionistiPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  const q = pickFirst(params.q)?.trim() || undefined
  const categoriaRaw = pickFirst(params.categoria)?.trim()
  const luogo = pickFirst(params.luogo)?.trim() || undefined
  const specieRaw = pickFirst(params.specie)?.trim()

  const filters = {
    q,
    categoria: isPartnerCategory(categoriaRaw) ? categoriaRaw : undefined,
    luogo,
    specie: isPartnerSpecies(specieRaw) ? specieRaw : undefined,
  }

  const partners = await getApprovedPartners(filters)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-5 md:pb-20 md:pt-8">
      <header className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:rounded-[32px] md:p-8">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-[#8B5E3C]">
              Professionisti / Attività
            </p>

            <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-slate-900 md:text-4xl">
              Trova professionisti e attività utili per il tuo animale
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Cerca tra veterinari, toelettatori, pet sitter, educatori,
              pensioni, allevatori e negozi specializzati.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/partner/candidatura"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#EADFD3] bg-[#FFF9F5] px-5 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              Inserisci la tua attività
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-5">
        <PartnerFilters basePath="/professionisti" values={filters} />
      </section>

      <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
        <Search className="h-4 w-4" />
        <p>
          {partners.length}{' '}
          {partners.length === 1 ? 'attività trovata' : 'attività trovate'}
        </p>
      </div>

      {partners.length === 0 ? (
        <div className="mt-5 rounded-[28px] border border-dashed border-[#D9C4B2] bg-[#FFF9F5] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <Building2 className="h-6 w-6 text-[#8B5E3C]" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Nessuna attività trovata
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Prova a cambiare i filtri oppure amplia la città, la provincia o la
            specie cercata.
          </p>

          <div className="mt-5">
            <Link
              href="/professionisti"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#EADFD3] bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-[#FFF9F5]"
            >
              Reset filtri
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4">
          {partners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              hrefBase="/professionisti"
            />
          ))}
        </div>
      )}
    </main>
  )
}