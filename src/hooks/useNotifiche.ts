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

export const PROFILO_ANTICIPO = {
  tipi: ['visita', 'controllo', 'vaccinazione', 'toelettatura', 'addestramento', 'compleanno', 'altro'],
  giorni_prima: 1,
  label: 'Giorno prima',
}

export const PROFILO_IMMEDIATO = {
  tipi: ['terapia'],
  giorni_prima: 0,
  label: 'Giorno stesso',
}

// Guard: le notifiche funzionano solo in Capacitor nativo, non su browser
function isCapacitorNativo(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.()
  )
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
  if (!isCapacitorNativo()) return
  if (!preferenze.attive) return
  if (!preferenze.tipi_abilitati.includes(tipo)) return

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    const giorniPrima = PROFILO_IMMEDIATO.tipi.includes(tipo)
      ? 0
      : preferenze.giorni_prima

    const dataImpegno  = new Date(data)
    const dataNotifica = new Date(dataImpegno)
    dataNotifica.setDate(dataNotifica.getDate() - giorniPrima)
    dataNotifica.setHours(preferenze.ore, 0, 0, 0)

    if (dataNotifica <= new Date()) return

    const idNumerico = parseInt(id.replace(/-/g, '').substring(0, 8), 16)

    const corpo =
      giorniPrima === 0 ? `Oggi: ${titolo} per ${animaleNome}` :
      giorniPrima === 1 ? `Domani: ${titolo} per ${animaleNome}` :
                          `Tra ${giorniPrima} giorni: ${titolo} per ${animaleNome}`

    await LocalNotifications.schedule({
      notifications: [{
        id: idNumerico,
        title: `📅 ${titolo}`,
        body: corpo,
        schedule: { at: dataNotifica },
        sound: undefined,
        actionTypeId: '',
        extra: { impegnoId: id },
      }],
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