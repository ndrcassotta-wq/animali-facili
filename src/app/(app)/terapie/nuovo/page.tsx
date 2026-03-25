import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import { ArrowLeft, Pill, CalendarDays, FileText, PawPrint } from 'lucide-react'

type Animale = Database['public']['Tables']['animali']['Row']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']

const FREQUENZE = [
  { value: 'una_volta_giorno', label: '1× al giorno' },
  { value: 'due_volte_giorno', label: '2× al giorno' },
  { value: 'tre_volte_giorno', label: '3× al giorno' },
  { value: 'al_bisogno', label: 'Al bisogno' },
  { value: 'personalizzata', label: 'Personalizzata' },
] as const

function getAutoTerapiaMarker(terapiaId: string) {
  return `[AUTO_TERAPIA:${terapiaId}]`
}

function buildAutoImpegnoNote(
  terapiaId: string,
  dose: string,
  frequenza: string,
  noteRaw: string
) {
  const parts = [
    getAutoTerapiaMarker(terapiaId),
    'Promemoria automatico terapia',
    `Dose: ${dose}`,
    `Frequenza: ${frequenza}`,
  ]

  if (noteRaw) {
    parts.push(`Note terapia: ${noteRaw}`)
  }

  return parts.join('\n')
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default async function NuovaTerapiaGenericaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: animaliRows, error: animaliError } = await supabase
    .from('animali')
    .select('id, nome, categoria')
    .eq('user_id', user.id)
    .order('nome', { ascending: true })

  if (animaliError) {
    throw new Error(animaliError.message)
  }

  const animali = (animaliRows ?? []) as Pick<Animale, 'id' | 'nome' | 'categoria'>[]
  const oggi = formatLocalDate(new Date())

  async function creaTerapia(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const animaleId = String(formData.get('animale_id') ?? '').trim()
    const nomeFarmaco = String(formData.get('nome_farmaco') ?? '').trim()
    const dose = String(formData.get('dose') ?? '').trim()
    const frequenza = String(formData.get('frequenza') ?? '').trim()
    const frequenzaCustomRaw = String(
      formData.get('frequenza_custom') ?? ''
    ).trim()
    const dataInizio = String(formData.get('data_inizio') ?? '').trim()
    const dataFineRaw = String(formData.get('data_fine') ?? '').trim()
    const noteRaw = String(formData.get('note') ?? '').trim()

    if (!animaleId || !nomeFarmaco || !dose || !frequenza || !dataInizio) {
      throw new Error('Compila tutti i campi obbligatori.')
    }

    const { data: animaleCheck, error: animaleCheckError } = await supabase
      .from('animali')
      .select('id')
      .eq('id', animaleId)
      .eq('user_id', user.id)
      .single()

    if (animaleCheckError || !animaleCheck) {
      throw new Error('Animale non valido.')
    }

    const payload = {
      animale_id: animaleId,
      nome_farmaco: nomeFarmaco,
      dose,
      frequenza,
      frequenza_custom:
        frequenza === 'personalizzata' ? frequenzaCustomRaw || null : null,
      data_inizio: dataInizio,
      data_fine: dataFineRaw || null,
      note: noteRaw || null,
      stato: 'attiva',
    }

    const { data: terapiaCreata, error: terapiaError } = await supabase
      .from('terapie')
      .insert(payload as never)
      .select(
        'id, animale_id, nome_farmaco, dose, frequenza, data_inizio, data_fine, stato'
      )
      .single()

    if (terapiaError || !terapiaCreata) {
      throw new Error(
        terapiaError?.message || 'Errore durante la creazione della terapia.'
      )
    }

    const terapiaId = terapiaCreata.id

    if (terapiaCreata.stato === 'attiva' && terapiaCreata.frequenza !== 'al_bisogno') {
      const payloadImpegno: ImpegnoInsert = {
        animale_id: animaleId,
        titolo: `Terapia: ${nomeFarmaco}`,
        tipo: 'terapia',
        data: dataInizio,
        frequenza: 'nessuna',
        notifiche_attive: false,
        stato: 'programmato',
        note: buildAutoImpegnoNote(terapiaId, dose, frequenza, noteRaw),
      }

      const { error: impegnoError } = await supabase
        .from('impegni')
        .insert(payloadImpegno)

      if (impegnoError) {
        throw new Error(impegnoError.message)
      }
    }

    revalidatePath('/terapie')
    revalidatePath(`/terapie/${terapiaId}`)
    revalidatePath(`/animali/${animaleId}`)
    revalidatePath(`/animali/${animaleId}?tab=terapie`)
    revalidatePath(`/animali/${animaleId}?tab=impegni`)
    revalidatePath('/impegni')
    revalidatePath('/home')

    redirect(`/terapie/${terapiaId}`)
  }

  if (animali.length === 0) {
    return (
      <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>
        <header className="shrink-0 px-5 pt-10 pb-4">
          <div className="mb-5 flex items-center justify-between">
            <Link
              href="/home"
              className="flex items-center gap-2 text-gray-500 active:opacity-70"
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
              <span className="text-sm font-semibold">Indietro</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-amber-100 text-amber-600">
              <Pill size={28} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Nuova terapia
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Prima devi creare almeno un animale
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 px-5 pb-12">
          <div className="rounded-3xl border border-dashed border-amber-200 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Non hai ancora nessun animale salvato.
            </p>

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
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>
      <header className="shrink-0 px-5 pt-10 pb-4">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/home"
            className="flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">Indietro</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-amber-100 text-amber-600">
            <Pill size={28} strokeWidth={2.2} />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Nuova terapia
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Inserisci i dati principali della terapia
            </p>
          </div>
        </div>
      </header>

      <form action={creaTerapia} className="flex-1 px-5 pb-12">
        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <PawPrint size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-gray-800">Animale</h2>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="animale_id"
                className="text-sm font-semibold text-gray-700"
              >
                Seleziona animale
                <span className="ml-1 text-red-400">*</span>
              </label>
              <select
                id="animale_id"
                name="animale_id"
                required
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none"
                defaultValue=""
              >
                <option value="" disabled>
                  Scegli un animale
                </option>
                {animali.map((animale) => (
                  <option key={animale.id} value={animale.id}>
                    {animale.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Pill size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-gray-800">Farmaco e dose</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="nome_farmaco"
                  className="text-sm font-semibold text-gray-700"
                >
                  Nome farmaco
                  <span className="ml-1 text-red-400">*</span>
                </label>
                <input
                  id="nome_farmaco"
                  name="nome_farmaco"
                  type="text"
                  required
                  placeholder="Es. Antibiotico X"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="dose"
                  className="text-sm font-semibold text-gray-700"
                >
                  Dose
                  <span className="ml-1 text-red-400">*</span>
                </label>
                <input
                  id="dose"
                  name="dose"
                  type="text"
                  required
                  placeholder="Es. 1 compressa"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-gray-800">Frequenza e date</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="frequenza"
                  className="text-sm font-semibold text-gray-700"
                >
                  Frequenza
                  <span className="ml-1 text-red-400">*</span>
                </label>
                <select
                  id="frequenza"
                  name="frequenza"
                  required
                  defaultValue="una_volta_giorno"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none"
                >
                  {FREQUENZE.map((frequenza) => (
                    <option key={frequenza.value} value={frequenza.value}>
                      {frequenza.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="frequenza_custom"
                  className="text-sm font-semibold text-gray-700"
                >
                  Frequenza personalizzata
                </label>
                <input
                  id="frequenza_custom"
                  name="frequenza_custom"
                  type="text"
                  placeholder="Es. ogni 8 ore"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400">
                  Compilalo solo se scegli “Personalizzata”.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="data_inizio"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Data inizio
                    <span className="ml-1 text-red-400">*</span>
                  </label>
                  <input
                    id="data_inizio"
                    name="data_inizio"
                    type="date"
                    required
                    defaultValue={oggi}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="data_fine"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Data fine
                  </label>
                  <input
                    id="data_fine"
                    name="data_fine"
                    type="date"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-gray-800">Note</h2>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="note" className="text-sm font-semibold text-gray-700">
                Note
              </label>
              <textarea
                id="note"
                name="note"
                rows={4}
                placeholder="Indicazioni, orari, osservazioni..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              Quando salvi una terapia attiva, l’app crea automaticamente anche il
              primo impegno collegato.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
          >
            Salva terapia
          </button>

          <Link
            href="/home"
            className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-600 shadow-sm transition-all active:scale-[0.98]"
          >
            Annulla
          </Link>
        </div>
      </form>
    </div>
  )
}