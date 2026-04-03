import {
  getPartnerCategoryLabel,
  getPartnerSpeciesLabel,
} from '@/lib/constants/partners'
import type { PartnerProfile } from '@/lib/partners/queries'
import { PartnerContactActions } from '@/components/partner/PartnerContactActions'
import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Globe,
  BadgeCheck,
  FileText,
  Stethoscope,
  PawPrint,
} from 'lucide-react'

export function PartnerDetail({ partner }: { partner: PartnerProfile }) {
  return (
    <section className="rounded-[32px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#F7EFE7] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#8B5E3C]">
            {getPartnerCategoryLabel(partner.categoria)}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full border border-[#EADFD3] bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <BadgeCheck className="h-3.5 w-3.5 text-[#8B5E3C]" />
            Partner approvato
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 md:text-4xl">
            {partner.nome}
          </h1>

          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-[#8B5E3C]" />
              {partner.citta}, {partner.provincia}
            </span>

            {partner.zona_servita ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D9C4B2]" />
                Zona servita: {partner.zona_servita}
              </span>
            ) : null}
          </div>
        </div>

        <PartnerContactActions partner={partner} />
      </div>

      <div className="mt-8 space-y-4">
        <div className="rounded-[24px] border border-[#F1E5DA] bg-[#FFFDFB] p-4 md:p-5">
          <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-4">
            <div className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-slate-900">
              <FileText className="h-4 w-4 text-[#8B5E3C]" />
              Descrizione
            </div>

            <p className="whitespace-pre-line text-sm leading-7 text-slate-700 md:text-[15px]">
              {partner.descrizione}
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#F1E5DA] bg-white p-4 md:p-5">
          <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-4">
            <div className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-slate-900">
              <Stethoscope className="h-4 w-4 text-[#8B5E3C]" />
              Servizi principali
            </div>

            <div className="flex flex-wrap gap-2">
              {partner.servizi_principali.map((servizio) => (
                <span
                  key={servizio}
                  className="rounded-full border border-[#EADFD3] bg-[#FFF9F5] px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  {servizio}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#F1E5DA] bg-white p-4 md:p-5">
          <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-4">
            <div className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-slate-900">
              <PawPrint className="h-4 w-4 text-[#8B5E3C]" />
              Specie trattate
            </div>

            <div className="flex flex-wrap gap-2">
              {partner.specie_trattate.map((specie) => (
                <span
                  key={specie}
                  className="rounded-full bg-[#F7EFE7] px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  {getPartnerSpeciesLabel(specie)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#EADFD3] bg-[#FFF9F5] p-4 md:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Contatti e info</h2>

          <div className="mt-4 space-y-3">
            {partner.indirizzo_completo ? (
              <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-4 rounded-2xl bg-white px-4 py-3">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <MapPin className="h-4 w-4 shrink-0 text-[#8B5E3C]" />
                  Indirizzo
                </div>
                <p className="text-sm leading-6 text-slate-700">{partner.indirizzo_completo}</p>
              </div>
            ) : null}

            {partner.telefono ? (
              <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-4 rounded-2xl bg-white px-4 py-3">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Phone className="h-4 w-4 shrink-0 text-[#8B5E3C]" />
                  Telefono
                </div>
                <p className="text-sm leading-6 text-slate-700">{partner.telefono}</p>
              </div>
            ) : null}

            {partner.whatsapp ? (
              <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-4 rounded-2xl bg-white px-4 py-3">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <MessageCircle className="h-4 w-4 shrink-0 text-[#8B5E3C]" />
                  WhatsApp
                </div>
                <p className="text-sm leading-6 text-slate-700">{partner.whatsapp}</p>
              </div>
            ) : null}

            {partner.email ? (
              <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-4 rounded-2xl bg-white px-4 py-3">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Mail className="h-4 w-4 shrink-0 text-[#8B5E3C]" />
                  Email
                </div>
                <p className="break-all text-sm leading-6 text-slate-700">{partner.email}</p>
              </div>
            ) : null}

            {partner.sito ? (
              <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-4 rounded-2xl bg-white px-4 py-3">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Globe className="h-4 w-4 shrink-0 text-[#8B5E3C]" />
                  Sito
                </div>
                <p className="break-all text-sm leading-6 text-slate-700">{partner.sito}</p>
              </div>
            ) : null}

            {partner.zona_servita ? (
              <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-4 rounded-2xl bg-white px-4 py-3">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <MapPin className="h-4 w-4 shrink-0 text-[#8B5E3C]" />
                  Zona servita
                </div>
                <p className="text-sm leading-6 text-slate-700">{partner.zona_servita}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}