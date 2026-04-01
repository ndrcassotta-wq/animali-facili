import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import { NuovaTerapiaWizard } from '@/components/terapie/NuovaTerapiaWizard'

type Terapia = Database['public']['Tables']['terapie']['Row']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']

type PageProps = {
  params: Promise<{ id: string }>
}

function getAutoTerapiaMarker(terapiaId: string) {
  return `[AUTO_TERAPIA:${terapiaId}]`
}

function buildAutoImpegnoNote(
  terapiaId: string,
  dose: string,
  frequenza: string,
  noteRaw: string,
  orariRaw?: string
) {
  const parts = [
    getAutoTerapiaMarker(terapiaId),
    'Promemoria automatico terapia',
    `Dose: ${dose}`,
    `Frequenza: ${frequenza}`,
  ]

  if (orariRaw) {
    parts.push(`Orari: ${orariRaw}`)
  }

  if (noteRaw) {
    parts.push(`Note terapia: ${noteRaw}`)
  }

  return parts.join('\n')
}

export default async function ModificaTerapiaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terapiaRow, error } = await supabase
    .from('terapie')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !terapiaRow) notFound()

  const terapia = terapiaRow as Terapia

  const { data: animaleRow, error: animaleError } = await supabase
    .from('animali')
    .select('id, nome')
    .eq('id', terapia.animale_id)
    .eq('user_id', user.id)
    .single()

  if (animaleError || !animaleRow) notFound()

  const animale = animaleRow

  async function modificaTerapia(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const nomeFarmaco = String(formData.get('nome_farmaco') ?? '').trim()
    const dose = String(formData.get('dose') ?? '').trim()
    const frequenza = String(formData.get('frequenza') ?? '').trim()
    const frequenzaCustom = String(formData.get('frequenza_custom') ?? '').trim()
    const dataInizio = String(formData.get('data_inizio') ?? '').trim()
    const dataFineRaw = String(formData.get('data_fine') ?? '').trim()
    const noteRaw = String(formData.get('note') ?? '').trim()
    const oraSomministrazioneRaw = String(
      formData.get('ora_somministrazione') ?? ''
    ).trim()

    if (!nomeFarmaco || !dose || !frequenza || !dataInizio) {
      throw new Error('Compila tutti i campi obbligatori.')
    }

    const { data: terapiaCheck, error: terapiaCheckError } = await supabase
      .from('terapie')
      .select('id, animale_id, stato')
      .eq('id', id)
      .single()

    if (terapiaCheckError || !terapiaCheck) {
      throw new Error('Terapia non valida.')
    }

    const { data: animaleCheck, error: animaleCheckError } = await supabase
      .from('animali')
      .select('id, nome')
      .eq('id', terapiaCheck.animale_id)
      .eq('user_id', user.id)
      .single()

    if (animaleCheckError || !animaleCheck) {
      throw new Error('Animale non valido.')
    }

    const { error } = await supabase
      .from('terapie')
      .update({
        nome_farmaco: nomeFarmaco,
        dose,
        frequenza: frequenza as
          | 'una_volta_giorno'
          | 'due_volte_giorno'
          | 'tre_volte_giorno'
          | 'al_bisogno'
          | 'personalizzata',
        frequenza_custom:
          frequenza === 'personalizzata' ? frequenzaCustom || null : null,
        data_inizio: dataInizio,
        data_fine: dataFineRaw || null,
        note: noteRaw || null,
        ora_somministrazione: oraSomministrazioneRaw || null,
      })
      .eq('id', id)

    if (error) throw new Error(error.message)

    const marker = getAutoTerapiaMarker(id)

    const { data: impegnoEsistente, error: impegnoEsistenteError } = await supabase
      .from('impegni')
      .select('id')
      .eq('animale_id', terapiaCheck.animale_id)
      .eq('tipo', 'terapia')
      .ilike('note', `${marker}%`)
      .maybeSingle()

    if (impegnoEsistenteError) {
      throw new Error(
        `Errore durante il recupero del promemoria terapia: ${impegnoEsistenteError.message}`
      )
    }

    let autoImpegnoId: string | null = impegnoEsistente?.id ?? null
    let notificationOperation: 'schedule' | 'cancel' | 'none' = 'none'

    const terapiaAttiva = terapiaCheck.stato === 'attiva'
    const deveAverePromemoria =
      terapiaAttiva && frequenza !== 'al_bisogno'

    if (!deveAverePromemoria) {
      if (impegnoEsistente) {
        const { error: deleteImpegnoError } = await supabase
          .from('impegni')
          .delete()
          .eq('id', impegnoEsistente.id)

        if (deleteImpegnoError) {
          throw new Error(
            `Errore durante la rimozione del promemoria terapia: ${deleteImpegnoError.message}`
          )
        }

        autoImpegnoId = impegnoEsistente.id
        notificationOperation = 'cancel'
      }
    } else {
      const noteImpegno = buildAutoImpegnoNote(
        id,
        dose,
        frequenza,
        noteRaw,
        oraSomministrazioneRaw
      )

      if (impegnoEsistente) {
        const { error: updateImpegnoError } = await supabase
          .from('impegni')
          .update({
            titolo: `Terapia: ${nomeFarmaco}`,
            tipo: 'terapia',
            data: dataInizio,
            ora: oraSomministrazioneRaw || null,
            frequenza: 'nessuna',
            notifiche_attive: true,
            stato: 'programmato',
            note: noteImpegno,
          })
          .eq('id', impegnoEsistente.id)

        if (updateImpegnoError) {
          throw new Error(
            `Errore durante l'aggiornamento del promemoria terapia: ${updateImpegnoError.message}`
          )
        }

        autoImpegnoId = impegnoEsistente.id
        notificationOperation = 'schedule'
      } else {
        const payloadImpegno: ImpegnoInsert = {
          animale_id: terapiaCheck.animale_id,
          titolo: `Terapia: ${nomeFarmaco}`,
          tipo: 'terapia',
          data: dataInizio,
          ora: oraSomministrazioneRaw || null,
          frequenza: 'nessuna',
          notifiche_attive: true,
          stato: 'programmato',
          note: noteImpegno,
        }

        const { data: impegnoCreato, error: insertImpegnoError } = await supabase
          .from('impegni')
          .insert(payloadImpegno)
          .select('id')
          .single()

        if (insertImpegnoError || !impegnoCreato) {
          throw new Error(
            insertImpegnoError?.message ||
              'Errore durante la creazione del promemoria terapia.'
          )
        }

        autoImpegnoId = impegnoCreato.id
        notificationOperation = 'schedule'
      }
    }

    revalidatePath(`/terapie/${id}`)
    revalidatePath(`/animali/${terapiaCheck.animale_id}`)
    revalidatePath(`/animali/${terapiaCheck.animale_id}?tab=terapie`)
    revalidatePath(`/animali/${terapiaCheck.animale_id}?tab=impegni`)
    revalidatePath('/impegni')
    revalidatePath('/home')

    return {
      success: true as const,
      redirectTo: `/terapie/${id}`,
      autoImpegnoId,
      notificationOperation,
      animaleNome: animaleCheck.nome,
      titoloNotifica: `Terapia: ${nomeFarmaco}`,
      dataNotifica: dataInizio,
      oraNotifica: oraSomministrazioneRaw || null,
    }
  }

  return (
    <NuovaTerapiaWizard
      title="Modifica terapia"
      subtitle={`Modifica la terapia di ${animale.nome}`}
      backHref={`/terapie/${id}`}
      submitAction={modificaTerapia}
      animali={[animale]}
      preselectedAnimalId={animale.id}
      valoriIniziali={{
        nomeFarmaco: terapia.nome_farmaco,
        dose: terapia.dose ?? '',
        frequenza: terapia.frequenza ?? 'una_volta_giorno',
        frequenzaCustom: terapia.frequenza_custom ?? '',
        dataInizio: terapia.data_inizio ?? '',
        dataFine: terapia.data_fine ?? '',
        note: terapia.note ?? '',
        oraSomministrazione: terapia.ora_somministrazione ?? '',
      }}
    />
  )
}