import { LocalNotifications } from '@capacitor/local-notifications'
import type { PreferenzeNotifiche } from '@/lib/types/database.types'

export const PREFERENZE_DEFAULT: PreferenzeNotifiche = {
  attive: true,
  ore: 9,
  giorni_prima: 1,
  tipi_abilitati: [
    'visita', 'controllo', 'vaccinazione', 'toelettatura',
    'addestramento', 'compleanno', 'altro'
  ],
}

// Profilo A — anticipo (visite, vaccini, controlli, ecc.)
export const PROFILO_ANTICIPO = {
  tipi: ['visita', 'controllo', 'vaccinazione', 'toelettatura', 'addestramento', 'compleanno', 'altro'],
  giorni_prima: 1,
  label: 'Giorno prima',
}

// Profilo B — immediato (terapie da somministrare)
export const PROFILO_IMMEDIATO = {
  tipi: ['terapia'],
  giorni_prima: 0,
  label: 'Giorno stesso',
}

export async function richiediPermessoNotifiche(): Promise<boolean> {
  const { display } = await LocalNotifications.requestPermissions()
  return display === 'granted'
}

export async function programmaNotificaImpegno({
  id,
  titolo,
  animaleNome,
  data,
  tipo,
  preferenze = PREFERENZE_DEFAULT,
}: {
  id: string
  titolo: string
  animaleNome: string
  data: string
  tipo: string
  preferenze?: PreferenzeNotifiche
}): Promise<void> {
  if (!preferenze.attive) return
  if (!preferenze.tipi_abilitati.includes(tipo)) return

  // Determina giorni di anticipo in base al profilo
  const giorniPrima = PROFILO_IMMEDIATO.tipi.includes(tipo)
    ? 0
    : preferenze.giorni_prima

  const dataImpegno = new Date(data)
  const dataNotifica = new Date(dataImpegno)
  dataNotifica.setDate(dataNotifica.getDate() - giorniPrima)
  dataNotifica.setHours(preferenze.ore, 0, 0, 0)

  if (dataNotifica <= new Date()) return

  const idNumerico = parseInt(id.replace(/-/g, '').substring(0, 8), 16)

  const corpo = giorniPrima === 0
    ? `Oggi: ${titolo} per ${animaleNome}`
    : giorniPrima === 1
    ? `Domani: ${titolo} per ${animaleNome}`
    : `Tra ${giorniPrima} giorni: ${titolo} per ${animaleNome}`

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
}

export async function cancellaNotificaImpegno(id: string): Promise<void> {
  const idNumerico = parseInt(id.replace(/-/g, '').substring(0, 8), 16)
  await LocalNotifications.cancel({
    notifications: [{ id: idNumerico }],
  })
}