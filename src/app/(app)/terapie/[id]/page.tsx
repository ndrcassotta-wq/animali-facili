import type { ReactNode } from 'react'
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
  CalendarDays,
  Clock3,
  PawPrint,
  NotebookText,
  ChevronRight,
  History,
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

function getStatoBadge(stato: string | null) {
  switch (stato) {
    case 'attiva':
      return {
        label: 'Attiva',
        cls: 'bg-green-100 text-green-700 border-green-200',
        box: 'bg-green-100',
      }
    case 'conclusa':
      return {
        label: 'Conclusa',
        cls: 'bg-amber-100 text-amber-700 border-amber-200',
        box: 'bg-amber-100',
      }
    case 'archiviata':
      return {
        label: 'Archiviata',
        cls: 'bg-gray-100 text-gray-600 border-gray-200',
        box: 'bg-gray-100',
      }
    default:
      return {
        label: getLabelStato(stato),
        cls: 'bg-blue-100 text-blue-700 border-blue-200',
        box: 'bg-blue-100',
      }
  }
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="mb-4">
        <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-gray-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function InfoTile({
  icon,
  label,
  valore,
}: {
  icon: ReactNode
  label: string
  valore: string
}) {
  return (
    <div className="rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-400">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#EEE4D9]">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.08em]">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold leading-5 text-gray-800 whitespace-pre-wrap break-words">
        {valore}
      </p>
    </div>
  )
}

function ActionLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-bold text-gray-700 shadow-sm active:scale-[0.98] transition-all"
    >
      <span className="flex items-center gap-2">{children}</span>
      <ChevronRight size={18} strokeWidth={2.3} />
    </Link>
  )
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
    <div
      className="min-h-screen bg-[#F7F1EA]"
      style={{ minHeight: '100dvh' }}
    >
      <div className="mx-auto w-full max-w-md">
        <header className="rounded-b-[36px] bg-gradient-to-b from-[#FFF4E8] to-[#F7F1EA] px-5 pb-6 pt-10">
          <Link
            href={`/animali/${terapia.animale_id}?tab=terapie`}
            className="mb-5 inline-flex items-center gap-2 text-gray-500 active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">Indietro</span>
          </Link>

          <div className="rounded-[30px] border border-[#F1E4D7] bg-white/90 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px]',
                  statoBadge.box
                )}
              >
                <Stethoscope
                  size={28}
                  className="text-gray-700"
                  strokeWidth={2.2}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-bold',
                      statoBadge.cls
                    )}
                  >
                    {statoBadge.label}
                  </span>

                  {animale ? (
                    <span className="rounded-full border border-[#EEE4D9] bg-[#FCF8F3] px-3 py-1 text-xs font-semibold text-gray-600">
                      {animale.nome}
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-3 text-2xl font-extrabold leading-7 tracking-tight text-gray-900">
                  {terapia.nome_farmaco}
                </h1>

                <p className="mt-2 text-sm leading-5 text-gray-500">
                  Scheda terapia aggiornata con stile più chiaro, mobile e
                  coerente con il nuovo flusso.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <InfoTile
                icon={<Clock3 size={16} strokeWidth={2.2} />}
                label="Frequenza"
                valore={getLabelFrequenza(terapia.frequenza)}
              />
              <InfoTile
                icon={<NotebookText size={16} strokeWidth={2.2} />}
                label="Dose"
                valore={terapia.dose || 'Non indicata'}
              />
            </div>
          </div>
        </header>

        <div className="space-y-4 px-5 pb-32 pt-4">
          <SectionCard
            title="Dettagli terapia"
            description="Tutte le informazioni principali in una vista più ordinata e leggibile."
          >
            <div className="grid grid-cols-2 gap-3">
              <InfoTile
                icon={<PawPrint size={16} strokeWidth={2.2} />}
                label="Animale"
                valore={animale?.nome || 'Non associato'}
              />
              <InfoTile
                icon={<Clock3 size={16} strokeWidth={2.2} />}
                label="Orario"
                valore={
                  terapia.ora_somministrazione?.slice(0, 5) || 'Non indicato'
                }
              />
              <InfoTile
                icon={<CalendarDays size={16} strokeWidth={2.2} />}
                label="Data inizio"
                valore={
                  terapia.data_inizio
                    ? formatData(terapia.data_inizio)
                    : 'Non indicata'
                }
              />
              <InfoTile
                icon={<CalendarDays size={16} strokeWidth={2.2} />}
                label="Data fine"
                valore={
                  terapia.data_fine
                    ? formatData(terapia.data_fine)
                    : 'Non indicata'
                }
              />
            </div>

            {terapia.note ? (
              <div className="mt-3 rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                  Note terapia
                </p>
                <p className="whitespace-pre-wrap break-words text-sm font-medium leading-5 text-gray-700">
                  {terapia.note}
                </p>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Somministrazione"
            description="Registra il farmaco e tieni d’occhio l’ultimo inserimento e il prossimo previsto."
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                  Ultima somministrazione
                </p>
                <p className="mt-2 text-sm font-bold text-gray-800">
                  {ultimaSomministrazione
                    ? formatDataOra(ultimaSomministrazione.somministrata_il)
                    : 'Nessuna registrazione'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                  Prossima somministrazione
                </p>
                <p className="mt-2 text-sm font-bold text-gray-800">
                  {getTestoProssimaSomministrazione(
                    terapia,
                    prossimaSomministrazione
                  )}
                </p>
              </div>
            </div>

            {terapia.frequenza !== 'una_volta_giorno' &&
              terapia.stato === 'attiva' && (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-medium leading-5 text-amber-700">
                    Per ora il promemoria automatico negli impegni è ottimizzato
                    soprattutto per le terapie 1× al giorno.
                  </p>
                </div>
              )}

            {terapia.stato === 'attiva' ? (
              <form action={segnaSomministrata} className="mt-4 space-y-3">
                <div className="space-y-2">
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
                    className="w-full rounded-2xl border border-gray-200 bg-[#FCF8F3] px-4 py-3 text-base text-gray-800 outline-none placeholder:text-gray-400"
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
              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm font-medium leading-5 text-gray-600">
                  La terapia non è attiva, quindi non puoi registrare una nuova
                  somministrazione.
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Gestione terapia"
            description="Azioni rapide per modificare o cambiare lo stato della terapia."
          >
            <div className="space-y-3">
              <ActionLink href={`/terapie/${terapia.id}/modifica`}>
                <Pencil size={16} strokeWidth={2.2} />
                Modifica terapia
              </ActionLink>

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
          </SectionCard>

          <SectionCard
            title="Storico somministrazioni"
            description="Ultime registrazioni effettuate per questa terapia."
          >
            {somministrazioni.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E7DBCF] bg-[#FCF8F3] px-4 py-8 text-center">
                <History
                  size={22}
                  strokeWidth={2.2}
                  className="mx-auto mb-3 text-gray-400"
                />
                <p className="text-sm font-medium text-gray-500">
                  Nessuna somministrazione registrata.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {somministrazioni.map((somministrazione) => (
                  <div
                    key={somministrazione.id}
                    className="rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3] px-4 py-4"
                  >
                    <div className="flex items-center gap-2 text-amber-600">
                      <Check size={16} strokeWidth={2.6} />
                      <p className="text-sm font-bold">
                        {formatDataOra(somministrazione.somministrata_il)}
                      </p>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5 text-gray-500">
                      {somministrazione.nota || 'Nessuna nota'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

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
    </div>
  )
}