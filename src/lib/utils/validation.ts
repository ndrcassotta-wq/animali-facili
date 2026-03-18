import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Minimo 8 caratteri'),
})

export const registrazioneSchema = z.object({
  nome: z.string().min(2, 'Nome troppo corto'),
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Minimo 8 caratteri'),
})

export const animaleSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  categoria: z.enum(['cani','gatti','pesci','uccelli','rettili','piccoli_mammiferi','altri_animali']),
  specie: z.string().min(1, 'La specie è obbligatoria'),
  razza: z.string().optional(),
  sesso: z.enum(['maschio','femmina','non_specificato']).optional(),
  data_nascita: z.string().optional(),
  peso: z.coerce.number().positive().optional(),
  note: z.string().optional(),
})

export const scadenzaSchema = z.object({
  titolo: z.string().min(1, 'Il titolo è obbligatorio'),
  tipo: z.enum(['visita','terapia','controllo','manutenzione_habitat','alimentazione_integrazione','altro']),
  data: z.string().min(1, 'La data è obbligatoria'),
  frequenza: z.string().optional(),
  note: z.string().optional(),
  notifiche_attive: z.boolean().default(false),
})

export const eventoSchema = z.object({
  tipo: z.enum(['visita','trattamento','controllo','aggiornamento_peso','analisi_esame','nota','altro']),
  titolo: z.string().optional(),
  data: z.string().min(1, 'La data è obbligatoria'),
  descrizione: z.string().optional(),
})

export const documentoSchema = z.object({
  titolo: z.string().min(1, 'Il titolo è obbligatorio'),
  categoria: z.enum(['ricetta','referto','analisi','certificato','documento_sanitario','ricevuta','altro']),
  data_documento: z.string().optional(),
  note: z.string().optional(),
})

export type LoginData          = z.infer<typeof loginSchema>
export type RegistrazioneData  = z.infer<typeof registrazioneSchema>
export type AnimaleData        = z.infer<typeof animaleSchema>
export type ScadenzaData       = z.infer<typeof scadenzaSchema>
export type EventoData         = z.infer<typeof eventoSchema>
export type DocumentoData      = z.infer<typeof documentoSchema>