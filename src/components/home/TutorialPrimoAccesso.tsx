// src/components/home/TutorialPrimoAccesso.tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CalendarClock,
  Check,
  FileText,
  PawPrint,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'af_onboarding_primo_accesso_v1'

export function TutorialPrimoAccesso({
  haAnimali,
  primoAnimaleId,
  primoAnimaleNome,
}: {
  haAnimali: boolean
  primoAnimaleId?: string
  primoAnimaleNome?: string
}) {
  const [isReady, setIsReady] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const onboardingNascosto = localStorage.getItem(STORAGE_KEY) === 'true'
    setIsDismissed(onboardingNascosto)
    setIsReady(true)
  }, [])

  function chiudiCard() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsDismissed(true)
  }

  const ctaHref = useMemo(() => {
    if (!haAnimali) return '/animali/nuovo'
    if (primoAnimaleId) return `/animali/${primoAnimaleId}`
    return '/home'
  }, [haAnimali, primoAnimaleId])

  const ctaLabel = haAnimali
    ? primoAnimaleNome
      ? `Apri il profilo di ${primoAnimaleNome}`
      : 'Apri il profilo del tuo animale'
    : 'Aggiungi il primo animale'

  if (!isReady || isDismissed) return null

  return (
    <section className="mb-5">
      <div className="overflow-hidden rounded-[28px] border border-[#EADFD3] bg-[#FDF8F3] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#F1E6DA] px-5 pb-4 pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-[#B86A2E]">
              <PawPrint size={22} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#B08968]">
                Primo accesso
              </p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight text-gray-900">
                {haAnimali
                  ? 'Primi passi consigliati'
                  : 'Benvenuto in Animali Facili'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={chiudiCard}
            className="shrink-0 rounded-full p-2 text-gray-400 transition active:scale-[0.96]"
            aria-label="Chiudi onboarding"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm leading-6 text-gray-600">
            {haAnimali
              ? 'Hai già iniziato bene. Ora puoi completare il profilo del tuo animale e usare l’app al meglio, senza complicazioni.'
              : 'Per iniziare aggiungi il tuo primo animale. Da lì potrai salvare documenti, creare impegni e tenere tutto sotto controllo in un unico posto.'}
          </p>

          <div className="mt-5 grid gap-3">
            <div className="flex items-start gap-3 rounded-2xl border border-[#EFE4D8] bg-white/80 px-4 py-3">
              <div className="mt-0.5 text-amber-600">
                <Check size={18} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {haAnimali ? 'Apri il profilo del tuo animale' : 'Aggiungi il primo animale'}
                </p>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  È il punto di partenza per avere tutto ordinato e facile da trovare.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[#EFE4D8] bg-white/80 px-4 py-3">
              <div className="mt-0.5 text-slate-600">
                <FileText size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Carica un documento importante
                </p>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Libretto, referti, ricette e file utili sempre a portata di mano.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[#EFE4D8] bg-white/80 px-4 py-3">
              <div className="mt-0.5 text-teal-700">
                <CalendarClock size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Crea un impegno
                </p>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Visite, vaccini, controlli e promemoria restano sempre sotto controllo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[#EFE4D8] bg-white/80 px-4 py-3">
              <div className="mt-0.5 text-violet-700">
                <BookOpen size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Consulta timeline e diario
                </p>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Ti aiutano a ricordare eventi, note e momenti importanti nel tempo.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={ctaHref}
              className={cn(
                'inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold text-white shadow-md shadow-orange-200 transition active:scale-[0.98]',
                'bg-gradient-to-r from-amber-400 to-orange-500'
              )}
            >
              {ctaLabel}
            </Link>

            <button
              type="button"
              onClick={chiudiCard}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#E7D9CB] bg-white px-5 text-sm font-bold text-gray-600 shadow-sm transition active:scale-[0.98]"
            >
              Ho capito
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}