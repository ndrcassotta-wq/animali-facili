import Link from 'next/link'
import { ArrowLeft, Home, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PartnerSubmissionForm } from '@/components/partner/PartnerSubmissionForm'
import { submitPartnerApplication } from './actions'

export default async function PartnerCandidaturaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthenticated = Boolean(user)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-4 md:px-5 md:pb-10 md:pt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/partner"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#EADFD3] bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-[#FFF9F5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna ai partner
        </Link>

        <Link
          href="/home"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#EADFD3] bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-[#FFF9F5]"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

      <section className="rounded-[32px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F7EFE7] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#8B5E3C]">
              Sezione partner
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 md:text-4xl">
              Candidati come partner
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Compila il form in modo semplice e chiaro. La tua scheda non verrà
              pubblicata subito: entrerà prima in revisione e sarà approvata
              manualmente.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#F1E5DA] bg-[#FFF9F5] p-4 text-sm leading-6 text-slate-700">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#8B5E3C] shadow-sm">
                <Send className="h-4 w-4" />
              </div>

              <div>
                <p className="font-medium text-slate-900">Come funziona</p>
                <p className="mt-1">
                  Invia la candidatura, noi la salviamo in revisione e, dopo il
                  controllo manuale, la scheda potrà comparire nella directory
                  partner.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {isAuthenticated
                    ? 'Sei loggato: la candidatura verrà collegata al tuo account.'
                    : 'Puoi candidarti anche senza login. In questa fase, però, la candidatura non verrà collegata automaticamente a un account.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <PartnerSubmissionForm
              action={submitPartnerApplication}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </section>
    </main>
  )
}