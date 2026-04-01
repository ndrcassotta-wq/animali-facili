export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PreferenzeNotifiche = {
  attive: boolean
  ore: number
  giorni_prima: number
  tipi_abilitati: string[]
}

export type Database = {
  public: {
    Tables: {
      profili: {
        Row: {
          id: string
          nome: string
          email: string
          notifiche_attive: boolean
          preferenze_notifiche: PreferenzeNotifiche
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          notifiche_attive?: boolean
          preferenze_notifiche?: PreferenzeNotifiche
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          notifiche_attive?: boolean
          preferenze_notifiche?: PreferenzeNotifiche
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
      animali_condivisioni: {
        Row: {
          id: string
          animale_id: string
          owner_user_id: string
          shared_user_id: string
          status: 'pending' | 'accepted' | 'revoked'
          invited_by_user_id: string | null
          created_at: string
          updated_at: string
          accepted_at: string | null
          revoked_at: string | null
        }
        Insert: {
          id?: string
          animale_id: string
          owner_user_id?: string
          shared_user_id: string
          status?: 'pending' | 'accepted' | 'revoked'
          invited_by_user_id?: string | null
          created_at?: string
          updated_at?: string
          accepted_at?: string | null
          revoked_at?: string | null
        }
        Update: {
          id?: string
          animale_id?: string
          owner_user_id?: string
          shared_user_id?: string
          status?: 'pending' | 'accepted' | 'revoked'
          invited_by_user_id?: string | null
          created_at?: string
          updated_at?: string
          accepted_at?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'animali_condivisioni_animale_id_fkey'
            columns: ['animale_id']
            isOneToOne: false
            referencedRelation: 'animali'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'animali_condivisioni_owner_user_id_fkey'
            columns: ['owner_user_id']
            isOneToOne: false
            referencedRelation: 'profili'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'animali_condivisioni_shared_user_id_fkey'
            columns: ['shared_user_id']
            isOneToOne: false
            referencedRelation: 'profili'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'animali_condivisioni_invited_by_user_id_fkey'
            columns: ['invited_by_user_id']
            isOneToOne: false
            referencedRelation: 'profili'
            referencedColumns: ['id']
          }
        ]
      }
      impegni: {
        Row: {
          id: string
          animale_id: string
          tipo:
            | 'visita'
            | 'controllo'
            | 'vaccinazione'
            | 'toelettatura'
            | 'terapia'
            | 'addestramento'
            | 'compleanno'
            | 'altro'
          titolo: string
          data: string
          ora: string | null
          frequenza:
            | 'nessuna'
            | 'settimanale'
            | 'mensile'
            | 'trimestrale'
            | 'semestrale'
            | 'annuale'
          notifiche_attive: boolean
          stato: 'programmato' | 'completato' | 'annullato'
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          animale_id: string
          tipo?:
            | 'visita'
            | 'controllo'
            | 'vaccinazione'
            | 'toelettatura'
            | 'terapia'
            | 'addestramento'
            | 'compleanno'
            | 'altro'
          titolo: string
          data: string
          ora?: string | null
          frequenza?:
            | 'nessuna'
            | 'settimanale'
            | 'mensile'
            | 'trimestrale'
            | 'semestrale'
            | 'annuale'
          notifiche_attive?: boolean
          stato?: 'programmato' | 'completato' | 'annullato'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          animale_id?: string
          tipo?:
            | 'visita'
            | 'controllo'
            | 'vaccinazione'
            | 'toelettatura'
            | 'terapia'
            | 'addestramento'
            | 'compleanno'
            | 'altro'
          titolo?: string
          data?: string
          ora?: string | null
          frequenza?:
            | 'nessuna'
            | 'settimanale'
            | 'mensile'
            | 'trimestrale'
            | 'semestrale'
            | 'annuale'
          notifiche_attive?: boolean
          stato?: 'programmato' | 'completato' | 'annullato'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'impegni_animale_id_fkey'
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
      diario_voci: {
        Row: {
          id: string
          animale_id: string
          data: string
          titolo: string
          nota: string
          foto_urls: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          animale_id: string
          data?: string
          titolo: string
          nota: string
          foto_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          animale_id?: string
          data?: string
          titolo?: string
          nota?: string
          foto_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'diario_voci_animale_id_fkey'
            columns: ['animale_id']
            isOneToOne: false
            referencedRelation: 'animali'
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
          ora_somministrazione: string | null
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
          ora_somministrazione?: string | null
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
          ora_somministrazione?: string | null
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
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_animale_condivisioni: {
        Args: {
          p_animale_id: string
        }
        Returns: {
          id: string
          shared_user_id: string
          shared_nome: string | null
          shared_email: string | null
          status: 'pending' | 'accepted' | 'revoked'
          invited_by_user_id: string | null
          created_at: string
          updated_at: string
          accepted_at: string | null
          revoked_at: string | null
        }[]
      }
      invita_condivisione_animale: {
        Args: {
          p_animale_id: string
          p_email: string
        }
        Returns: string
      }
      get_inviti_condivisione_ricevuti: {
        Args: Record<PropertyKey, never>
        Returns: {
          condivisione_id: string
          animale_id: string
          animale_nome: string
          owner_user_id: string
          owner_nome: string | null
          owner_email: string | null
          created_at: string
        }[]
      }
      rispondi_invito_condivisione: {
        Args: {
          p_condivisione_id: string
          p_azione: 'accepted' | 'revoked'
        }
        Returns: string
      }
      revoca_condivisione_animale: {
        Args: {
          p_condivisione_id: string
        }
        Returns: string
      }
    }
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
      stato_condivisione_animale: 'pending' | 'accepted' | 'revoked'
      tipo_impegno:
        | 'visita'
        | 'controllo'
        | 'vaccinazione'
        | 'toelettatura'
        | 'terapia'
        | 'addestramento'
        | 'compleanno'
        | 'altro'
      stato_impegno: 'programmato' | 'completato' | 'annullato'
      frequenza_impegno:
        | 'nessuna'
        | 'settimanale'
        | 'mensile'
        | 'trimestrale'
        | 'semestrale'
        | 'annuale'
      stato_terapia: 'attiva' | 'conclusa' | 'archiviata'
      frequenza_terapia:
        | 'una_volta_giorno'
        | 'due_volte_giorno'
        | 'tre_volte_giorno'
        | 'al_bisogno'
        | 'personalizzata'
      categoria_documento:
        | 'ricetta'
        | 'referto'
        | 'analisi'
        | 'certificato'
        | 'documento_sanitario'
        | 'ricevuta'
        | 'altro'
    }
    CompositeTypes: Record<string, never>
  }
}