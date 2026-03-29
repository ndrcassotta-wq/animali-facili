import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import { NuovaTerapiaWizard } from '@/components/terapie/NuovaTerapiaWizard'

type PageProps = {
  params: Promise<{ id: string }>
}

type Animale = Database['public']['Tables']['animali']['Row']
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
    'Promemoria automatico terapia',
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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: animaleRow, error: animaleError } = await supabase
    .from('animali')
    .select('id, nome')
    .eq('id', animaleId)
    .eq('user_id', user.id)
    .single()

  if (animaleError || !animaleRow) {
    notFound()
  }

  const animale = animaleRow as Pick<Animale, 'id' | 'nome'>

  async function creaTerapia(formData: FormData) {
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

    revalidatePath(`/animali/${animaleId}`)
    revalidatePath(`/animali/${animaleId}?tab=terapie`)
    revalidatePath(`/animali/${animaleId}?tab=impegni`)
    revalidatePath('/impegni')
    revalidatePath('/home')

    redirect(`/terapie/${terapiaId}`)
  }

  return (
    <NuovaTerapiaWizard
      title="Nuova terapia"
      subtitle={`Inserisci i dati della terapia per ${animale.nome}`}
      backHref={`/animali/${animaleId}?tab=terapie`}
      submitAction={creaTerapia}
      animali={[animale]}
      preselectedAnimalId={animale.id}
    />
  )
}