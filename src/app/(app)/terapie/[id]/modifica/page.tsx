import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import type { Database } from '@/lib/types/database.types'

type Terapia = Database['public']['Tables']['terapie']['Row']

type PageProps = {
  params: Promise<{ id: string }>
}

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
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <div className="space-y-2">
        <Link
          href={`/terapie/${terapia.id}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Torna al dettaglio terapia
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Modifica terapia
          </h1>
          <p className="text-sm text-muted-foreground">
            Aggiorna i dati principali della terapia.
          </p>
        </div>
      </div>

      <form
        action={salvaModifiche}
        className="space-y-5 rounded-2xl border border-border bg-card p-4"
      >
        <div className="space-y-2">
          <label htmlFor="nome_farmaco" className="text-sm font-medium">
            Nome farmaco *
          </label>
          <input
            id="nome_farmaco"
            name="nome_farmaco"
            type="text"
            required
            defaultValue={terapia.nome_farmaco}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
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
            defaultValue={terapia.dose}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
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
            defaultValue={terapia.frequenza}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="una_volta_giorno">1× al giorno</option>
            <option value="due_volte_giorno">2× al giorno</option>
            <option value="tre_volte_giorno">3× al giorno</option>
            <option value="al_bisogno">Al bisogno</option>
            <option value="personalizzata">Personalizzata</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="frequenza_custom" className="text-sm font-medium">
            Frequenza personalizzata
          </label>
          <input
            id="frequenza_custom"
            name="frequenza_custom"
            type="text"
            defaultValue={terapia.frequenza_custom ?? ''}
            placeholder="Es. ogni 8 ore"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
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
              defaultValue={terapia.data_inizio ?? ''}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
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
              defaultValue={terapia.data_fine ?? ''}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
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
            defaultValue={terapia.note ?? ''}
            placeholder="Indicazioni, orari, osservazioni..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="w-full sm:w-auto">
            Salva modifiche
          </Button>

          <Button asChild type="button" variant="outline" className="w-full sm:w-auto">
            <Link href={`/terapie/${terapia.id}`}>
              Annulla
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}