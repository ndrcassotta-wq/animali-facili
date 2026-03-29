'use client'

import Link from 'next/link'
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AnimaleSelect } from '@/components/scadenze/AnimaleSelect'
import {
  programmaNotificaImpegno,
  richiediPermessoNotifiche,
  PREFERENZE_DEFAULT,
} from '@/hooks/useNotifiche'
import type { Database, PreferenzeNotifiche } from '@/lib/types/database.types'
import { ArrowLeft, PawPrint } from 'lucide-react'
import { cn } from '@/lib/utils'

type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']
type TipoImpegno = NonNullable<ImpegnoInsert['tipo']>
type FrequenzaImpegno = NonNullable<ImpegnoInsert['frequenza']>
type Step = 'tipo' | 'animale-data' | 'dettagli'

const STEPS: Step[] = ['tipo', 'animale-data', 'dettagli']

const tipi: { valore: TipoImpegno; label: string; icona: string }[] = [
  { valore: 'visita', label: 'Visita', icona: '🩺' },
  { valore: 'controllo', label: 'Controllo', icona: '🔍' },
  { valore: 'vaccinazione', label: 'Vaccinazione', icona: '💉' },
  { valore: 'toelettatura', label: 'Toelettatura', icona: '✂️' },
  { valore: 'addestramento', label: 'Addestramento', icona: '🎓' },
  { valore: 'altro', label: 'Altro', icona: '📌' },
]

const frequenze: { valore: FrequenzaImpegno; label: string }[] = [
  { valore: 'nessuna', label: 'Non ripetere' },
  { valore: 'settimanale', label: 'Settimanale' },
  { valore: 'mensile', label: 'Mensile' },
  { valore: 'trimestrale', label: 'Trimestrale' },
  { valore: 'semestrale', label: 'Semestrale' },
  { valore: 'annuale', label: 'Annuale' },
]

const titoloDefault: Record<TipoImpegno, string> = {
  visita: 'Visita',
  controllo: 'Controllo',
  vaccinazione: 'Vaccinazione',
  toelettatura: 'Toelettatura',
  terapia: 'Terapia',
  addestramento: 'Addestramento',
  compleanno: 'Compleanno',
  altro: 'Altro',
}

const oggi = new Date().toISOString().split('T')[0]

const STEP_LABEL: Record<Step, string> = {
  tipo: 'Tipo',
  'animale-data': 'Quando',
  dettagli: 'Dettagli',
}

