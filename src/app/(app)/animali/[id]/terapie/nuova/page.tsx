import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import { ArrowLeft, Pill, CalendarDays, FileText } from 'lucide-react'

type Terapia = Database['public']['Tables']['terapie']['Row']

type PageProps = {
  params: Promise<{ id: string }>
}

const FREQUENZE = [
  { value: 'una_volta_giorno', label: '1× al giorno' },
  { value: 'due_volte_giorno', label: '2× al giorno' },
  { value: 'tre_volte_giorno', label: '3× al giorno' },
  { value: 'al_bisogno', label: 'Al bisogno' },
  { value: 'personalizzata', label: 'Personalizzata' },
] as const

export default async function ModificaTerapiaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: terapiaRow, error } = await supabase
    .from('terapie')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !terapiaRow) {
    notFound()
  }

  const terapia = terapiaRow as Terapia

  async function salvaModifiche(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const nomeFarmaco = String(formData.get('nome_farmaco') ?? '').trim()
    const dose = String(formData.get('dose') ?? '').trim()
    const frequenza = String(formData.get('frequenza') ?? '').trim()
    const frequenzaCustomRaw = String(
      formData.get('frequenza_custom') ?? ''
    ).trim()
    const dataInizio = String(formData.get('data_inizio') ?? '').trim()
    const dataFineRaw = String(formData.get('data_fine') ?? '').trim()
    const noteRaw = String(formData.get('note') ?? '').trim()

    if (!nomeFarmaco || !dose || !frequenza || !dataInizio) {
      throw new Error('Compila tutti i campi obbligatori.')
    }

    const { error } = await supabase
      .from('terapie')
      .update({
        nome_farmaco: nomeFarmaco,
        dose,
        frequenza: frequenza as Terapia['frequenza'],
        frequenza_custom:
          frequenza === 'personalizzata' ? frequenzaCustomRaw || null : null,
        data_inizio: dataInizio,
        data_fine: dataFineRaw || null,
        note: noteRaw || null,
      })
      .eq('id', terapia.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath(`/terapie/${terapia.id}`)
    revalidatePath(`/terapie/${terapia.id}/modifica`)
    revalidatePath(`/animali/${terapia.animale_id}`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=terapie`)

    redirect(`/terapie/${terapia.id}`)
  }

  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>
      <header className="shrink-0 px-5 pt-10 pb-4">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href={`/terapie/${terapia.id}`}
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
              Modifica terapia
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Aggiorna i dati principali della terapia
            </p>
          </div>
        </div>
      </header>

      <form action={salvaModifiche} className="flex-1 px-5 pb-12">
        <div className="space-y-4">
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
                  defaultValue={terapia.nome_farmaco}
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
                  defaultValue={terapia.dose}
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
                  defaultValue={terapia.frequenza}
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
                  defaultValue={terapia.frequenza_custom ?? ''}
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
                    defaultValue={terapia.data_inizio ?? ''}
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
                    defaultValue={terapia.data_fine ?? ''}
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
                defaultValue={terapia.note ?? ''}
                placeholder="Indicazioni, orari, osservazioni..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
          >
            Salva modifiche
          </button>

          <Link
            href={`/terapie/${terapia.id}`}
            className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-600 shadow-sm transition-all active:scale-[0.98]"
          >
            Annulla
          </Link>
        </div>
      </form>
    </div>
  )
}