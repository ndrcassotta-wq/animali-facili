import Link from 'next/link'
import { ChevronRight, MapPin } from 'lucide-react'
import {
  getPartnerCategoryLabel,
  getPartnerSpeciesLabel,
} from '@/lib/constants/partners'
import type { PartnerProfile } from '@/lib/partners/queries'
import { PartnerContactActions } from '@/components/partner/PartnerContactActions'
import {
  getPartnerImagePlaceholderInitial,
  getPartnerImagePublicUrl,
} from '@/lib/partners/images'

export function PartnerCard({
  partner,
  hrefBase = '/partner',
}: {
  partner: PartnerProfile
  hrefBase?: string
}) {
  const speciePreview = partner.specie_trattate.slice(0, 4)
  const specieRestanti = Math.max(partner.specie_trattate.length - speciePreview.length, 0)

  const serviziPreview = partner.servizi_principali.slice(0, 4)
  const serviziRestanti = Math.max(
    partner.servizi_principali.length - serviziPreview.length,
    0
  )

  const imageUrl = getPartnerImagePublicUrl(partner.image_path)
  const imageFallback = getPartnerImagePlaceholderInitial(partner.nome)

  return (
    <article className="w-full rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-5">
      <div className="flex items-start gap-4">
        <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[24px] border border-[#EADFD3] bg-[#FAF7F2]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Immagine attività ${partner.nome}`}
              className="h-full w-full object-contain bg-white"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-[#8B6F47]">
              {imageFallback}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#8B5E3C]">
                {getPartnerCategoryLabel(partner.categoria)}
              </p>

              <h2 className="mt-1 text-2xl font-semibold leading-tight text-slate-900">
                <Link href={`${hrefBase}/${partner.slug}`} className="hover:underline">
                  {partner.nome}
                </Link>
              </h2>

              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {partner.citta}, {partner.provincia}
                </span>
              </p>
            </div>

            <Link
              href={`${hrefBase}/${partner.slug}`}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-full border border-[#EADFD3] px-4 text-sm font-medium text-slate-700 transition hover:bg-[#FFF9F5]"
            >
              Scheda attività
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">
        {partner.descrizione}
      </p>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-3 rounded-[22px] bg-[#FFF9F5] p-3">
          <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Specie trattate
          </p>

          <div className="flex flex-wrap gap-2">
            {speciePreview.map((specie) => (
              <span
                key={specie}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                {getPartnerSpeciesLabel(specie)}
              </span>
            ))}

            {specieRestanti > 0 ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                +{specieRestanti}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-3 rounded-[22px] bg-[#FFF9F5] p-3">
          <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Servizi principali
          </p>

          <div className="flex flex-wrap gap-2">
            {serviziPreview.map((servizio) => (
              <span
                key={servizio}
                className="rounded-full border border-[#EADFD3] bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                {servizio}
              </span>
            ))}

            {serviziRestanti > 0 ? (
              <span className="rounded-full border border-[#EADFD3] bg-white px-3 py-1 text-xs font-medium text-slate-700">
                +{serviziRestanti}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <PartnerContactActions partner={partner} compact />
    </article>
  )
}