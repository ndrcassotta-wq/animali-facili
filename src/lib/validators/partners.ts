import { z } from 'zod'
import {
  PARTNER_CATEGORY_VALUES,
  PARTNER_SPECIES_VALUES,
} from '@/lib/constants/partners'
import {
  getPartnerImageValidationMessage,
  isPartnerImageFile,
  isPartnerImageMimeTypeAllowed,
  isPartnerImageSizeAllowed,
} from '@/lib/partners/images'

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max).optional()
  )

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().email('Inserisci un indirizzo email valido.').max(255).optional()
)

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}, z.string().url('Inserisci un sito valido.').max(255).optional())

function normalizeTextArray(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )
}

function splitTextareaList(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return []
  return normalizeTextArray(
    value
      .split(/\r?\n|,/g)
      .map((item) => item.trim())
  )
}

export const partnerSubmissionSchema = z
  .object({
    nome: z.string().trim().min(2, 'Inserisci il nome del partner.').max(120),
    categoria: z.enum(PARTNER_CATEGORY_VALUES, {
      error: 'Seleziona una categoria valida.',
    }),
    citta: z.string().trim().min(2, 'Inserisci la città.').max(100),
    provincia: z.string().trim().min(2, 'Inserisci la provincia.').max(20),
    descrizione: z
      .string()
      .trim()
      .min(20, 'Aggiungi una descrizione un po’ più completa.')
      .max(2000, 'La descrizione è troppo lunga.'),
    specie_trattate: z
      .array(z.enum(PARTNER_SPECIES_VALUES))
      .min(1, 'Seleziona almeno una specie trattata.'),
    servizi_principali: z
      .array(z.string().trim().min(1).max(80))
      .min(1, 'Inserisci almeno un servizio principale.')
      .max(20, 'Troppi servizi principali per questa fase MVP.'),
    indirizzo_completo: optionalText(255),
    telefono: optionalText(50),
    whatsapp: optionalText(50),
    email: optionalEmail,
    sito: optionalUrl,
    zona_servita: optionalText(255),
  })
  .superRefine((data, ctx) => {
    const hasContact = Boolean(
      data.telefono || data.whatsapp || data.email || data.sito
    )

    if (!hasContact) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Inserisci almeno un contatto tra telefono, WhatsApp, email o sito.',
        path: ['contatti'],
      })
    }
  })

export type PartnerSubmissionInput = z.infer<typeof partnerSubmissionSchema>

export function normalizePartnerSubmissionFormData(formData: FormData) {
  const rawSpecies = formData
    .getAll('specie_trattate')
    .filter((value): value is string => typeof value === 'string')

  const rawServices = formData
    .getAll('servizi_principali')
    .filter((value): value is string => typeof value === 'string')

  const extraServices = splitTextareaList(formData.get('servizi_principali_extra'))

  const payload = {
    nome: String(formData.get('nome') ?? ''),
    categoria: String(formData.get('categoria') ?? ''),
    citta: String(formData.get('citta') ?? ''),
    provincia: String(formData.get('provincia') ?? ''),
    descrizione: String(formData.get('descrizione') ?? ''),
    specie_trattate: normalizeTextArray(rawSpecies),
    servizi_principali: normalizeTextArray([...rawServices, ...extraServices]),
    indirizzo_completo: formData.get('indirizzo_completo'),
    telefono: formData.get('telefono'),
    whatsapp: formData.get('whatsapp'),
    email: formData.get('email'),
    sito: formData.get('sito'),
    zona_servita: formData.get('zona_servita'),
  }

  return partnerSubmissionSchema.safeParse(payload)
}

export function validatePartnerImage(
  value: FormDataEntryValue | null
):
  | { success: true; data: File | null }
  | { success: false; error: string } {
  if (!isPartnerImageFile(value)) {
    return { success: true, data: null }
  }

  if (!isPartnerImageMimeTypeAllowed(value.type)) {
    return {
      success: false,
      error: getPartnerImageValidationMessage(),
    }
  }

  if (!isPartnerImageSizeAllowed(value.size)) {
    return {
      success: false,
      error: getPartnerImageValidationMessage(),
    }
  }

  return {
    success: true,
    data: value,
  }
}