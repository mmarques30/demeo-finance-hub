export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          client_id: string
          color: string | null
          created_at: string | null
          group_name: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          type: string
        }
        Insert: {
          client_id: string
          color?: string | null
          created_at?: string | null
          group_name: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          type: string
        }
        Update: {
          client_id?: string
          color?: string | null
          created_at?: string | null
          group_name?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_rules: {
        Row: {
          category: string
          client_id: string
          created_at: string | null
          hit_count: number | null
          hits: number
          id: string
          is_active: boolean
          is_recurring: boolean | null
          last_used: string
          pattern: string
          source: string
        }
        Insert: {
          category: string
          client_id: string
          created_at?: string | null
          hit_count?: number | null
          hits?: number
          id?: string
          is_active?: boolean
          is_recurring?: boolean | null
          last_used?: string
          pattern: string
          source?: string
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string | null
          hit_count?: number | null
          hits?: number
          id?: string
          is_active?: boolean
          is_recurring?: boolean | null
          last_used?: string
          pattern?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "classification_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_banks: {
        Row: {
          bank_name: string
          client_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          bank_name: string
          client_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          bank_name?: string
          client_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_banks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          cnpj: string | null
          created_at: string | null
          id: string
          last_upload_at: string | null
          name: string
          owner_name: string
          portal_features: Json | null
          segment: string | null
          status: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          id?: string
          last_upload_at?: string | null
          name: string
          owner_name: string
          portal_features?: Json | null
          segment?: string | null
          status?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          id?: string
          last_upload_at?: string | null
          name?: string
          owner_name?: string
          portal_features?: Json | null
          segment?: string | null
          status?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_document: string | null
          client_email: string | null
          client_name: string
          created_at: string
          deal_id: string | null
          id: string
          number: string | null
          pdf_url: string | null
          proposal_id: string | null
          signature_provider: string
          signed_at: string | null
          start_date: string
          status: string
          termination_notice_days: number
          total_monthly: number
        }
        Insert: {
          client_document?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          deal_id?: string | null
          id?: string
          number?: string | null
          pdf_url?: string | null
          proposal_id?: string | null
          signature_provider?: string
          signed_at?: string | null
          start_date: string
          status?: string
          termination_notice_days?: number
          total_monthly: number
        }
        Update: {
          client_document?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          number?: string | null
          pdf_url?: string | null
          proposal_id?: string | null
          signature_provider?: string
          signed_at?: string | null
          start_date?: string
          status?: string
          termination_notice_days?: number
          total_monthly?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activities: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          done: boolean
          due_date: string | null
          id: string
          kind: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          done?: boolean
          due_date?: string | null
          id?: string
          kind: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          done?: boolean
          due_date?: string | null
          id?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          deal_id: string
          from_stage_id: string | null
          id: string
          note: string | null
          to_stage_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          deal_id: string
          from_stage_id?: string | null
          id?: string
          note?: string | null
          to_stage_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          deal_id?: string
          from_stage_id?: string | null
          id?: string
          note?: string | null
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "deal_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "deal_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          is_lost: boolean
          is_won: boolean
          label: string
          position: number
          slug: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          is_lost?: boolean
          is_won?: boolean
          label: string
          position: number
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_lost?: boolean
          is_won?: boolean
          label?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          closed_at: string | null
          company: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          expected_close_date: string | null
          expected_value: number | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          notes: string | null
          owner_id: string | null
          service_type: string | null
          stage_changed_at: string
          stage_id: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          company?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          expected_close_date?: string | null
          expected_value?: number | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          owner_id?: string | null
          service_type?: string | null
          stage_changed_at?: string
          stage_id: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          company?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          expected_close_date?: string | null
          expected_value?: number | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          owner_id?: string | null
          service_type?: string | null
          stage_changed_at?: string
          stage_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "deal_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      document_counters: {
        Row: {
          kind: string
          next_value: number
          year: number
        }
        Insert: {
          kind: string
          next_value?: number
          year: number
        }
        Update: {
          kind?: string
          next_value?: number
          year?: number
        }
        Relationships: []
      }
      lead_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          position: number
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          position?: number
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          consent_lgpd: boolean
          created_at: string
          email: string | null
          id: string
          ip_address: unknown
          monthly_revenue_range: string | null
          name: string
          pain_point: string | null
          phone: string | null
          promoted_to_deal_id: string | null
          raw_payload: Json | null
          segment: string | null
          source_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          company?: string | null
          consent_lgpd?: boolean
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown
          monthly_revenue_range?: string | null
          name: string
          pain_point?: string | null
          phone?: string | null
          promoted_to_deal_id?: string | null
          raw_payload?: Json | null
          segment?: string | null
          source_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          company?: string | null
          consent_lgpd?: boolean
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown
          monthly_revenue_range?: string | null
          name?: string
          pain_point?: string | null
          phone?: string | null
          promoted_to_deal_id?: string | null
          raw_payload?: Json | null
          segment?: string | null
          source_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_promoted_to_deal_fk"
            columns: ["promoted_to_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          amount: number
          category: string | null
          client_id: string
          created_at: string | null
          description: string
          due_date: string
          id: string
          notes: string | null
          paid_at: string | null
          type: string
        }
        Insert: {
          amount: number
          category?: string | null
          client_id: string
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string | null
          client_id?: string
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          created_at: string
          description: string
          id: string
          position: number
          proposal_id: string
          quantity: number
          service_id: string | null
          total: number | null
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          position?: number
          proposal_id: string
          quantity?: number
          service_id?: string | null
          total?: number | null
          unit: string
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          position?: number
          proposal_id?: string
          quantity?: number
          service_id?: string | null
          total?: number | null
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_pricing_monthly"
            referencedColumns: ["service_id"]
          },
        ]
      }
      proposals: {
        Row: {
          client_document: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          deal_id: string
          decided_at: string | null
          diagnosis_text: string | null
          id: string
          intro_text: string | null
          number: string | null
          payment_terms: string | null
          pdf_url: string | null
          public_token: string | null
          sent_at: string | null
          status: string
          total_monthly: number
          total_one_off: number
          updated_at: string
          validity_days: number
          version: number
          viewed_at: string | null
        }
        Insert: {
          client_document?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          deal_id: string
          decided_at?: string | null
          diagnosis_text?: string | null
          id?: string
          intro_text?: string | null
          number?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          public_token?: string | null
          sent_at?: string | null
          status?: string
          total_monthly?: number
          total_one_off?: number
          updated_at?: string
          validity_days?: number
          version?: number
          viewed_at?: string | null
        }
        Update: {
          client_document?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          deal_id?: string
          decided_at?: string | null
          diagnosis_text?: string | null
          id?: string
          intro_text?: string | null
          number?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          public_token?: string | null
          sent_at?: string | null
          status?: string
          total_monthly?: number
          total_one_off?: number
          updated_at?: string
          validity_days?: number
          version?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_email: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_email?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_email?: string | null
        }
        Relationships: []
      }
      rate_limit_hits: {
        Row: {
          bucket: string
          hit_at: string
          id: number
          ip: string
        }
        Insert: {
          bucket: string
          hit_at?: string
          id?: number
          ip: string
        }
        Update: {
          bucket?: string
          hit_at?: string
          id?: number
          ip?: string
        }
        Relationships: []
      }
      service_price_history: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          notes: string | null
          price: number
          reference_id: string | null
          service_id: string
          source: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          id?: string
          notes?: string | null
          price: number
          reference_id?: string | null
          service_id: string
          source: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          notes?: string | null
          price?: number
          reference_id?: string | null
          service_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_price_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_price_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_pricing_monthly"
            referencedColumns: ["service_id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          unit: string
        }
        Insert: {
          base_price: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          unit: string
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          unit?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          bank: string
          category: string | null
          client_id: string
          confidence: number | null
          created_at: string | null
          date: string
          description: string
          id: string
          installment_group_id: string | null
          installment_number: number | null
          installment_total: number | null
          is_recurring: boolean | null
          raw_description: string | null
          status: string
          upload_id: string | null
        }
        Insert: {
          amount: number
          bank: string
          category?: string | null
          client_id: string
          confidence?: number | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          installment_total?: number | null
          is_recurring?: boolean | null
          raw_description?: string | null
          status?: string
          upload_id?: string | null
        }
        Update: {
          amount?: number
          bank?: string
          category?: string | null
          client_id?: string
          confidence?: number | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          installment_total?: number | null
          is_recurring?: boolean | null
          raw_description?: string | null
          status?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          bank_name: string
          client_id: string
          created_at: string | null
          error_message: string | null
          filename: string
          id: string
          period: string
          status: string
          storage_path: string
          tx_classified: number | null
          tx_pending: number | null
          tx_total: number | null
        }
        Insert: {
          bank_name: string
          client_id: string
          created_at?: string | null
          error_message?: string | null
          filename: string
          id?: string
          period: string
          status?: string
          storage_path: string
          tx_classified?: number | null
          tx_pending?: number | null
          tx_total?: number | null
        }
        Update: {
          bank_name?: string
          client_id?: string
          created_at?: string | null
          error_message?: string | null
          filename?: string
          id?: string
          period?: string
          status?: string
          storage_path?: string
          tx_classified?: number | null
          tx_pending?: number | null
          tx_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "uploads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      accuracy_report: {
        Row: {
          accuracy_pct: number | null
          auto_high: number | null
          auto_medium: number | null
          client_id: string | null
          client_name: string | null
          manual_queue: number | null
          month: string | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      recurrence_patterns: {
        Row: {
          client_id: string | null
          last_seen: string | null
          modal_category: string | null
          occurrences: number | null
          pattern: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pipeline_kpis: {
        Row: {
          active_deals: number | null
          avg_ticket: number | null
          conversion_rate_pct: number | null
          in_negotiation: number | null
          lost_deals: number | null
          won_deals: number | null
        }
        Relationships: []
      }
      v_service_pricing_monthly: {
        Row: {
          avg_price: number | null
          max_price: number | null
          min_price: number | null
          month: string | null
          sample_size: number | null
          service_id: string | null
          service_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      build_pattern: { Args: { raw: string }; Returns: string }
      current_client_id: { Args: never; Returns: string }
      expire_stale_rules: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      next_contract_number: { Args: never; Returns: string }
      next_proposal_number: { Args: never; Returns: string }
      normalize_description: { Args: { raw: string }; Returns: string }
      pending_recurrences: {
        Args: { p_client_id: string }
        Returns: {
          last_seen: string
          modal_category: string
          occurrences: number
          pattern: string
        }[]
      }
      pending_recurrences_total: { Args: never; Returns: number }
      update_client_with_banks: {
        Args: {
          p_banks: string[]
          p_client_id: string
          p_cnpj: string
          p_name: string
          p_owner_name: string
          p_status: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
