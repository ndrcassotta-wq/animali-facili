import Link from 'next/link'
import { Building2 } from 'lucide-react'
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

export default async function PartnerPage({
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
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
      <header className="rounded-[32px] border border-[#EADFD3] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8B5E3C]">Partner</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Trova professionisti per il tuo animale
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Cerca partner approvati tra veterinari, toelettatori, pet sitter,
              educatori, pensioni, allevatori e negozi.
            </p>
          </div>

          <Link
            href="/partner/candidatura"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#EADFD3] bg-[#FFF9F5] px-5 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Sei un professionista? Candidati
          </Link>
        </div>
      </header>

      <div className="mt-6">
        <PartnerFilters basePath="/partner" values={filters} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {partners.length} partner trovati
        </p>
      </div>

      {partners.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-dashed border-[#D9C4B2] bg-[#FFF9F5] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <Building2 className="h-6 w-6 text-[#8B5E3C]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Nessun partner trovato
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Prova a cambiare filtri oppure amplia la città o la specie cercata.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} hrefBase="/partner" />
          ))}
        </div>
      )}
    </main>
  )
}