import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import { NuovaTerapiaWizard } from '@/components/terapie/NuovaTerapiaWizard'

type Terapia = Database['public']['Tables']['terapie']['Row']

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ModificaTerapiaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terapiaRow, error } = await supabase
    .from('terapie')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !terapiaRow) notFound()

  const terapia = terapiaRow as Terapia

  // Carica animale per mostrare il nome
  const { data: animaleRow } = await supabase
    .from('animali')
    .select('id, nome')
    .eq('id', terapia.animale_id)
    .single()

  const animale = animaleRow ?? { id: terapia.animale_id, nome: 'Animale' }

  async function modificaTerapia(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const nomeFarmaco     = String(formData.get('nome_farmaco') ?? '').trim()
    const dose            = String(formData.get('dose') ?? '').trim()
    const frequenza       = String(formData.get('frequenza') ?? '').trim()
    const frequenzaCustom = String(formData.get('frequenza_custom') ?? '').trim()
    const dataInizio      = String(formData.get('data_inizio') ?? '').trim()
    const dataFineRaw     = String(formData.get('data_fine') ?? '').trim()
    const noteRaw         = String(formData.get('note') ?? '').trim()

    if (!nomeFarmaco || !dose || !frequenza || !dataInizio) {
      throw new Error('Compila tutti i campi obbligatori.')
    }

    const { error } = await supabase
      .from('terapie')
      .update({
        nome_farmaco:     nomeFarmaco,
        dose,
        frequenza: frequenza as 'una_volta_giorno' | 'due_volte_giorno' | 'tre_volte_giorno' | 'al_bisogno' | 'personalizzata',
        frequenza_custom: frequenza === 'personalizzata' ? frequenzaCustom || null : null,
        data_inizio:      dataInizio,
        data_fine:        dataFineRaw || null,
        note:             noteRaw || null,
      })
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath(`/terapie/${id}`)
    revalidatePath(`/animali/${terapia.animale_id}`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=terapie`)

    redirect(`/terapie/${id}`)
  }

  return (
    <NuovaTerapiaWizard
      title="Modifica terapia"
      subtitle={`Modifica la terapia di ${animale.nome}`}
      backHref={`/terapie/${id}`}
      onSubmit={modificaTerapia}
      animali={[animale]}
      preselectedAnimalId={animale.id}
      valoriIniziali={{
        nomeFarmaco:     terapia.nome_farmaco,
        dose:            terapia.dose ?? '',
        frequenza:       terapia.frequenza ?? 'una_volta_giorno',
        frequenzaCustom: terapia.frequenza_custom ?? '',
        dataInizio:      terapia.data_inizio ?? '',
        dataFine:        terapia.data_fine ?? '',
        note:            terapia.note ?? '',
      }}
    />
  )
}