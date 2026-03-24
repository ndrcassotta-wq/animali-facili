import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'

type PageProps = {
  params: Promise<{ id: string }>
}

type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']

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
    `Promemoria automatico terapia`,
    `Dose: ${dose}`,
    `Frequenza: ${frequenza}`,
  ]

  if (noteRaw) {
    parts.push(`Note terapia: ${noteRaw}`)
  }

  return parts.join('\n')
}

export default async function NuovaTerapiaPage({ params }: PageProps) {
  const { id: animaleId } = await params

  async function creaTerapia(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const nomeFarmaco = String(formData.get('nome_farmaco') ?? '').trim()
    const dose = String(formData.get('dose') ?? '').trim()
    const frequenza = String(formData.get('frequenza') ?? '').trim()
    const dataInizio = String(formData.get('data_inizio') ?? '').trim()
    const dataFineRaw = String(formData.get('data_fine') ?? '').trim()
    const noteRaw = String(formData.get('note') ?? '').trim()

    if (!nomeFarmaco || !dose || !frequenza || !dataInizio) {
      throw new Error('Compila tutti i campi obbligatori.')
    }

    const payload = {
      animale_id: animaleId,
      nome_farmaco: nomeFarmaco,
      dose,
      frequenza,
      data_inizio: dataInizio,
      data_fine: dataFineRaw || null,
      note: noteRaw || null,
      stato: 'attiva',
    }

    const { data: terapiaCreata, error: terapiaError } = await supabase
      .from('terapie')
      .insert(payload as never)
      .select('id, animale_id, nome_farmaco, dose, frequenza, data_inizio, data_fine, stato')
      .single()

    if (terapiaError || !terapiaCreata) {
      throw new Error(terapiaError?.message || 'Errore durante la creazione della terapia.')
    }

    const terapiaId = terapiaCreata.id

    // Crea subito il primo impegno automatico per le terapie programmate.
    // "Al bisogno" resta fuori perché non è un promemoria pianificato.
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

    revalidatePath(`/animali/${animaleId}`)
    revalidatePath(`/animali/${animaleId}?tab=terapie`)
    revalidatePath(`/animali/${animaleId}?tab=impegni`)
    revalidatePath('/impegni')
    revalidatePath('/home')

    redirect(`/animali/${animaleId}?tab=terapie`)
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <div className="space-y-2">
        <Link
          href={`/animali/${animaleId}?tab=terapie`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Torna alle terapie
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nuova terapia
          </h1>
          <p className="text-sm text-muted-foreground">
            Inserisci i dati principali della terapia.
          </p>
        </div>
      </div>

      <form action={creaTerapia} className="space-y-5 rounded-2xl border border-border bg-card p-4">
        <div className="space-y-2">
          <label htmlFor="nome_farmaco" className="text-sm font-medium">
            Nome farmaco *
          </label>
          <input
            id="nome_farmaco"
            name="nome_farmaco"
            type="text"
            required
            placeholder="Es. Antibiotico X"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="dose" className="text-sm font-medium">
            Dose *
          </label>
          <input
            id="dose"
            name="dose"
            type="text"
            required
            placeholder="Es. 1 compressa"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="frequenza" className="text-sm font-medium">
            Frequenza *
          </label>
          <select
            id="frequenza"
            name="frequenza"
            required
            defaultValue="una_volta_giorno"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-0"
          >
            <option value="una_volta_giorno">1× al giorno</option>
            <option value="due_volte_giorno">2× al giorno</option>
            <option value="tre_volte_giorno">3× al giorno</option>
            <option value="al_bisogno">Al bisogno</option>
            <option value="personalizzata">Personalizzata</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="data_inizio" className="text-sm font-medium">
              Data inizio *
            </label>
            <input
              id="data_inizio"
              name="data_inizio"
              type="date"
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-0"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="data_fine" className="text-sm font-medium">
              Data fine
            </label>
            <input
              id="data_fine"
              name="data_fine"
              type="date"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="note" className="text-sm font-medium">
            Note
          </label>
          <textarea
            id="note"
            name="note"
            rows={4}
            placeholder="Indicazioni, orari, osservazioni..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="w-full sm:w-auto">
            Salva terapia
          </Button>

          <Button asChild type="button" variant="outline" className="w-full sm:w-auto">
            <Link href={`/animali/${animaleId}?tab=terapie`}>
              Annulla
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}