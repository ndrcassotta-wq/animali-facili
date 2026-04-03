import {
  getPartnerCategoryLabel,
  getPartnerSpeciesLabel,
} from '@/lib/constants/partners'
import type { PartnerProfile } from '@/lib/partners/queries'
import { PartnerContactActions } from '@/components/partner/PartnerContactActions'

export function PartnerDetail({ partner }: { partner: PartnerProfile }) {
  return (
    <section className="rounded-[32px] border border-[#EADFD3] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-8">
      <p className="text-sm font-medium text-[#8B5E3C]">
        {getPartnerCategoryLabel(partner.categoria)}
      </p>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {partner.nome}
      </h1>

      <p className="mt-3 text-sm text-slate-600">
        {partner.citta}, {partner.provincia}
        {partner.zona_servita ? ` · Zona servita: ${partner.zona_servita}` : ''}
      </p>

      <PartnerContactActions partner={partner} />

      <div className="mt-8 grid gap-8 md:grid-cols-[1.35fr_0.65fr]">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Descrizione</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
            {partner.descrizione}
          </p>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-900">Servizi principali</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {partner.servizi_principali.map((servizio) => (
                <span
                  key={servizio}
                  className="rounded-full border border-[#EADFD3] px-3 py-1 text-sm font-medium text-slate-700"
                >
                  {servizio}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-900">Specie trattate</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {partner.specie_trattate.map((specie) => (
                <span
                  key={specie}
                  className="rounded-full bg-[#F7EFE7] px-3 py-1 text-sm font-medium text-slate-700"
                >
                  {getPartnerSpeciesLabel(specie)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-[24px] border border-[#EADFD3] bg-[#FFF9F5] p-5">
          <h2 className="text-lg font-semibold text-slate-900">Contatti e info</h2>

          <dl className="mt-4 space-y-4 text-sm text-slate-700">
            {partner.indirizzo_completo ? (
              <div>
                <dt className="font-medium text-slate-900">Indirizzo</dt>
                <dd className="mt-1">{partner.indirizzo_completo}</dd>
              </div>
            ) : null}

            {partner.telefono ? (
              <div>
                <dt className="font-medium text-slate-900">Telefono</dt>
                <dd className="mt-1">{partner.telefono}</dd>
              </div>
            ) : null}

            {partner.whatsapp ? (
              <div>
                <dt className="font-medium text-slate-900">WhatsApp</dt>
                <dd className="mt-1">{partner.whatsapp}</dd>
              </div>
            ) : null}

            {partner.email ? (
              <div>
                <dt className="font-medium text-slate-900">Email</dt>
                <dd className="mt-1 break-all">{partner.email}</dd>
              </div>
            ) : null}

            {partner.sito ? (
              <div>
                <dt className="font-medium text-slate-900">Sito</dt>
                <dd className="mt-1 break-all">{partner.sito}</dd>
              </div>
            ) : null}

            {partner.zona_servita ? (
              <div>
                <dt className="font-medium text-slate-900">Zona servita</dt>
                <dd className="mt-1">{partner.zona_servita}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>
    </section>
  )
}