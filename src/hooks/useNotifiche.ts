import type { PreferenzeNotifiche } from '@/lib/types/database.types'

export type ModalitaNotificaImpegno =
  | 'nessuna'
  | 'giorno_stesso'
  | 'giorno_prima'
  | 'all_orario'
  | 'un_ora_prima'

export const ORARIO_DEFAULT_NOTIFICA_IMPEGNO = 9

export const PREFERENZE_DEFAULT: PreferenzeNotifiche = {
  attive: true,
  ore: 9,
  giorni_prima: 1,
  tipi_abilitati: [
    'visita',
    'controllo',
    'vaccinazione',
    'toelettatura',
    'addestramento',
    'compleanno',
    'altro',
    'terapia',
  ],
}

export const PROFILO_ANTICIPO = {
  tipi: ['compleanno'],
  giorni_prima: 1,
  label: 'Giorno prima',
}

export const PROFILO_IMMEDIATO = {
  tipi: ['terapia'],
  giorni_prima: 0,
  label: 'Giorno stesso',
}

export function normalizzaPreferenzeNotifiche(
  preferenze?: PreferenzeNotifiche | null
): PreferenzeNotifiche {
  return {
    attive:
      typeof preferenze?.attive === 'boolean'
        ? preferenze.attive
        : PREFERENZE_DEFAULT.attive,
    ore:
      typeof preferenze?.ore === 'number'
        ? preferenze.ore
        : PREFERENZE_DEFAULT.ore,
    giorni_prima:
      typeof preferenze?.giorni_prima === 'number'
        ? preferenze.giorni_prima
        : PREFERENZE_DEFAULT.giorni_prima,
    tipi_abilitati:
      Array.isArray(preferenze?.tipi_abilitati) &&
      preferenze.tipi_abilitati.length > 0
        ? Array.from(
            new Set(
              preferenze.tipi_abilitati.filter(
                (tipo): tipo is string => typeof tipo === 'string'
              )
            )
          )
        : PREFERENZE_DEFAULT.tipi_abilitati,
  }
}

// Guard: le notifiche funzionano solo in Capacitor nativo, non su browser
function isCapacitorNativo(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.()
  )
}

function creaDataConOra(
  data: string,
  ora?: string | null,
  fallbackOre = ORARIO_DEFAULT_NOTIFICA_IMPEGNO
) {
  const risultato = new Date(`${data}T00:00:00`)

  if (ora) {
    const [ore, minuti] = ora.split(':').map(Number)
    risultato.setHours(ore || 0, minuti || 0, 0, 0)
    return risultato
  }

  risultato.setHours(fallbackOre, 0, 0, 0)
  return risultato
}

function calcolaDataNotificaNormale({
  data,
  ora,
  modalita,
}: {
  data: string
  ora?: string | null
  modalita?: ModalitaNotificaImpegno
}) {
  switch (modalita) {
    case 'nessuna':
      return null

    case 'all_orario':
      if (!ora) return null
      return creaDataConOra(data, ora)

    case 'un_ora_prima': {
      if (!ora) return null
      const dataImpegno = creaDataConOra(data, ora)
      dataImpegno.setHours(dataImpegno.getHours() - 1)
      return dataImpegno
    }

    case 'giorno_prima': {
      const dataNotifica = creaDataConOra(
        data,
        null,
        ORARIO_DEFAULT_NOTIFICA_IMPEGNO
      )
      dataNotifica.setDate(dataNotifica.getDate() - 1)
      return dataNotifica
    }

    case 'giorno_stesso':
    default:
      return creaDataConOra(data, null, ORARIO_DEFAULT_NOTIFICA_IMPEGNO)
  }
}

function calcolaDataNotificaCompleanno(
  data: string,
  preferenze: PreferenzeNotifiche
) {
  const dataNotifica = creaDataConOra(data, null, preferenze.ore)
  dataNotifica.setDate(dataNotifica.getDate() - preferenze.giorni_prima)
  return dataNotifica
}

function calcolaDataNotificaTerapia({
  data,
  ora,
  preferenze,
}: {
  data: string
  ora?: string | null
  preferenze: PreferenzeNotifiche
}) {
  if (ora) {
    return creaDataConOra(data, ora)
  }

  return creaDataConOra(data, null, preferenze.ore)
}

