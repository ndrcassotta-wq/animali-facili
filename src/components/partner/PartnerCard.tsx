import Link from 'next/link'
import { ChevronRight, MapPin } from 'lucide-react'
import {
  getPartnerCategoryLabel,
  getPartnerSpeciesLabel,
} from '@/lib/constants/partners'
import type { PartnerProfile } from '@/lib/partners/queries'
import { PartnerContactActions } from '@/components/partner/PartnerContactActions'

export function PartnerCard({
  partner,
  hrefBase = '/partner',
}: {
  partner: PartnerProfile
  hrefBase?: string
}) {
  return (
    <article className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#8B5E3C]">
            {getPartnerCategoryLabel(partner.categoria)}
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            <Link href={`${hrefBase}/${partner.slug}`} className="hover:underline">
              {partner.nome}
            </Link>
          </h2>

          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0" />
            {partner.citta}, {partner.provincia}
          </p>
        </div>

        <Link
          href={`${hrefBase}/${partner.slug}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#EADFD3] px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#FFF9F5]"
        >
          Dettagli
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-700">
        {partner.descrizione}
      </p>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Specie trattate
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {partner.specie_trattate.map((specie) => (
            <span
              key={specie}
              className="rounded-full bg-[#F7EFE7] px-3 py-1 text-xs font-medium text-slate-700"
            >
              {getPartnerSpeciesLabel(specie)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Servizi principali
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {partner.servizi_principali.slice(0, 4).map((servizio) => (
            <span
              key={servizio}
              className="rounded-full border border-[#EADFD3] px-3 py-1 text-xs font-medium text-slate-700"
            >
              {servizio}
            </span>
          ))}
        </div>
      </div>

      <PartnerContactActions partner={partner} compact />
    </article>
  )
}