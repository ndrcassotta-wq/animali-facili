import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type AppointmentFrequency =
  | 'nessuna'
  | 'settimanale'
  | 'mensile'
  | 'trimestrale'
  | 'semestrale'
  | 'annuale'

function isRecurringAppointmentFrequency(
  value: string | null | undefined
): value is Exclude<AppointmentFrequency, 'nessuna'> {
  return (
    value === 'settimanale' ||
    value === 'mensile' ||
    value === 'trimestrale' ||
    value === 'semestrale' ||
    value === 'annuale'
  )
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

function formatLocalDate(year: number, month: number, day: number) {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function getLastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function addDaysToDateString(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0)

  date.setDate(date.getDate() + days)

  return formatLocalDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
}

function addMonthsClamped(value: string, monthsToAdd: number) {
  const { year, month, day } = parseLocalDate(value)

  const zeroBasedTargetMonth = month - 1 + monthsToAdd
  const targetYear = year + Math.floor(zeroBasedTargetMonth / 12)
  const targetMonth = ((zeroBasedTargetMonth % 12) + 12) % 12 + 1
  const lastDay = getLastDayOfMonth(targetYear, targetMonth)
  const targetDay = Math.min(day, lastDay)

  return formatLocalDate(targetYear, targetMonth, targetDay)
}

function addYearsClamped(value: string, yearsToAdd: number) {
  const { year, month, day } = parseLocalDate(value)

  const targetYear = year + yearsToAdd
  const lastDay = getLastDayOfMonth(targetYear, month)
  const targetDay = Math.min(day, lastDay)

  return formatLocalDate(targetYear, month, targetDay)
}

function getNextAppointmentDate(
  currentDate: string,
  frequency: AppointmentFrequency
): string | null {
  switch (frequency) {
    case 'nessuna':
      return null
    case 'settimanale':
      return addDaysToDateString(currentDate, 7)
    case 'mensile':
      return addMonthsClamped(currentDate, 1)
    case 'trimestrale':
      return addMonthsClamped(currentDate, 3)
    case 'semestrale':
      return addMonthsClamped(currentDate, 6)
    case 'annuale':
      return addYearsClamped(currentDate, 1)
    default:
      return null
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 })
  }

  const { data: existingAppointment, error: readError } = await supabase
    .from('impegni')
    .select(
      'id, animale_id, titolo, tipo, stato, data, ora, frequenza, note, created_by_user_id, created_by_partner_profile_id, created_source'
    )
    .eq('id', id)
    .single()

  if (readError || !existingAppointment) {
    return NextResponse.json(
      { error: 'Impegno non trovato.' },
      { status: 404 }
    )
  }

  if (existingAppointment.tipo === 'compleanno') {
    return NextResponse.json(
      {
        error:
          'Il compleanno viene gestito automaticamente e non può essere completato manualmente.',
      },
      { status: 400 }
    )
  }

  const { data: completedRows, error: updateError } = await supabase
    .from('impegni')
    .update({ stato: 'completato' })
    .eq('id', id)
    .is('created_by_partner_profile_id', null)
    .in('created_source', ['owner', 'family'])
    .neq('stato', 'completato')
    .neq('stato', 'annullato')
    .select('id')

  if (updateError) {
    return NextResponse.json(
      { error: 'Non è stato possibile completare l’impegno.' },
      { status: 400 }
    )
  }

  const didCompleteNow = Array.isArray(completedRows) && completedRows.length > 0

  if (
    didCompleteNow &&
    isRecurringAppointmentFrequency(existingAppointment.frequenza)
  ) {
    const nextDate = getNextAppointmentDate(
      existingAppointment.data,
      existingAppointment.frequenza
    )

    if (nextDate) {
      let duplicateQuery = supabase
        .from('impegni')
        .select('id')
        .eq('animale_id', existingAppointment.animale_id)
        .eq('titolo', existingAppointment.titolo)
        .eq('tipo', existingAppointment.tipo)
        .eq('frequenza', existingAppointment.frequenza)
        .eq('data', nextDate)

      if (existingAppointment.ora == null) {
        duplicateQuery = duplicateQuery.is('ora', null)
      } else {
        duplicateQuery = duplicateQuery.eq('ora', existingAppointment.ora)
      }

      if (existingAppointment.created_by_partner_profile_id == null) {
        duplicateQuery = duplicateQuery.is('created_by_partner_profile_id', null)
      } else {
        duplicateQuery = duplicateQuery.eq(
          'created_by_partner_profile_id',
          existingAppointment.created_by_partner_profile_id
        )
      }

      if (existingAppointment.created_by_user_id == null) {
        duplicateQuery = duplicateQuery.is('created_by_user_id', null)
      } else {
        duplicateQuery = duplicateQuery.eq(
          'created_by_user_id',
          existingAppointment.created_by_user_id
        )
      }

      if (existingAppointment.created_source == null) {
        duplicateQuery = duplicateQuery.is('created_source', null)
      } else {
        duplicateQuery = duplicateQuery.eq(
          'created_source',
          existingAppointment.created_source
        )
      }

      const { data: duplicateExisting, error: duplicateError } =
        await duplicateQuery.limit(1)

      if (duplicateError) {
        return NextResponse.json(
          {
            error:
              'Impegno completato, ma non è stato possibile verificare la ricorrenza successiva.',
          },
          { status: 400 }
        )
      }

      const hasDuplicate =
        Array.isArray(duplicateExisting) && duplicateExisting.length > 0

      if (!hasDuplicate) {
        const { error: insertError } = await supabase.from('impegni').insert({
          animale_id: existingAppointment.animale_id,
          titolo: existingAppointment.titolo,
          tipo: existingAppointment.tipo,
          stato: 'programmato',
          data: nextDate,
          ora: existingAppointment.ora,
          frequenza: existingAppointment.frequenza,
          note: existingAppointment.note,
          created_by_user_id: user.id,
          created_by_partner_profile_id: null,
          created_source:
            existingAppointment.created_source === 'family' ? 'family' : 'owner',
        })

        if (insertError) {
          return NextResponse.json(
            {
              error:
                'Impegno completato, ma non è stato possibile creare la ricorrenza successiva.',
              details: insertError.message,
            },
            { status: 400 }
          )
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}