function creaCorpoNotifica({
  titolo,
  animaleNome,
  tipo,
  modalita,
  dataNotifica,
  dataEvento,
  ora,
}: {
  titolo: string
  animaleNome: string
  tipo: string
  modalita?: ModalitaNotificaImpegno
  dataNotifica: Date
  dataEvento: Date
  ora?: string | null
}) {
  const stessoGiorno =
    dataNotifica.toDateString() === dataEvento.toDateString()

  if (tipo === 'terapia') {
    if (ora) {
      return `È il momento di ${titolo.toLowerCase()} per ${animaleNome}`
    }
    return `Oggi: ${titolo} per ${animaleNome}`
  }

  if (tipo === 'compleanno') {
    return stessoGiorno
      ? `Oggi è il compleanno di ${animaleNome}`
      : `Si avvicina il compleanno di ${animaleNome}`
  }

  switch (modalita) {
    case 'all_orario':
      return `È il momento di ${titolo.toLowerCase()} per ${animaleNome}`

    case 'un_ora_prima':
      return `Tra un'ora: ${titolo} per ${animaleNome}`

    case 'giorno_prima':
      return `Domani: ${titolo} per ${animaleNome}`

    case 'giorno_stesso':
    default:
      return `Oggi: ${titolo} per ${animaleNome}`
  }
}

function calcolaDataNotifica({
  tipo,
  data,
  ora,
  modalita,
  preferenze,
}: {
  tipo: string
  data: string
  ora?: string | null
  modalita?: ModalitaNotificaImpegno
  preferenze: PreferenzeNotifiche
}) {
  if (tipo === 'compleanno') {
    if (!preferenze.attive) return null
    if (!preferenze.tipi_abilitati.includes('compleanno')) return null
    return calcolaDataNotificaCompleanno(data, preferenze)
  }

  if (tipo === 'terapia') {
    if (!preferenze.attive) return null
    if (!preferenze.tipi_abilitati.includes('terapia')) return null
    return calcolaDataNotificaTerapia({ data, ora, preferenze })
  }

  if (modalita) {
    return calcolaDataNotificaNormale({ data, ora, modalita })
  }

  // fallback legacy: se esistono ancora vecchi flussi che non passano la modalità,
  // continua a usare la logica storica da profilo
  if (!preferenze.attive) return null
  if (!preferenze.tipi_abilitati.includes(tipo)) return null

  const dataNotifica = creaDataConOra(data, null, preferenze.ore)
  dataNotifica.setDate(dataNotifica.getDate() - preferenze.giorni_prima)
  return dataNotifica
}

export async function richiediPermessoNotifiche(): Promise<boolean> {
  if (!isCapacitorNativo()) return false
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.requestPermissions()
    return display === 'granted'
  } catch {
    return false
  }
}

export async function programmaNotificaImpegno({
  id,
  titolo,
  animaleNome,
  data,
  ora,
  tipo,
  preferenze = PREFERENZE_DEFAULT,
  modalita,
}: {
  id: string
  titolo: string
  animaleNome: string
  data: string
  ora?: string | null
  tipo: string
  preferenze?: PreferenzeNotifiche
  modalita?: ModalitaNotificaImpegno
}): Promise<void> {
  if (!isCapacitorNativo()) return

  const preferenzeNormalizzate = normalizzaPreferenzeNotifiche(preferenze)
  const dataEvento = creaDataConOra(
    data,
    ora,
    ORARIO_DEFAULT_NOTIFICA_IMPEGNO
  )

  const dataNotifica = calcolaDataNotifica({
    tipo,
    data,
    ora,
    modalita,
    preferenze: preferenzeNormalizzate,
  })

  if (!dataNotifica) return
  if (dataNotifica <= new Date()) return

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    const idNumerico = parseInt(id.replace(/-/g, '').substring(0, 8), 16)

    const corpo = creaCorpoNotifica({
      titolo,
      animaleNome,
      tipo,
      modalita,
      dataNotifica,
      dataEvento,
      ora,
    })

    await LocalNotifications.schedule({
      notifications: [
        {
          id: idNumerico,
          title: `📅 ${titolo}`,
          body: corpo,
          schedule: { at: dataNotifica },
          sound: undefined,
          actionTypeId: '',
          extra: { impegnoId: id },
        },
      ],
    })
  } catch (e) {
    console.warn('Notifica non programmata:', e)
  }
}

export async function cancellaNotificaImpegno(id: string): Promise<void> {
  if (!isCapacitorNativo()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const idNumerico = parseInt(id.replace(/-/g, '').substring(0, 8), 16)
    await LocalNotifications.cancel({ notifications: [{ id: idNumerico }] })
  } catch (e) {
    console.warn('Notifica non cancellata:', e)
  }
}