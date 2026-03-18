export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profili: {
        Row: {
          id: string
          nome: string
          email: string
          notifiche_attive: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          notifiche_attive?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          notifiche_attive?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      animali: {
        Row: {
          id: string
          user_id: string
          nome: string
          categoria: 'cani' | 'gatti' | 'pesci' | 'uccelli' |
                     'rettili' | 'piccoli_mammiferi' | 'altri_animali'
          specie: string
          razza: string | null
          sesso: 'maschio' | 'femmina' | 'non_specificato' | null
          data_nascita: string | null
          peso: number | null
          foto_url: string | null
          meta_categoria: Json | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          categoria: 'cani' | 'gatti' | 'pesci' | 'uccelli' |
                     'rettili' | 'piccoli_mammiferi' | 'altri_animali'
          specie: string
          razza?: string | null
          sesso?: 'maschio' | 'femmina' | 'non_specificato' | null
          data_nascita?: string | null
          peso?: number | null
          foto_url?: string | null
          meta_categoria?: Json | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          categoria?: 'cani' | 'gatti' | 'pesci' | 'uccelli' |
                      'rettili' | 'piccoli_mammiferi' | 'altri_animali'
          specie?: string
          razza?: string | null
          sesso?: 'maschio' | 'femmina' | 'non_specificato' | null
          data_nascita?: string | null
          peso?: number | null
          foto_url?: string | null
          meta_categoria?: Json | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'animali_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profili'
            referencedColumns: ['id']
          }
        ]
      }
      scadenze: {
        Row: {
          id: string
          animale_id: string
          tipo: 'visita' | 'terapia' | 'controllo' |
                'manutenzione_habitat' | 'alimentazione_integrazione' | 'altro'
          titolo: string
          data: string
          frequenza: 'nessuna' | 'settimanale' | 'mensile' |
                     'trimestrale' | 'semestrale' | 'annuale'
          notifiche_attive: boolean
          stato: 'attiva' | 'completata' | 'archiviata'
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          animale_id: string
          tipo?: 'visita' | 'terapia' | 'controllo' |
                 'manutenzione_habitat' | 'alimentazione_integrazione' | 'altro'
          titolo: string
          data: string
          frequenza?: 'nessuna' | 'settimanale' | 'mensile' |
                      'trimestrale' | 'semestrale' | 'annuale'
          notifiche_attive?: boolean
          stato?: 'attiva' | 'completata' | 'archiviata'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          animale_id?: string
          tipo?: 'visita' | 'terapia' | 'controllo' |
                 'manutenzione_habitat' | 'alimentazione_integrazione' | 'altro'
          titolo?: string
          data?: string
          frequenza?: 'nessuna' | 'settimanale' | 'mensile' |
                      'trimestrale' | 'semestrale' | 'annuale'
          notifiche_attive?: boolean
          stato?: 'attiva' | 'completata' | 'archiviata'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scadenze_animale_id_fkey'
            columns: ['animale_id']
            isOneToOne: false
            referencedRelation: 'animali'
            referencedColumns: ['id']
          }
        ]
      }
      eventi: {
        Row: {
          id: string
          animale_id: string
          tipo: 'visita' | 'trattamento' | 'controllo' |
                'aggiornamento_peso' | 'analisi_esame' | 'nota' | 'altro'
          titolo: string | null
          data: string
          descrizione: string | null
          allegato_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          animale_id: string
          tipo?: 'visita' | 'trattamento' | 'controllo' |
                 'aggiornamento_peso' | 'analisi_esame' | 'nota' | 'altro'
          titolo?: string | null
          data?: string
          descrizione?: string | null
          allegato_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          animale_id?: string
          tipo?: 'visita' | 'trattamento' | 'controllo' |
                 'aggiornamento_peso' | 'analisi_esame' | 'nota' | 'altro'
          titolo?: string | null
          data?: string
          descrizione?: string | null
          allegato_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'eventi_animale_id_fkey'
            columns: ['animale_id']
            isOneToOne: false
            referencedRelation: 'animali'
            referencedColumns: ['id']
          }
        ]
      }
      documenti: {
        Row: {
          id: string
          animale_id: string
          categoria: 'ricetta' | 'referto' | 'analisi' | 'certificato' |
                     'documento_sanitario' | 'ricevuta' | 'altro'
          titolo: string
          data_documento: string | null
          file_url: string
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          animale_id: string
          categoria?: 'ricetta' | 'referto' | 'analisi' | 'certificato' |
                      'documento_sanitario' | 'ricevuta' | 'altro'
          titolo: string
          data_documento?: string | null
          file_url: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          animale_id?: string
          categoria?: 'ricetta' | 'referto' | 'analisi' | 'certificato' |
                      'documento_sanitario' | 'ricevuta' | 'altro'
          titolo?: string
          data_documento?: string | null
          file_url?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documenti_animale_id_fkey'
            columns: ['animale_id']
            isOneToOne: false
            referencedRelation: 'animali'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      categoria_animale: 'cani' | 'gatti' | 'pesci' | 'uccelli' |
                         'rettili' | 'piccoli_mammiferi' | 'altri_animali'
      sesso_animale: 'maschio' | 'femmina' | 'non_specificato'
      tipo_scadenza: 'visita' | 'terapia' | 'controllo' |
                     'manutenzione_habitat' | 'alimentazione_integrazione' | 'altro'
      stato_scadenza: 'attiva' | 'completata' | 'archiviata'
      frequenza_scadenza: 'nessuna' | 'settimanale' | 'mensile' |
                          'trimestrale' | 'semestrale' | 'annuale'
      tipo_evento: 'visita' | 'trattamento' | 'controllo' |
                   'aggiornamento_peso' | 'analisi_esame' | 'nota' | 'altro'
      categoria_documento: 'ricetta' | 'referto' | 'analisi' | 'certificato' |
                           'documento_sanitario' | 'ricevuta' | 'altro'
    }
    CompositeTypes: Record<string, never>
  }
}