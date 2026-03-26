// src/components/home/TutorialPrimoAccesso.tsx
'use client'

import { useEffect, useState } from 'react'
import { Bell, FolderOpen, PawPrint, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'animali-facili-tutorial-v1-completato'

type TutorialStep = {
  titolo: string
  descrizione: string
  icona: React.ReactNode
  tono: string
}

export function TutorialPrimoAccesso({
  haAnimali,
}: {
  haAnimali: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const steps: TutorialStep[] = [
    {
      titolo: haAnimali ? 'Gestisci i tuoi animali' : 'Aggiungi il tuo animale',
      descrizione: haAnimali
        ? 'Trovi tutto in un posto solo, con accesso rapido alle schede dei tuoi animali.'
        : 'Inizia creando la scheda del tuo animale per avere tutto subito sotto controllo.',
      icona: <PawPrint size={26} strokeWidth={2.2} />,
      tono: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      titolo: 'Controlla impegni e terapie',
      descrizione:
        'Visite, vaccinazioni, controlli e terapie restano ordinati e facili da seguire.',
      icona: <Stethoscope size={26} strokeWidth={2.2} />,
      tono: 'bg-teal-50 text-teal-700 border-teal-100',
    },
    {
      titolo: 'Salva documenti e referti',
      descrizione:
        'Puoi conservare documenti importanti e ritrovarli velocemente quando ti servono.',
      icona: <FolderOpen size={26} strokeWidth={2.2} />,
      tono: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      titolo: 'Ricevi promemoria utili',
      descrizione:
        'L’app ti aiuta a restare organizzato con notifiche e promemoria chiari.',
      icona: <Bell size={26} strokeWidth={2.2} />,
      tono: 'bg-violet-50 text-violet-700 border-violet-100',
    },
  ]

  const stepCorrente = steps[stepIndex]
  const ultimoStep = stepIndex === steps.length - 1

  useEffect(() => {
    const tutorialCompletato = localStorage.getItem(STORAGE_KEY) === 'true'
    setIsOpen(!tutorialCompletato)
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  function chiudiTutorial() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  function vaiAvanti() {
    if (ultimoStep) {
      chiudiTutorial()
      return
    }

    setStepIndex((prev) => prev + 1)
  }

  if (!isReady || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-6 backdrop-blur-[2px] sm:items-center sm:px-6 sm:pb-6">
      <div className="w-full max-w-sm rounded-[32px] border border-[#EADFD3] bg-[#FDF8F3] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500 shadow-sm">
            Benvenuto
          </span>
          <button
            type="button"
            onClick={chiudiTutorial}
            className="text-sm font-semibold text-gray-400 active:opacity-70"
          >
            Salta
          </button>
        </div>

        <div
          className={cn(
            'mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border',
            stepCorrente.tono
          )}
        >
          {stepCorrente.icona}
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
          {stepCorrente.titolo}
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {stepCorrente.descrizione}
        </p>

        <div className="mt-5 flex items-center gap-2">
          {steps.map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-2 rounded-full transition-all',
                index === stepIndex ? 'w-6 bg-amber-500' : 'w-2 bg-gray-300'
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          {!ultimoStep && (
            <button
              type="button"
              onClick={chiudiTutorial}
              className="flex-1 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-600 shadow-sm active:scale-[0.98]"
            >
              Salta
            </button>
          )}

          <button
            type="button"
            onClick={vaiAvanti}
            className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-200 active:scale-[0.98]"
          >
            {ultimoStep ? 'Inizia' : 'Avanti'}
          </button>
        </div>
      </div>
    </div>
  )
}