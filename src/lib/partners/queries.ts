import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type {
  PartnerCategory,
  PartnerStatus,
  PartnerSpecies,
} from '@/lib/constants/partners'
import type { PartnerSubmissionInput } from '@/lib/validators/partners'
import {
  buildPartnerBaseSlug,
  buildPartnerSlugCandidates,
} from '@/lib/partners/slug'

export type PartnerProfile = {
  id: string
  slug: string
  nome: string
  categoria: PartnerCategory
  citta: string
  provincia: string
  descrizione: string
  specie_trattate: string[]
  servizi_principali: string[]
  indirizzo_completo: string | null
  telefono: string | null
  whatsapp: string | null
  email: string | null
  sito: string | null
  zona_servita: string | null
  status: PartnerStatus
  created_source: string
  submitted_at: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export type ApprovedPartnerFilters = {
  q?: string
  categoria?: PartnerCategory
  luogo?: string
  specie?: PartnerSpecies
}

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

export async function getApprovedPartners(filters: ApprovedPartnerFilters = {}) {
  const supabase = await createClient()

  let query = supabase
    .from('partner_profiles')
    .select('*')
    .eq('status', 'approvato')
    .order('nome', { ascending: true })

  if (filters.categoria) {
    query = query.eq('categoria', filters.categoria)
  }

  if (filters.specie) {
    query = query.contains('specie_trattate', [filters.specie])
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Errore caricamento partner: ${error.message}`)
  }

  let partners = (data ?? []) as PartnerProfile[]

  const q = normalizeText(filters.q)
  if (q) {
    partners = partners.filter((partner) =>
      [partner.nome, partner.indirizzo_completo ?? '', partner.citta]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }

  const luogo = normalizeText(filters.luogo)
  if (luogo) {
    partners = partners.filter((partner) =>
      [partner.citta, partner.provincia]
        .join(' ')
        .toLowerCase()
        .includes(luogo)
    )
  }

  return partners
}

export async function getPartnerBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('partner_profiles')
    .select('*')
    .eq('status', 'approvato')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw new Error(`Errore caricamento partner: ${error.message}`)
  }

  return (data ?? null) as PartnerProfile | null
}

export async function createPartnerSubmission(payload: PartnerSubmissionInput) {
  const supabase = await createClient()

  const baseSlug = buildPartnerBaseSlug(payload.nome, payload.citta)
  const candidates = buildPartnerSlugCandidates(baseSlug, 20)

  for (const slug of candidates) {
    const { error } = await supabase.from('partner_profiles').insert({
      slug,
      nome: payload.nome,
      categoria: payload.categoria,
      citta: payload.citta,
      provincia: payload.provincia,
      descrizione: payload.descrizione,
      specie_trattate: payload.specie_trattate,
      servizi_principali: payload.servizi_principali,
      indirizzo_completo: payload.indirizzo_completo ?? null,
      telefono: payload.telefono ?? null,
      whatsapp: payload.whatsapp ?? null,
      email: payload.email ?? null,
      sito: payload.sito ?? null,
      zona_servita: payload.zona_servita ?? null,
      status: 'in_revisione',
      created_source: 'public_form',
    })

    if (!error) {
      return { slug }
    }

    const isUniqueViolation =
      error.code === '23505' ||
      error.message.toLowerCase().includes('duplicate key') ||
      error.message.toLowerCase().includes('partner_profiles_slug_key')

    if (isUniqueViolation) {
      continue
    }

    throw new Error(`Errore invio candidatura: ${error.message}`)
  }

  throw new Error(
    'Non sono riuscito a generare uno slug univoco per questa candidatura.'
  )
}