import type { Database, Json } from './database.types'

type Tables = Database['public']['Tables']

export type Animale   = Tables['animali']['Row']
export type Scadenza  = Tables['scadenze']['Row']
export type Evento    = Tables['eventi']['Row']
export type Documento = Tables['documenti']['Row']

type ConAnimale = { animali: { nome: string } | null }

export type ScadenzaConAnimale  = Scadenza  & ConAnimale
export type EventoConAnimale    = Evento    & ConAnimale
export type DocumentoConAnimale = Documento & ConAnimale

export function asScadenzeConAnimale(data: unknown): ScadenzaConAnimale[] {
  return (data ?? []) as ScadenzaConAnimale[]
}
export function asEventiConAnimale(data: unknown): EventoConAnimale[] {
  return (data ?? []) as EventoConAnimale[]
}
export function asDocumentiConAnimale(data: unknown): DocumentoConAnimale[] {
  return (data ?? []) as DocumentoConAnimale[]
}

export type { Json }