export const PARTNER_CATEGORY_VALUES = [
  'veterinario',
  'toelettatore',
  'pet_sitter',
  'educatore',
  'pensione_asilo',
  'allevatore',
  'negozio_animali',
] as const

export type PartnerCategory = (typeof PARTNER_CATEGORY_VALUES)[number]

export const PARTNER_STATUS_VALUES = [
  'bozza',
  'in_revisione',
  'approvato',
  'sospeso',
] as const

export type PartnerStatus = (typeof PARTNER_STATUS_VALUES)[number]

export const PARTNER_CATEGORY_LABELS: Record<PartnerCategory, string> = {
  veterinario: 'Veterinario',
  toelettatore: 'Toelettatore',
  pet_sitter: 'Pet sitter / Dog sitter',
  educatore: 'Educatore / Addestratore',
  pensione_asilo: 'Pensione / Asilo',
  allevatore: 'Allevatore',
  negozio_animali: 'Negozio articoli animali',
}

export const PARTNER_SPECIES_VALUES = [
  'cani',
  'gatti',
  'conigli',
  'piccoli_mammiferi',
  'uccelli',
  'rettili',
  'pesci',
  'altri_animali',
] as const

export type PartnerSpecies = (typeof PARTNER_SPECIES_VALUES)[number]

export const PARTNER_SPECIES_LABELS: Record<PartnerSpecies, string> = {
  cani: 'Cani',
  gatti: 'Gatti',
  conigli: 'Conigli',
  piccoli_mammiferi: 'Piccoli mammiferi',
  uccelli: 'Uccelli',
  rettili: 'Rettili',
  pesci: 'Pesci',
  altri_animali: 'Altri animali',
}

export const PARTNER_SERVICE_SUGGESTIONS = [
  'Visite',
  'Vaccinazioni',
  'Analisi',
  'Chirurgia',
  'Toelettatura',
  'Bagnetto',
  'Pet sitting',
  'Dog walking',
  'Educazione base',
  'Addestramento',
  'Asilo diurno',
  'Pensione',
  'Vendita prodotti',
  'Consulenze',
] as const

export function getPartnerCategoryLabel(value: string | null | undefined) {
  if (!value || !isPartnerCategory(value)) return 'Categoria'
  return PARTNER_CATEGORY_LABELS[value]
}

export function getPartnerSpeciesLabel(value: string | null | undefined) {
  if (!value || !isPartnerSpecies(value)) return value ?? ''
  return PARTNER_SPECIES_LABELS[value]
}

export function isPartnerCategory(
  value: string | null | undefined
): value is PartnerCategory {
  return !!value && PARTNER_CATEGORY_VALUES.includes(value as PartnerCategory)
}

export function isPartnerSpecies(
  value: string | null | undefined
): value is PartnerSpecies {
  return !!value && PARTNER_SPECIES_VALUES.includes(value as PartnerSpecies)
}