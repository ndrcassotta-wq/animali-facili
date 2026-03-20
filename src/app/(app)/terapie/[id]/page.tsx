import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { formatData } from '@/lib/utils/date'
import type { Database } from '@/lib/types/database.types'

type Terapia = Database['public']['Tables']['terapie']['Row']
type Animale = Database['public']['Tables']['animali']['Row']
type Somministrazione =
  Database['public']['Tables']['somministrazioni_terapia']['Row']

const LABEL_FREQUENZA: Record<string, string> = {
  una_volta_giorno: '1× al giorno',
  due_volte_giorno: '2× al giorno',
  tre_volte_giorno: '3× al giorno',
  al_bisogno: 'Al bisogno',
  personalizzata: 'Personalizzata',
}

const LABEL_STATO: Record<string, string> = {
  attiva: 'Attiva',
  conclusa: 'Conclusa',
  archiviata: 'Archiviata',
}

function getLabelFrequenza(frequenza: string | null) {
  if (!frequenza) return 'Non specificata'
  return LABEL_FREQUENZA[frequenza] ?? frequenza
}

function getLabelStato(stato: string | null) {
  if (!stato) return 'Non specificato'
  return LABEL_STATO[stato] ?? stato
}

function formatDataOra(data: string | null) {
  if (!data) return 'Non indicata'

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DettaglioTerapiaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: terapiaRow, error: terapiaError } = await supabase
    .from('terapie')
    .select('*')
    .eq('id', id)
    .single()

  if (terapiaError || !terapiaRow) {
    notFound()
  }

  const terapia = terapiaRow as Terapia

  async function segnaSomministrata(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const notaRaw = String(formData.get('nota') ?? '').trim()

    const { error } = await supabase.from('somministrazioni_terapia').insert({
      terapia_id: terapia.id,
      somministrata_il: new Date().toISOString(),
      nota: notaRaw || null,
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath(`/terapie/${terapia.id}`)
    revalidatePath(`/animali/${terapia.animale_id}`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=terapie`)

    redirect(`/terapie/${terapia.id}`)
  }

  async function concludiTerapia() {
    'use server'

    const supabase = await createClient()

    const dataFine = terapia.data_fine ?? new Date().toISOString().slice(0, 10)

    const { error } = await supabase
      .from('terapie')
      .update({
        stato: 'conclusa',
        data_fine: dataFine,
      })
      .eq('id', terapia.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath(`/terapie/${terapia.id}`)
    revalidatePath(`/animali/${terapia.animale_id}`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=terapie`)

    redirect(`/terapie/${terapia.id}`)
  }

  async function archiviaTerapia() {
    'use server'

    const supabase = await createClient()

    const { error } = await supabase
      .from('terapie')
      .update({
        stato: 'archiviata',
      })
      .eq('id', terapia.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath(`/terapie/${terapia.id}`)
    revalidatePath(`/animali/${terapia.animale_id}`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=terapie`)

    redirect(`/terapie/${terapia.id}`)
  }

  const [{ data: animaleRow }, { data: somministrazioniRows }] =
    await Promise.all([
      supabase
        .from('animali')
        .select('*')
        .eq('id', terapia.animale_id)
        .single(),

      supabase
        .from('somministrazioni_terapia')
        .select('*')
        .eq('terapia_id', terapia.id)
        .order('somministrata_il', { ascending: false })
        .limit(20),
    ])

  const animale = (animaleRow ?? null) as Animale | null
  const somministrazioni = (somministrazioniRows ??
    []) as Somministrazione[]

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <div className="space-y-2">
        <Link
          href={`/animali/${terapia.animale_id}?tab=terapie`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Torna alle terapie
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {terapia.nome_farmaco}
          </h1>

          <p className="text-sm text-muted-foreground">
            {animale ? `Terapia di ${animale.nome}` : 'Dettaglio terapia'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Farmaco
            </p>
            <p className="text-sm font-medium">{terapia.nome_farmaco}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Dose
            </p>
            <p className="text-sm font-medium">
              {terapia.dose || 'Non indicata'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Frequenza
            </p>
            <p className="text-sm font-medium">
              {getLabelFrequenza(terapia.frequenza)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Stato
            </p>
            <p className="text-sm font-medium">
              {getLabelStato(terapia.stato)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Data inizio
            </p>
            <p className="text-sm font-medium">
              {terapia.data_inizio
                ? formatData(terapia.data_inizio)
                : 'Non indicata'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Data fine
            </p>
            <p className="text-sm font-medium">
              {terapia.data_fine
                ? formatData(terapia.data_fine)
                : 'Non indicata'}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Note
          </p>
          <p className="whitespace-pre-wrap text-sm">
            {terapia.note || 'Nessuna nota'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Gestione terapia</h2>
            <p className="text-sm text-muted-foreground">
              Modifica i dati o aggiorna lo stato della terapia.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/terapie/${terapia.id}/modifica`}>
                Modifica terapia
              </Link>
            </Button>

            {terapia.stato === 'attiva' && (
              <form action={concludiTerapia} className="w-full sm:w-auto">
                <Button type="submit" variant="outline" className="w-full">
                  Concludi terapia
                </Button>
              </form>
            )}

            {(terapia.stato === 'attiva' || terapia.stato === 'conclusa') && (
              <form action={archiviaTerapia} className="w-full sm:w-auto">
                <Button type="submit" variant="outline" className="w-full">
                  Archivia terapia
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {terapia.stato === 'attiva' && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Somministrazione</h2>
              <p className="text-sm text-muted-foreground">
                Registra una nuova somministrazione e, se vuoi, aggiungi una
                nota.
              </p>
            </div>

            <form action={segnaSomministrata} className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="nota" className="text-sm font-medium">
                  Nota somministrazione
                </label>
                <textarea
                  id="nota"
                  name="nota"
                  rows={3}
                  placeholder="Es. presa dopo pasto, mezza compressa, nessun problema..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                Segna somministrata
              </Button>
            </form>
          </div>
        </div>
      )}

      {terapia.stato === 'archiviata' && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Questa terapia è archiviata e non può più essere segnata come
            somministrata.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Storico somministrazioni</h2>
          <p className="text-sm text-muted-foreground">
            Ultime registrazioni effettuate per questa terapia.
          </p>
        </div>

        {somministrazioni.length === 0 ? (
          <p className="pt-4 text-sm text-muted-foreground">
            Nessuna somministrazione registrata.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {somministrazioni.map((somministrazione) => (
              <div
                key={somministrazione.id}
                className="rounded-xl border border-border px-3 py-3"
              >
                <p className="text-sm font-medium">
                  {formatDataOra(somministrazione.somministrata_il)}
                </p>

                <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                  {somministrazione.nota || 'Nessuna nota'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/animali/${terapia.animale_id}?tab=terapie`}>
            Torna alla scheda animale
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/animali/${terapia.animale_id}/terapie/nuova`}>
            Nuova terapia
          </Link>
        </Button>
      </div>
    </div>
  )
}