export type CategoriaAnimale =
  | 'cani' | 'gatti' | 'pesci'
  | 'uccelli' | 'rettili' | 'piccoli_mammiferi' | 'altri_animali'

export type TipoImpegno =
  | 'visita' | 'terapia' | 'controllo' | 'vaccinazione'
  | 'toelettatura' | 'addestramento' | 'compleanno'
  | 'analisi_esame' | 'peso' | 'nota' | 'altro'

export type FrequenzaImpegno =
  | 'nessuna' | 'settimanale' | 'mensile'
  | 'trimestrale' | 'semestrale' | 'annuale'

export type StatoImpegno = 'programmato' | 'completato' | 'annullato'

export type CategoriaDocumento =
  | 'ricetta' | 'referto' | 'analisi' | 'certificato'
  | 'documento_sanitario' | 'ricevuta' | 'altro'