function ProgressBar({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step)
  const percent = (idx / (STEPS.length - 1)) * 100

  return (
    <div className="px-5 pt-4 pb-2">
      <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
          style={{ width: `${Math.max(percent, 8)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={cn(
              'text-[10px] font-semibold transition-colors',
              i <= idx ? 'text-amber-500' : 'text-gray-300'
            )}
          >
            {STEP_LABEL[s]}
          </span>
        ))}
      </div>
    </div>
  )
}

function CampoForm({
  label,
  required,
  opzionale,
  errore,
  children,
}: {
  label: string
  required?: boolean
  opzionale?: boolean
  errore?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </Label>
        {opzionale && <span className="text-xs text-gray-400">opzionale</span>}
      </div>
      {children}
      {errore && <p className="text-xs font-medium text-red-500">{errore}</p>}
    </div>
  )
}

function StepLayout({
  children,
  action,
  contentRef,
}: {
  children: React.ReactNode
  action: React.ReactNode
  contentRef?: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={contentRef}
      className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+96px)]"
    >
      <div className="space-y-6 pb-2">
        {children}
        <div className="pt-1">{action}</div>
      </div>
    </div>
  )
}

export default function NuovoImpegnoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contenutoRef = useRef<HTMLDivElement | null>(null)
  const animaleIdPreselezionato = searchParams.get('animale_id') ?? ''

  const [step, setStep] = useState<Step>('tipo')
  const [tipo, setTipo] = useState<TipoImpegno>('visita')
  const [animaleId, setAnimaleId] = useState(animaleIdPreselezionato)
  const [animaleNomePreselezionato, setAnimaleNomePreselezionato] = useState('')
  const [data, setData] = useState(oggi)
  const [ora, setOra] = useState('')
  const [frequenza, setFrequenza] = useState<FrequenzaImpegno>('nessuna')
  const [note, setNote] = useState('')
  const [erroreData, setErroreData] = useState('')
  const [erroreAnimale, setErroreAnimale] = useState('')
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [haAnimali, setHaAnimali] = useState<boolean | null>(
    animaleIdPreselezionato ? true : null
  )

  const tipoSelezionato = tipi.find((t) => t.valore === tipo)

  useEffect(() => {
    if (animaleIdPreselezionato) {
      setHaAnimali(true)
      return
    }

    let isMounted = true

    async function checkAnimali() {
      try {
        const supabase = createClient()
        const { count, error } = await supabase
          .from('animali')
          .select('id', { count: 'exact', head: true })

        if (!isMounted) return

        if (error) {
          setHaAnimali(true)
          return
        }

        setHaAnimali((count ?? 0) > 0)
      } catch {
        if (isMounted) setHaAnimali(true)
      }
    }

    checkAnimali()

    return () => {
      isMounted = false
    }
  }, [animaleIdPreselezionato])

  useEffect(() => {
    if (!animaleIdPreselezionato) {
      setAnimaleNomePreselezionato('')
      return
    }

    let isMounted = true

    async function loadAnimalePreselezionato() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('animali')
          .select('nome')
          .eq('id', animaleIdPreselezionato)
          .single()

        if (!isMounted) return
        setAnimaleNomePreselezionato(data?.nome ?? '')
      } catch {
        if (isMounted) setAnimaleNomePreselezionato('')
      }
    }

    loadAnimalePreselezionato()

    return () => {
      isMounted = false
    }
  }, [animaleIdPreselezionato])

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      contenutoRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    }

    resetScroll()
    const frame = window.requestAnimationFrame(resetScroll)

    return () => window.cancelAnimationFrame(frame)
  }, [step])

  function vaiAvanti(next: Step) {
    setStep(next)
  }

  function vaiIndietro() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
    else router.back()
  }

  async function handleSubmit() {
    setErroreSrv(null)

    if (!animaleId) {
      setErroreAnimale('Seleziona un animale.')
      return
    }

    if (!data) {
      setErroreData('La data è obbligatoria.')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let preferenze: PreferenzeNotifiche = PREFERENZE_DEFAULT

      if (user) {
        const { data: profilo } = await supabase
          .from('profili')
          .select('preferenze_notifiche')
          .eq('id', user.id)
          .single()

        if (profilo?.preferenze_notifiche) {
          preferenze = profilo.preferenze_notifiche as PreferenzeNotifiche
        }
      }

      const { data: animaleData } = await supabase
        .from('animali')
        .select('nome')
        .eq('id', animaleId)
        .single()

      const animaleNome = animaleData?.nome ?? ''

      const payload: ImpegnoInsert = {
        animale_id: animaleId,
        titolo: titoloDefault[tipo],
        tipo,
        data,
        ora: ora.trim() || null,
        frequenza,
        notifiche_attive:
          preferenze.attive && preferenze.tipi_abilitati.includes(tipo),
        stato: 'programmato',
        note: note.trim() || null,
      }

      const { data: nuovoImpegno, error } = await supabase
        .from('impegni')
        .insert(payload)
        .select('id')
        .single()

      if (error || !nuovoImpegno) {
        setErroreSrv(
          `Errore durante il salvataggio: ${error?.message ?? 'sconosciuto'}`
        )
        setIsSubmitting(false)
        return
      }

      try {
        const permesso = await richiediPermessoNotifiche()

        if (
          permesso &&
          preferenze.attive &&
          preferenze.tipi_abilitati.includes(tipo)
        ) {
          await programmaNotificaImpegno({
            id: nuovoImpegno.id,
            titolo: titoloDefault[tipo],
            animaleNome,
            data,
            tipo,
            preferenze,
          })
        }
      } catch {
        console.warn('Notifica non programmata')
      }

      router.push(
        animaleIdPreselezionato ? `/animali/${animaleId}?tab=impegni` : '/impegni'
      )
    } catch (e) {
      console.error(e)
      setErroreSrv('Errore durante il salvataggio. Riprova.')
      setIsSubmitting(false)
    }
  }

  if (haAnimali === null) {
    return (
      <div
        className="flex flex-col bg-[#F7F1EA]"
        style={{ minHeight: '100dvh' }}
      >
        <header className="shrink-0 px-5 pt-10 pb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">Indietro</span>
          </button>
        </header>

        <div className="flex flex-1 items-center px-5 pb-12">
          <div className="w-full rounded-[28px] border border-[#EADFD3] bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCF8F3] text-amber-600">
              <PawPrint size={24} strokeWidth={2.2} />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">
              Controllo animali salvati...
            </h1>
          </div>
        </div>
      </div>
    )
  }

  if (!haAnimali) {
    return (
      <div
        className="flex flex-col bg-[#F7F1EA]"
        style={{ minHeight: '100dvh' }}
      >
        <header className="shrink-0 rounded-b-[34px] bg-gradient-to-b from-[#FFF4E8] to-[#F7F1EA] px-5 pb-5 pt-10">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">Indietro</span>
          </button>

          <div className="rounded-[28px] border border-[#F1E4D7] bg-white/90 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <PawPrint size={22} strokeWidth={2.2} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
                  Nuovo impegno
                </p>
                <h1 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
                  Prima crea un animale
                </h1>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Per aggiungere un impegno devi prima salvare almeno un animale
                  nell’app.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 px-5 pb-12 pt-4">
          <div className="rounded-[28px] border border-[#EADFD3] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="rounded-2xl bg-[#FCF8F3] px-4 py-4">
              <p className="text-sm leading-6 text-gray-600">
                Inizia creando il primo animale. Dopo potrai aggiungere visite,
                vaccinazioni, controlli e tutti gli altri impegni collegati.
              </p>
            </div>

            <Link
              href="/animali/nuovo"
              className="mt-5 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Crea il primo animale
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex h-[100dvh] flex-col bg-[#FDF8F3]"
      style={{ minHeight: '100dvh' }}
    >
      <header className="shrink-0 px-5 pt-10 pb-0">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={vaiIndietro}
            className="flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">
              {step === 'tipo' ? 'Annulla' : 'Indietro'}
            </span>
          </button>

          {step === 'dettagli' && (
            <button
              onClick={handleSubmit}
              className="text-sm font-semibold text-amber-500 active:opacity-70"
            >
              Salta e salva
            </button>
          )}
        </div>

        <ProgressBar step={step} />
      </header>

      {step === 'tipo' && (
        <div
          ref={contenutoRef}
          className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+24px)]"
        >
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-gray-900">
            Che tipo di impegno?
          </h1>
          <p className="mb-6 text-sm text-gray-400">
            Scegli la categoria dell'appuntamento
          </p>

          <div className="grid grid-cols-2 gap-4">
            {tipi.map((t) => (
              <button
                key={t.valore}
                onClick={() => {
                  setTipo(t.valore)
                  vaiAvanti('animale-data')
                }}
                className="flex flex-col items-center gap-3 rounded-3xl border-2 border-gray-100 bg-white px-2 py-8 text-center shadow-sm transition-all active:scale-95 active:border-amber-300 active:bg-amber-50"
              >
                <span className="text-4xl leading-none">{t.icona}</span>
                <span className="text-base font-extrabold text-gray-800">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'animale-data' && (
        <StepLayout
          contentRef={contenutoRef}
          action={
            <button
              onClick={() => {
                if (!animaleIdPreselezionato && !animaleId) {
                  setErroreAnimale('Seleziona un animale.')
                  return
                }

                if (!data) {
                  setErroreData('La data è obbligatoria.')
                  return
                }

                vaiAvanti('dettagli')
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Continua
            </button>
          }
        >
          <div className="mb-6">
            <div className="mb-1 flex items-center gap-3">
              <span className="text-3xl">{tipoSelezionato?.icona}</span>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                {tipoSelezionato?.label}
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              {animaleIdPreselezionato
                ? `Associato a ${
                    animaleNomePreselezionato || 'questo animale'
                  }. Quando?`
                : 'Per quale animale e quando?'}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <div className="space-y-5">
              {!animaleIdPreselezionato && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Animale <span className="text-red-400">*</span>
                  </Label>
                  <AnimaleSelect
                    valore={animaleId}
                    onChange={(v) => {
                      setAnimaleId(v)
                      setErroreAnimale('')
                    }}
                    disabled={isSubmitting}
                    mostraLabel={false}
                  />
                  {erroreAnimale && (
                    <p className="text-xs font-medium text-red-500">
                      {erroreAnimale}
                    </p>
                  )}
                </div>
              )}

              <CampoForm label="Data" required errore={erroreData}>
                <Input
                  type="date"
                  value={data}
                  onChange={(e) => {
                    setData(e.target.value)
                    setErroreData('')
                  }}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                />
              </CampoForm>

              <CampoForm label="Ora" opzionale>
                <Input
                  type="time"
                  value={ora}
                  onChange={(e) => setOra(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
                />
              </CampoForm>
            </div>
          </div>
        </StepLayout>
      )}

      {step === 'dettagli' && (
        <StepLayout
          contentRef={contenutoRef}
          action={
            <div className="space-y-4">
              {erroreSrv && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-600">
                    {erroreSrv}
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmitting ? 'Salvataggio in corso...' : 'Salva impegno 📅'}
              </button>
            </div>
          }
        >
          <div className="mb-6">
            <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-gray-900">
              Ultimi dettagli
            </h1>
            <p className="text-sm text-gray-400">
              Tutti opzionali — puoi completarli dopo
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <div className="space-y-5">
              <CampoForm label="Ripetizione" opzionale>
                <Select
                  value={frequenza}
                  onValueChange={(v) => setFrequenza(v as FrequenzaImpegno)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequenze.map((f) => (
                      <SelectItem key={f.valore} value={f.valore}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CampoForm>

              <CampoForm label="Note" opzionale>
                <Textarea
                  placeholder="Informazioni aggiuntive"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base"
                />
              </CampoForm>
            </div>
          </div>
        </StepLayout>
      )}
    </div>
  )
}