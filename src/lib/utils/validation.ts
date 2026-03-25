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
  specie: z.string().min(1, 'Questo campo è obbligatorio'),
  razza: z.string().optional(),
  sesso: z.enum(['maschio','femmina','non_specificato']).optional(),
  data_nascita: z.string().optional(),
  peso: z.coerce.number().positive().optional(),
  note: z.string().optional(),
})

export const impegnoSchema = z.object({
  titolo: z.string().min(1, 'Il titolo è obbligatorio'),
  tipo: z.enum([
    'visita', 'terapia', 'controllo', 'vaccinazione',
    'toelettatura', 'addestramento', 'compleanno',
    'analisi_esame', 'peso', 'nota', 'altro'
  ]),
  data: z.string().min(1, 'La data è obbligatoria'),
  ora: z.string().optional(),
  frequenza: z.enum([
    'nessuna', 'settimanale', 'mensile',
    'trimestrale', 'semestrale', 'annuale'
  ]).default('nessuna'),
  notifiche_attive: z.boolean().default(false),
  note: z.string().optional(),
})

export const documentoSchema = z.object({
  titolo: z.string().min(1, 'Il titolo è obbligatorio'),
  categoria: z.enum(['ricetta','referto','analisi','certificato','documento_sanitario','ricevuta','altro']),
  data_documento: z.string().optional(),
  note: z.string().optional(),
})

export const terapiaSchema = z.object({
  nome_farmaco: z.string().min(1, 'Il nome del farmaco è obbligatorio'),
  dose: z.string().min(1, 'La dose è obbligatoria'),
  frequenza: z.enum(['una_volta_giorno','due_volte_giorno','tre_volte_giorno','al_bisogno','personalizzata']),
  frequenza_custom: z.string().optional(),
  data_inizio: z.string().min(1, 'La data di inizio è obbligatoria'),
  data_fine: z.string().optional(),
  note: z.string().optional(),
})

export type LoginData         = z.infer<typeof loginSchema>
export type RegistrazioneData = z.infer<typeof registrazioneSchema>
export type AnimaleData       = z.infer<typeof animaleSchema>
export type ImpegnoData       = z.infer<typeof impegnoSchema>
export type DocumentoData     = z.infer<typeof documentoSchema>
export type TerapiaData       = z.infer<typeof terapiaSchema>