import { PartnerSubmissionForm } from '@/components/partner/PartnerSubmissionForm'
import { submitPartnerApplication } from './actions'

export default function PartnerCandidaturaPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:py-10">
      <div className="rounded-[32px] border border-[#EADFD3] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-8">
        <p className="text-sm font-medium text-[#8B5E3C]">Sezione partner</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Candidati come partner
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Compila il form in modo semplice e chiaro. La tua scheda non verrà pubblicata subito:
          entrerà prima in revisione e sarà approvata manualmente.
        </p>

        <div className="mt-8">
          <PartnerSubmissionForm action={submitPartnerApplication} />
        </div>
      </div>
    </main>
  )
}