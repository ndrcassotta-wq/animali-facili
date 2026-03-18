import { format, formatDistanceToNow, isPast, isToday, addDays } from 'date-fns'
import { it } from 'date-fns/locale'

export const formatData = (date: string | Date) =>
  format(new Date(date), 'd MMM yyyy', { locale: it })

export const formatDataBreve = (date: string | Date) =>
  format(new Date(date), 'd MMM', { locale: it })

export const formatRelativo = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: it })

export const isScaduta = (date: string | Date) => isPast(new Date(date))

export const isOggi = (date: string | Date) => isToday(new Date(date))

export const isImminente = (date: string | Date) =>
  !isPast(new Date(date)) && new Date(date) <= addDays(new Date(), 7)