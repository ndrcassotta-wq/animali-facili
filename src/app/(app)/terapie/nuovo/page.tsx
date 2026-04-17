import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import { ArrowLeft, Stethoscope } from 'lucide-react'
import { NuovaTerapiaWizard } from '@/components/terapie/NuovaTerapiaWizard'

type Animale = Database['public']['Tables']['animali']['Row']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']
type TerapiaInsert = Database['public']['Tables']['terapie']['Insert']
type FrequenzaTerapia = NonNullable<TerapiaInsert['frequenza']>
type CreatedSource = 'owner' | 'family'
type ServerSupabase = Awaited<ReturnType<typeof createClient>>

type AnimaleCardData = Pick<
  Animale,
  'id' | 'nome' | 'specie' | 'razza' | 'foto_url' | 'categoria'
>

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

async function getAccessibleAnimali(
  supabase: ServerSupabase,
  userId: string
): Promise<AnimaleCardData[]> {
  const { data: ownedRows, error: ownedError } = await supabase
    .from('animali')
    .select('id, nome, specie, razza, foto_url, categoria')
    .eq('user_id', userId)
    .order('nome', { ascending: true })

  if (ownedError) {
    throw new Error(ownedError.message)
  }

  const { data: sharedLinks, error: sharedLinksError } = await supabase
    .from('animali_utenti')
    .select('animale_id')
    .eq('user_id', userId)
    .eq('status', 'accepted')

  if (sharedLinksError) {
    throw new Error(sharedLinksError.message)
  }

  const owned = (ownedRows ?? []) as AnimaleCardData[]
  const sharedAnimalIds = Array.from(
    new Set((sharedLinks ?? []).map((row) => row.animale_id).filter(Boolean))
  ).filter((id) => !owned.some((animale) => animale.id === id))

  let sharedAnimali: AnimaleCardData[] = []

  if (sharedAnimalIds.length > 0) {
    const { data: sharedRows, error: sharedRowsError } = await supabase
      .from('animali')
      .select('id, nome, specie, razza, foto_url, categoria')
      .in('id', sharedAnimalIds)

    if (sharedRowsError) {
      throw new Error(sharedRowsError.message)
    }

    sharedAnimali = (sharedRows ?? []) as AnimaleCardData[]
  }

  return [...owned, ...sharedAnimali].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' })
  )
}

async function resolveCreateOwnership(
  supabase: ServerSupabase,
  animaleId: string,
  userId: string
): Promise<CreatedSource> {
  const { data: animaleRow, error: animaleError } = await supabase
    .from('animali')
    .select('id, user_id')
    .eq('id', animaleId)
    .single()

  if (animaleError || !animaleRow) {
    throw new Error('Animale non valido.')
  }

  if (animaleRow.user_id === userId) {
    return 'owner'
  }

  const { data: accessRow, error: accessError } = await supabase
    .from('animali_utenti')
    .select('id')
    .eq('animale_id', animaleId)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (accessError || !accessRow) {
    throw new Error('Non sei autorizzato a creare contenuti per questo animale.')
  }

  return 'family'
}

export default async function NuovaTerapiaGenericaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const animali = await getAccessibleAnimali(supabase, user.id)

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
    const oraSomministrazioneRaw = String(
      formData.get('ora_somministrazione') ?? ''
    ).trim()
    const noteRaw = String(formData.get('note') ?? '').trim()
    const autoImpegnoIdRaw = String(formData.get('auto_impegno_id') ?? '').trim()

    if (!animaleId || !nomeFarmaco || !dose || !frequenza || !dataInizio) {
      throw new Error('Compila tutti i campi obbligatori.')
    }

    const createdSource = await resolveCreateOwnership(
      supabase,
      animaleId,
      user.id
    )

    const payload: TerapiaInsert = {
      animale_id: animaleId,
      nome_farmaco: nomeFarmaco,
      dose,
      frequenza,
      frequenza_custom:
        frequenza === 'personalizzata' ? frequenzaCustomRaw || null : null,
      data_inizio: dataInizio,
      data_fine: dataFineRaw || null,
      ora_somministrazione: oraSomministrazioneRaw || null,
      note: noteRaw || null,
      stato: 'attiva',
      created_by_user_id: user.id,
      created_by_partner_profile_id: null,
      created_source: createdSource,
    }

    const { data: terapiaCreata, error: terapiaError } = await supabase
      .from('terapie')
      .insert(payload)
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
    let autoImpegnoId: string | null = null

    if (
      terapiaCreata.stato === 'attiva' &&
      terapiaCreata.frequenza !== 'al_bisogno'
    ) {
      const payloadImpegno: ImpegnoInsert = {
        ...(autoImpegnoIdRaw ? { id: autoImpegnoIdRaw } : {}),
        animale_id: animaleId,
        titolo: `Terapia: ${nomeFarmaco}`,
        tipo: 'terapia',
        data: dataInizio,
        ora: oraSomministrazioneRaw || null,
        frequenza: 'nessuna',
        notifiche_attive: true,
        stato: 'programmato',
        note: buildAutoImpegnoNote(
          terapiaId,
          dose,
          frequenza,
          noteRaw,
          oraSomministrazioneRaw
        ),
        created_by_user_id: user.id,
        created_by_partner_profile_id: null,
        created_source: createdSource,
      }

      const { data: impegnoCreato, error: impegnoError } = await supabase
        .from('impegni')
        .insert(payloadImpegno)
        .select('id')
        .single()

      if (impegnoError || !impegnoCreato) {
        throw new Error(
          impegnoError?.message ||
            'Errore durante la creazione del promemoria terapia.'
        )
      }

      autoImpegnoId = impegnoCreato.id
    }

    revalidatePath('/terapie')
    revalidatePath(`/terapie/${terapiaId}`)
    revalidatePath(`/animali/${animaleId}`)
    revalidatePath(`/animali/${animaleId}?tab=terapie`)
    revalidatePath(`/animali/${animaleId}?tab=impegni`)
    revalidatePath('/impegni')
    revalidatePath('/home')

    return {
      success: true as const,
      redirectTo: `/terapie/${terapiaId}`,
      autoImpegnoId,
    }
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
              <Stethoscope size={28} strokeWidth={2.2} />
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
    <NuovaTerapiaWizard
      title="Nuova terapia"
      subtitle="Inserisci i dati principali della terapia"
      backHref="/home"
      submitAction={creaTerapia}
      animali={animali}
      variant="generale"
    />
  )
}