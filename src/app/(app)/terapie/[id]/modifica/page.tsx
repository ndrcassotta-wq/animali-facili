import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import { ArrowLeft, Pill, Clock3, FileText, History, CheckCircle2 } from 'lucide-react'

type Terapia = Database['public']['Tables']['terapie']['Row']
type Animale = Database['public']['Tables']['animali']['Row']
type Somministrazione =
  Database['public']['Tables']['somministrazioni_terapia']['Row']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']
type ImpegnoRow = Database['public']['Tables']['impegni']['Row']

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

function getBadgeStatoClass(stato: string | null) {
  if (stato === 'attiva') {
    return 'bg-green-100 text-green-700'
  }

  if (stato === 'conclusa') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-gray-100 text-gray-500'
}

function formatData(data: string | null) {
  if (!data) return 'Non indicata'

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${data}T12:00:00`))
}

function formatDataOra(data: string | null) {
  if (!data) return 'Non indicata'

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

function formatDateOnlyIso(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getAutoTerapiaMarker(terapiaId: string) {
  return `[AUTO_TERAPIA:${terapiaId}]`
}

function buildAutoImpegnoNote(terapia: Terapia) {
  return `${getAutoTerapiaMarker(terapia.id)}
Promemoria automatico terapia: ${terapia.nome_farmaco}
Dose: ${terapia.dose || 'Non indicata'}
Frequenza: ${terapia.frequenza || 'Non indicata'}`
}

function calcolaProssimaSomministrazione(
  terapia: Terapia,
  ultimaSomministrazione: Somministrazione | null
) {
  if (terapia.stato !== 'attiva') return null

  if (!ultimaSomministrazione?.somministrata_il) {
    if (!terapia.data_inizio) return null

    const primaData = new Date(`${terapia.data_inizio}T09:00:00`)
    if (Number.isNaN(primaData.getTime())) return null

    if (terapia.data_fine) {
      const dataFine = new Date(`${terapia.data_fine}T23:59:59`)
      if (primaData > dataFine) return null
    }

    return primaData
  }

  const base = new Date(ultimaSomministrazione.somministrata_il)
  if (Number.isNaN(base.getTime())) return null

  const prossima = new Date(base)

  switch (terapia.frequenza) {
    case 'una_volta_giorno':
      prossima.setDate(prossima.getDate() + 1)
      break
    case 'due_volte_giorno':
      prossima.setHours(prossima.getHours() + 12)
      break
    case 'tre_volte_giorno':
      prossima.setHours(prossima.getHours() + 8)
      break
    case 'al_bisogno':
    case 'personalizzata':
    default:
      return null
  }

  if (terapia.data_fine) {
    const dataFine = new Date(`${terapia.data_fine}T23:59:59`)
    if (prossima > dataFine) return null
  }

  return prossima
}

function getTestoProssimaSomministrazione(
  terapia: Terapia,
  prossimaSomministrazione: Date | null
) {
  if (terapia.stato !== 'attiva') {
    return 'Terapia non attiva'
  }

  if (terapia.frequenza === 'al_bisogno') {
    return 'Somministrazione al bisogno'
  }

  if (terapia.frequenza === 'personalizzata') {
    return 'Frequenza personalizzata'
  }

  if (!prossimaSomministrazione) {
    return 'Non calcolabile'
  }

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(prossimaSomministrazione)
}

function calcolaProssimaDataImpegno(
  terapia: Terapia,
  riferimento: Date
): string | null {
  if (terapia.stato !== 'attiva') return null

  if (terapia.frequenza !== 'una_volta_giorno') {
    return null
  }

  const prossima = new Date(riferimento)
  prossima.setDate(prossima.getDate() + 1)

  const prossimaData = formatDateOnlyIso(prossima)

  if (terapia.data_fine && prossimaData > terapia.data_fine) {
    return null
  }

  return prossimaData
}

function RigaInfo({
  label,
  valore,
}: {
  label: string
  valore: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-right text-sm font-semibold text-gray-800">
        {valore}
      </span>
    </div>
  )
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

    const adesso = new Date()
    const oggi = formatDateOnlyIso(adesso)
    const autoMarker = getAutoTerapiaMarker(terapia.id)

    const { error: insertSomministrazioneError } = await supabase
      .from('somministrazioni_terapia')
      .insert({
        terapia_id: terapia.id,
        somministrata_il: adesso.toISOString(),
        nota: notaRaw || null,
      })

    if (insertSomministrazioneError) {
      throw new Error(insertSomministrazioneError.message)
    }

    const { data: autoImpegniRows, error: autoImpegniError } = await supabase
      .from('impegni')
      .select('*')
      .eq('animale_id', terapia.animale_id)
      .eq('tipo', 'terapia')
      .ilike('note', `%${autoMarker}%`)
      .order('data', { ascending: true })

    if (autoImpegniError) {
      throw new Error(autoImpegniError.message)
    }

    const autoImpegni = (autoImpegniRows ?? []) as ImpegnoRow[]

    const idsDaCompletare = autoImpegni
      .filter((i) => i.stato === 'programmato' && i.data <= oggi)
      .map((i) => i.id)

    if (idsDaCompletare.length > 0) {
      const { error: completaError } = await supabase
        .from('impegni')
        .update({ stato: 'completato' })
        .in('id', idsDaCompletare)

      if (completaError) {
        throw new Error(completaError.message)
      }
    }

    const idsFuturiDaEliminare = autoImpegni
      .filter((i) => i.stato === 'programmato' && i.data > oggi)
      .map((i) => i.id)

    if (idsFuturiDaEliminare.length > 0) {
      const { error: deleteFuturiError } = await supabase
        .from('impegni')
        .delete()
        .in('id', idsFuturiDaEliminare)

      if (deleteFuturiError) {
        throw new Error(deleteFuturiError.message)
      }
    }

    const prossimaDataImpegno = calcolaProssimaDataImpegno(terapia, adesso)

    if (prossimaDataImpegno) {
      const payloadImpegno: ImpegnoInsert = {
        animale_id: terapia.animale_id,
        titolo: `Terapia: ${terapia.nome_farmaco}`,
        tipo: 'terapia',
        data: prossimaDataImpegno,
        frequenza: 'nessuna',
        notifiche_attive: false,
        stato: 'programmato',
        note: buildAutoImpegnoNote(terapia),
      }

      const { error: insertImpegnoError } = await supabase
        .from('impegni')
        .insert(payloadImpegno)

      if (insertImpegnoError) {
        throw new Error(insertImpegnoError.message)
      }
    }

    revalidatePath(`/terapie/${terapia.id}`)
    revalidatePath(`/animali/${terapia.animale_id}`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=terapie`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=impegni`)
    revalidatePath('/impegni')
    revalidatePath('/home')

    redirect(`/terapie/${terapia.id}`)
  }

  async function concludiTerapia() {
    'use server'

    const supabase = await createClient()
    const autoMarker = getAutoTerapiaMarker(terapia.id)

    const dataFine = terapia.data_fine ?? formatDateOnlyIso(new Date())

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

    const { error: annullaImpegniError } = await supabase
      .from('impegni')
      .update({ stato: 'annullato' })
      .eq('animale_id', terapia.animale_id)
      .eq('tipo', 'terapia')
      .eq('stato', 'programmato')
      .ilike('note', `%${autoMarker}%`)

    if (annullaImpegniError) {
      throw new Error(annullaImpegniError.message)
    }

    revalidatePath(`/terapie/${terapia.id}`)
    revalidatePath(`/animali/${terapia.animale_id}`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=terapie`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=impegni`)
    revalidatePath('/impegni')
    revalidatePath('/home')

    redirect(`/terapie/${terapia.id}`)
  }

  async function archiviaTerapia() {
    'use server'

    const supabase = await createClient()
    const autoMarker = getAutoTerapiaMarker(terapia.id)

    const { error } = await supabase
      .from('terapie')
      .update({
        stato: 'archiviata',
      })
      .eq('id', terapia.id)

    if (error) {
      throw new Error(error.message)
    }

    const { error: annullaImpegniError } = await supabase
      .from('impegni')
      .update({ stato: 'annullato' })
      .eq('animale_id', terapia.animale_id)
      .eq('tipo', 'terapia')
      .eq('stato', 'programmato')
      .ilike('note', `%${autoMarker}%`)

    if (annullaImpegniError) {
      throw new Error(annullaImpegniError.message)
    }

    revalidatePath(`/terapie/${terapia.id}`)
    revalidatePath(`/animali/${terapia.animale_id}`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=terapie`)
    revalidatePath(`/animali/${terapia.animale_id}?tab=impegni`)
    revalidatePath('/impegni')
    revalidatePath('/home')

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
  const somministrazioni = (somministrazioniRows ?? []) as Somministrazione[]

  const ultimaSomministrazione = somministrazioni[0] ?? null
  const prossimaSomministrazione = calcolaProssimaSomministrazione(
    terapia,
    ultimaSomministrazione
  )

  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>
      <header className="shrink-0 px-5 pt-10 pb-4">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href={`/animali/${terapia.animale_id}?tab=terapie`}
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
              {terapia.nome_farmaco}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getBadgeStatoClass(
                  terapia.stato
                )}`}
              >
                {getLabelStato(terapia.stato)}
              </span>
              {animale && (
                <span className="text-xs text-gray-400">{animale.nome}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 px-5 pb-12">
        <div className="rounded-3xl border border-gray-100 bg-white px-5 py-2 shadow-sm">
          <RigaInfo label="Dose" valore={terapia.dose || 'Non indicata'} />
          <RigaInfo
            label="Frequenza"
            valore={getLabelFrequenza(terapia.frequenza)}
          />
          <RigaInfo
            label="Data inizio"
            valore={formatData(terapia.data_inizio)}
          />
          <RigaInfo
            label="Data fine"
            valore={formatData(terapia.data_fine)}
          />
          {terapia.frequenza === 'personalizzata' && (
            <RigaInfo
              label="Frequenza custom"
              valore={terapia.frequenza_custom || 'Non indicata'}
            />
          )}
          <RigaInfo label="Note" valore={terapia.note || 'Nessuna nota'} />
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-800">Somministrazione</h2>
          </div>

          <div className="mb-4 space-y-3">
            <div className="rounded-2xl bg-[#FDF8F3] px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Ultima somministrazione
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {ultimaSomministrazione
                  ? formatDataOra(ultimaSomministrazione.somministrata_il)
                  : 'Nessuna registrazione'}
              </p>
            </div>

            <div className="rounded-2xl bg-[#FDF8F3] px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Prossima prevista
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {getTestoProssimaSomministrazione(
                  terapia,
                  prossimaSomministrazione
                )}
              </p>
            </div>
          </div>

          {terapia.frequenza !== 'una_volta_giorno' &&
            terapia.stato === 'attiva' && (
              <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-xs text-amber-800">
                  Per ora il promemoria automatico negli impegni si aggiorna
                  soprattutto per le terapie 1× al giorno.
                </p>
              </div>
            )}

          {terapia.stato === 'attiva' ? (
            <form action={segnaSomministrata} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="nota"
                  className="text-sm font-semibold text-gray-700"
                >
                  Nota somministrazione
                </label>
                <textarea
                  id="nota"
                  name="nota"
                  rows={3}
                  placeholder="Es. presa dopo pasto, mezza compressa, nessun problema..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 size={16} strokeWidth={2.4} />
                Segna somministrata
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">
              La terapia non è attiva, quindi non può essere registrata una nuova
              somministrazione.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-800">Gestione terapia</h2>
          </div>

          <div className="space-y-3">
            <Link
              href={`/terapie/${terapia.id}/modifica`}
              className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-600 shadow-sm transition-all active:scale-[0.98]"
            >
              Modifica terapia
            </Link>

            {terapia.stato === 'attiva' && (
              <form action={concludiTerapia}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 py-4 text-sm font-bold text-amber-700 transition-all active:scale-[0.98]"
                >
                  Concludi terapia
                </button>
              </form>
            )}

            {(terapia.stato === 'attiva' || terapia.stato === 'conclusa') && (
              <form action={archiviaTerapia}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-4 text-sm font-bold text-gray-600 transition-all active:scale-[0.98]"
                >
                  Archivia terapia
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <History size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-800">
              Storico somministrazioni
            </h2>
          </div>

          {somministrazioni.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
              Nessuna somministrazione registrata.
            </div>
          ) : (
            <div className="space-y-3">
              {somministrazioni.map((somministrazione) => (
                <div
                  key={somministrazione.id}
                  className="rounded-2xl border border-gray-100 bg-[#FDF8F3] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDataOra(somministrazione.somministrata_il)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-gray-500">
                    {somministrazione.nota || 'Nessuna nota'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href={`/animali/${terapia.animale_id}?tab=terapie`}
            className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
          >
            Torna alla scheda animale
          </Link>

          <Link
            href={`/animali/${terapia.animale_id}/terapie/nuova`}
            className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-600 shadow-sm transition-all active:scale-[0.98]"
          >
            Nuova terapia
          </Link>
        </div>
      </div>
    </div>
  )
}