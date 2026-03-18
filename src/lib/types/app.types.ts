export type CategoriaAnimale =
  | 'cani' | 'gatti' | 'pesci'
  | 'uccelli' | 'rettili' | 'piccoli_mammiferi' | 'altri_animali'

export type TipoScadenza =
  | 'visita' | 'terapia' | 'controllo'
  | 'manutenzione_habitat' | 'alimentazione_integrazione' | 'altro'

export type TipoEvento =
  | 'visita' | 'trattamento' | 'controllo'
  | 'aggiornamento_peso' | 'analisi_esame' | 'nota' | 'altro'

export type CategoriaDocumento =
  | 'ricetta' | 'referto' | 'analisi' | 'certificato'
  | 'documento_sanitario' | 'ricevuta' | 'altro'

export type StatoScadenza = 'attiva' | 'completata' | 'archiviata'