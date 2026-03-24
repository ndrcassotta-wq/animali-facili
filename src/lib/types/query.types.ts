import type { Database, Json } from './database.types'

type Tables = Database['public']['Tables']

export type Animale   = Tables['animali']['Row']
export type Impegno   = Tables['impegni']['Row']
export type Documento = Tables['documenti']['Row']
export type Terapia   = Tables['terapie']['Row']

type ConAnimale = { animali: { nome: string } | null }

export type ImpegnoConAnimale   = Impegno   & ConAnimale
export type DocumentoConAnimale = Documento & ConAnimale

export function asImpegniConAnimale(data: unknown): ImpegnoConAnimale[] {
  return (data ?? []) as ImpegnoConAnimale[]
}
export function asDocumentiConAnimale(data: unknown): DocumentoConAnimale[] {
  return (data ?? []) as DocumentoConAnimale[]
}

export type { Json }