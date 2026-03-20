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
          categoria:
            | 'cani'
            | 'gatti'
            | 'pesci'
            | 'uccelli'
            | 'rettili'
            | 'piccoli_mammiferi'
            | 'altri_animali'
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
          categoria:
            | 'cani'
            | 'gatti'
            | 'pesci'
            | 'uccelli'
            | 'rettili'
            | 'piccoli_mammiferi'
            | 'altri_animali'
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
          categoria?:
            | 'cani'
            | 'gatti'
            | 'pesci'
            | 'uccelli'
            | 'rettili'
            | 'piccoli_mammiferi'
            | 'altri_animali'
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
          tipo:
            | 'visita'
            | 'terapia'
            | 'controllo'
            | 'manutenzione_habitat'
            | 'alimentazione_integrazione'
            | 'altro'
          titolo: string
          data: string
          frequenza:
            | 'nessuna'
            | 'settimanale'
            | 'mensile'
            | 'trimestrale'
            | 'semestrale'
            | 'annuale'
          notifiche_attive: boolean
          stato: 'attiva' | 'completata' | 'archiviata'
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          animale_id: string
          tipo?:
            | 'visita'
            | 'terapia'
            | 'controllo'
            | 'manutenzione_habitat'
            | 'alimentazione_integrazione'
            | 'altro'
          titolo: string
          data: string
          frequenza?:
            | 'nessuna'
            | 'settimanale'
            | 'mensile'
            | 'trimestrale'
            | 'semestrale'
            | 'annuale'
          notifiche_attive?: boolean
          stato?: 'attiva' | 'completata' | 'archiviata'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          animale_id?: string
          tipo?:
            | 'visita'
            | 'terapia'
            | 'controllo'
            | 'manutenzione_habitat'
            | 'alimentazione_integrazione'
            | 'altro'
          titolo?: string
          data?: string
          frequenza?:
            | 'nessuna'
            | 'settimanale'
            | 'mensile'
            | 'trimestrale'
            | 'semestrale'
            | 'annuale'
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
          tipo:
            | 'visita'
            | 'trattamento'
            | 'controllo'
            | 'aggiornamento_peso'
            | 'analisi_esame'
            | 'nota'
            | 'altro'
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
          tipo?:
            | 'visita'
            | 'trattamento'
            | 'controllo'
            | 'aggiornamento_peso'
            | 'analisi_esame'
            | 'nota'
            | 'altro'
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
          tipo?:
            | 'visita'
            | 'trattamento'
            | 'controllo'
            | 'aggiornamento_peso'
            | 'analisi_esame'
            | 'nota'
            | 'altro'
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
          categoria:
            | 'ricetta'
            | 'referto'
            | 'analisi'
            | 'certificato'
            | 'documento_sanitario'
            | 'ricevuta'
            | 'altro'
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
          categoria?:
            | 'ricetta'
            | 'referto'
            | 'analisi'
            | 'certificato'
            | 'documento_sanitario'
            | 'ricevuta'
            | 'altro'
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
          categoria?:
            | 'ricetta'
            | 'referto'
            | 'analisi'
            | 'certificato'
            | 'documento_sanitario'
            | 'ricevuta'
            | 'altro'
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

      notifiche: {
        Row: {
          id: string
          user_id: string
          scadenza_id: string
          rule_key: string
          titolo: string
          corpo: string | null
          letta: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          scadenza_id: string
          rule_key: string
          titolo: string
          corpo?: string | null
          letta?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          scadenza_id?: string
          rule_key?: string
          titolo?: string
          corpo?: string | null
          letta?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifiche_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profili'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifiche_scadenza_id_fkey'
            columns: ['scadenza_id']
            isOneToOne: false
            referencedRelation: 'scadenze'
            referencedColumns: ['id']
          }
        ]
      }

      terapie: {
        Row: {
          id: string
          animale_id: string
          nome_farmaco: string
          dose: string
          frequenza:
            | 'una_volta_giorno'
            | 'due_volte_giorno'
            | 'tre_volte_giorno'
            | 'al_bisogno'
            | 'personalizzata'
          frequenza_custom: string | null
          data_inizio: string
          data_fine: string | null
          note: string | null
          stato: 'attiva' | 'conclusa' | 'archiviata'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          animale_id: string
          nome_farmaco: string
          dose: string
          frequenza?:
            | 'una_volta_giorno'
            | 'due_volte_giorno'
            | 'tre_volte_giorno'
            | 'al_bisogno'
            | 'personalizzata'
          frequenza_custom?: string | null
          data_inizio?: string
          data_fine?: string | null
          note?: string | null
          stato?: 'attiva' | 'conclusa' | 'archiviata'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          animale_id?: string
          nome_farmaco?: string
          dose?: string
          frequenza?:
            | 'una_volta_giorno'
            | 'due_volte_giorno'
            | 'tre_volte_giorno'
            | 'al_bisogno'
            | 'personalizzata'
          frequenza_custom?: string | null
          data_inizio?: string
          data_fine?: string | null
          note?: string | null
          stato?: 'attiva' | 'conclusa' | 'archiviata'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'terapie_animale_id_fkey'
            columns: ['animale_id']
            isOneToOne: false
            referencedRelation: 'animali'
            referencedColumns: ['id']
          }
        ]
      }

      somministrazioni_terapia: {
        Row: {
          id: string
          terapia_id: string
          somministrata_il: string
          nota: string | null
          created_at: string
        }
        Insert: {
          id?: string
          terapia_id: string
          somministrata_il?: string
          nota?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          terapia_id?: string
          somministrata_il?: string
          nota?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'somministrazioni_terapia_terapia_id_fkey'
            columns: ['terapia_id']
            isOneToOne: false
            referencedRelation: 'terapie'
            referencedColumns: ['id']
          }
        ]
      }
    }

    Views: Record<string, never>

    Functions: Record<string, never>

    Enums: {
      categoria_animale:
        | 'cani'
        | 'gatti'
        | 'pesci'
        | 'uccelli'
        | 'rettili'
        | 'piccoli_mammiferi'
        | 'altri_animali'

      sesso_animale: 'maschio' | 'femmina' | 'non_specificato'

      tipo_scadenza:
        | 'visita'
        | 'terapia'
        | 'controllo'
        | 'manutenzione_habitat'
        | 'alimentazione_integrazione'
        | 'altro'

      stato_scadenza: 'attiva' | 'completata' | 'archiviata'

      frequenza_scadenza:
        | 'nessuna'
        | 'settimanale'
        | 'mensile'
        | 'trimestrale'
        | 'semestrale'
        | 'annuale'

      tipo_evento:
        | 'visita'
        | 'trattamento'
        | 'controllo'
        | 'aggiornamento_peso'
        | 'analisi_esame'
        | 'nota'
        | 'altro'

      categoria_documento:
        | 'ricetta'
        | 'referto'
        | 'analisi'
        | 'certificato'
        | 'documento_sanitario'
        | 'ricevuta'
        | 'altro'

      frequenza_terapia:
        | 'una_volta_giorno'
        | 'due_volte_giorno'
        | 'tre_volte_giorno'
        | 'al_bisogno'
        | 'personalizzata'

      stato_terapia: 'attiva' | 'conclusa' | 'archiviata'
    }

    CompositeTypes: Record<string, never>
  }
}