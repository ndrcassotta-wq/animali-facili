import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { formatData } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Check,
  Pencil,
  Archive,
  CircleStop,
  Stethoscope,
} from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

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

function formatDataOra(data: string | null) {
  if (!data) return 'Non indicata'

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

function formatDateOnlyIso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildDateWithTime(dataIso: string, ora: string | null) {
  const orario = ora && ora.length >= 5 ? ora.slice(0, 5) : '09:00'
  const date = new Date(`${dataIso}T${orario}:00`)
  return Number.isNaN(date.getTime()) ? null : date
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

    const primaData = buildDateWithTime(
      terapia.data_inizio,
      terapia.ora_somministrazione
    )
    if (!primaData) return null

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

function RigaInfo({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-right text-sm font-semibold text-gray-800">
        {valore}
      </span>
    </div>
  )
}

function getStatoBadge(stato: string | null) {
  switch (stato) {
    case 'attiva':
      return {
        label: 'Attiva',
        cls: 'bg-green-100 text-green-700',
        box: 'bg-green-100',
      }
    case 'conclusa':
      return {
        label: 'Conclusa',
        cls: 'bg-amber-100 text-amber-700',
        box: 'bg-amber-100',
      }
    case 'archiviata':
      return {
        label: 'Archiviata',
        cls: 'bg-gray-100 text-gray-600',
        box: 'bg-gray-100',
      }
    default:
      return {
        label: getLabelStato(stato),
        cls: 'bg-blue-100 text-blue-700',
        box: 'bg-blue-100',
      }
  }
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DettaglioTerapiaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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
        ora: terapia.ora_somministrazione ?? null,
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

  const statoBadge = getStatoBadge(terapia.stato)

  return (
    <div className="flex flex-col bg-[#FDF8F3]" style={{ minHeight: '100dvh' }}>
      <header className="shrink-0 px-5 pt-10 pb-4">
        <div className="mb-5">
          <Link
            href={`/animali/${terapia.animale_id}?tab=terapie`}
            className="flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">Indietro</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl',
              statoBadge.box
            )}
          >
            <Stethoscope size={28} className="text-gray-700" strokeWidth={2.2} />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {terapia.nome_farmaco}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-bold',
                  statoBadge.cls
                )}
              >
                {statoBadge.label}
              </span>
              {animale && (
                <span className="text-xs text-gray-400">{animale.nome}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 pb-32 space-y-4">
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-5 py-2">
          <RigaInfo label="Farmaco" valore={terapia.nome_farmaco} />
          <RigaInfo label="Dose" valore={terapia.dose || 'Non indicata'} />
          <RigaInfo
            label="Frequenza"
            valore={getLabelFrequenza(terapia.frequenza)}
          />
          <RigaInfo
            label="Orario"
            valore={terapia.ora_somministrazione?.slice(0, 5) || 'Non indicato'}
          />
          <RigaInfo label="Stato" valore={getLabelStato(terapia.stato)} />
          <RigaInfo
            label="Data inizio"
            valore={
              terapia.data_inizio ? formatData(terapia.data_inizio) : 'Non indicata'
            }
          />
          <RigaInfo
            label="Data fine"
            valore={
              terapia.data_fine ? formatData(terapia.data_fine) : 'Non indicata'
            }
          />
          {terapia.note && <RigaInfo label="Note" valore={terapia.note} />}
        </div>

        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-5 py-5 space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-gray-900">
              Somministrazione
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Registra quando hai dato il farmaco e controlla la prossima
              somministrazione prevista.
            </p>
          </div>

          <div className="rounded-2xl bg-[#FDF8F3] border border-gray-100 px-4 py-3 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-400">Ultima</span>
              <span className="text-right text-sm font-semibold text-gray-800">
                {ultimaSomministrazione
                  ? formatDataOra(ultimaSomministrazione.somministrata_il)
                  : 'Nessuna registrazione'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-400">Prossima</span>
              <span className="text-right text-sm font-semibold text-gray-800">
                {getTestoProssimaSomministrazione(
                  terapia,
                  prossimaSomministrazione
                )}
              </span>
            </div>
          </div>

          {terapia.frequenza !== 'una_volta_giorno' &&
            terapia.stato === 'attiva' && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-700">
                  Per ora il promemoria automatico negli impegni si aggiorna bene
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
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 active:scale-[0.98] transition-all"
              >
                Segna somministrata
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-600">
                La terapia non è attiva, quindi non può essere registrata una
                nuova somministrazione.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-5 py-5 space-y-3">
          <div>
            <h2 className="text-base font-extrabold text-gray-900">
              Gestione terapia
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Modifica i dati o aggiorna lo stato della terapia.
            </p>
          </div>

          <Link
            href={`/terapie/${terapia.id}/modifica`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-600 shadow-sm active:scale-[0.98] transition-all"
          >
            <Pencil size={16} strokeWidth={2.2} />
            Modifica terapia
          </Link>

          {terapia.stato === 'attiva' && (
            <form action={concludiTerapia}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 py-4 text-sm font-bold text-amber-700 active:scale-[0.98] transition-all"
              >
                <CircleStop size={16} strokeWidth={2.2} />
                Concludi terapia
              </button>
            </form>
          )}

          {(terapia.stato === 'attiva' || terapia.stato === 'conclusa') && (
            <form action={archiviaTerapia}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-600 shadow-sm active:scale-[0.98] transition-all"
              >
                <Archive size={16} strokeWidth={2.2} />
                Archivia terapia
              </button>
            </form>
          )}
        </div>

        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-5 py-5 space-y-3">
          <div>
            <h2 className="text-base font-extrabold text-gray-900">
              Storico somministrazioni
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Ultime registrazioni effettuate per questa terapia.
            </p>
          </div>

          {somministrazioni.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FDF8F3] px-4 py-6 text-center">
              <p className="text-sm font-medium text-gray-500">
                Nessuna somministrazione registrata.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {somministrazioni.map((somministrazione) => (
                <div
                  key={somministrazione.id}
                  className="rounded-2xl border border-gray-100 bg-[#FDF8F3] px-4 py-4"
                >
                  <div className="flex items-center gap-2 text-amber-600">
                    <Check size={16} strokeWidth={2.6} />
                    <p className="text-sm font-bold">
                      {formatDataOra(somministrazione.somministrata_il)}
                    </p>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-500">
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 active:scale-[0.98] transition-all"
          >
            Torna alla scheda animale
          </Link>

          <Link
            href={`/animali/${terapia.animale_id}/terapie/nuova`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-600 shadow-sm active:scale-[0.98] transition-all"
          >
            Nuova terapia
          </Link>
        </div>
      </div>
    </div>
  )
}