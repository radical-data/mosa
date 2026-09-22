export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  entities: {
    Tables: {
      agent: {
        Row: {
          agent_kind: string | null
          id: string
        }
        Insert: {
          agent_kind?: string | null
          id: string
        }
        Update: {
          agent_kind?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "entity_display"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogue: {
        Row: {
          label: string | null
          namespace: string
        }
        Insert: {
          label?: string | null
          namespace?: string
        }
        Update: {
          label?: string | null
          namespace?: string
        }
        Relationships: []
      }
      entity: {
        Row: {
          created_at: string
          created_by: string | null
          entity_type: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_type: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_type?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      external_identifier: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          namespace: string
          source_id: string | null
          value: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          namespace: string
          source_id?: string | null
          value: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          namespace?: string
          source_id?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_identifier_catalogue_fkey"
            columns: ["namespace"]
            isOneToOne: false
            referencedRelation: "catalogue"
            referencedColumns: ["namespace"]
          },
          {
            foreignKeyName: "external_identifier_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_identifier_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entity_display"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_identifier_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source"
            referencedColumns: ["id"]
          },
        ]
      }
      item: {
        Row: {
          id: string
          item_kind: string | null
        }
        Insert: {
          id: string
          item_kind?: string | null
        }
        Update: {
          id?: string
          item_kind?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "entity_display"
            referencedColumns: ["id"]
          },
        ]
      }
      place: {
        Row: {
          id: string
          place_kind: string | null
        }
        Insert: {
          id: string
          place_kind?: string | null
        }
        Update: {
          id?: string
          place_kind?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "place_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "entity_display"
            referencedColumns: ["id"]
          },
        ]
      }
      source: {
        Row: {
          id: string
          reference: string | null
          retrieved_at: string | null
          source_kind: string
        }
        Insert: {
          id: string
          reference?: string | null
          retrieved_at?: string | null
          source_kind: string
        }
        Update: {
          id?: string
          reference?: string | null
          retrieved_at?: string | null
          source_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "entity_display"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      entity_display: {
        Row: {
          display_label: string | null
          display_label_basis: string | null
          display_label_claim_id: string | null
          entity_type: string | null
          id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_agent: { Args: { p_agent_kind?: string }; Returns: string }
      create_item: { Args: { p_item_kind?: string }; Returns: string }
      create_place: { Args: { p_place_kind?: string }; Returns: string }
      create_source: {
        Args: {
          p_reference?: string
          p_retrieved_at?: string
          p_source_kind: string
        }
        Returns: string
      }
      entity_display_label: {
        Args: { p_entity_id: string }
        Returns: {
          display_label: string
          display_label_basis: string
          display_label_claim_id: string
        }[]
      }
      search_normalise: { Args: { p_value: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  knowledge: {
    Tables: {
      claim: {
        Row: {
          asserted_by_agent_id: string | null
          created_at: string
          created_by: string | null
          id: string
          literal_value: Json | null
          notes: string | null
          object_entity_id: string | null
          predicate: string
          status: string
          subject_id: string
          supersedes_claim_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          asserted_by_agent_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          literal_value?: Json | null
          notes?: string | null
          object_entity_id?: string | null
          predicate: string
          status?: string
          subject_id: string
          supersedes_claim_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          asserted_by_agent_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          literal_value?: Json | null
          notes?: string | null
          object_entity_id?: string | null
          predicate?: string
          status?: string
          subject_id?: string
          supersedes_claim_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_supersedes_claim_id_fkey"
            columns: ["supersedes_claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_supersedes_claim_id_fkey"
            columns: ["supersedes_claim_id"]
            isOneToOne: false
            referencedRelation: "claim_details"
            referencedColumns: ["claim_id"]
          },
        ]
      }
      claim_evidence: {
        Row: {
          claim_id: string
          created_at: string
          created_by: string | null
          evidence_mode: string
          excerpt: string | null
          id: string
          locator: string
          notes: string | null
          relationship: string
          source_id: string
          source_version_id: string | null
        }
        Insert: {
          claim_id: string
          created_at?: string
          created_by?: string | null
          evidence_mode?: string
          excerpt?: string | null
          id?: string
          locator: string
          notes?: string | null
          relationship: string
          source_id: string
          source_version_id?: string | null
        }
        Update: {
          claim_id?: string
          created_at?: string
          created_by?: string | null
          evidence_mode?: string
          excerpt?: string | null
          id?: string
          locator?: string
          notes?: string | null
          relationship?: string
          source_id?: string
          source_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim_details"
            referencedColumns: ["claim_id"]
          },
        ]
      }
    }
    Views: {
      claim_details: {
        Row: {
          asserted_by_agent_id: string | null
          asserted_by_label: string | null
          claim_id: string | null
          created_at: string | null
          created_by: string | null
          literal_display_value: string | null
          literal_language: string | null
          literal_value: Json | null
          notes: string | null
          object_entity_id: string | null
          object_entity_label: string | null
          object_entity_type: string | null
          predicate: string | null
          status: string | null
          subject_id: string | null
          subject_label: string | null
          subject_type: string | null
          supersedes_claim_id: string | null
          updated_at: string | null
          updated_by: string | null
          value_kind: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_supersedes_claim_id_fkey"
            columns: ["supersedes_claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_supersedes_claim_id_fkey"
            columns: ["supersedes_claim_id"]
            isOneToOne: false
            referencedRelation: "claim_details"
            referencedColumns: ["claim_id"]
          },
        ]
      }
      claim_evidence_details: {
        Row: {
          asserted_by_agent_id: string | null
          asserted_by_label: string | null
          claim_evidence_id: string | null
          claim_id: string | null
          claim_status: string | null
          evidence_created_at: string | null
          evidence_created_by: string | null
          evidence_notes: string | null
          excerpt: string | null
          literal_display_value: string | null
          literal_language: string | null
          literal_value: Json | null
          locator: string | null
          object_entity_id: string | null
          object_entity_label: string | null
          object_entity_type: string | null
          predicate: string | null
          relationship: string | null
          source_id: string | null
          source_label: string | null
          subject_id: string | null
          subject_label: string | null
          subject_type: string | null
          value_kind: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claim_details"
            referencedColumns: ["claim_id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  presentation: {
    Tables: {
      foregrounded_claim: {
        Row: {
          claim_id: string
        }
        Insert: {
          claim_id: string
        }
        Update: {
          claim_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "foregrounded_claim_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: true
            referencedRelation: "foregrounded_claim_details"
            referencedColumns: ["claim_id"]
          },
        ]
      }
    }
    Views: {
      foregrounded_claim_details: {
        Row: {
          asserted_by_agent_id: string | null
          asserted_by_label: string | null
          claim_id: string | null
          created_at: string | null
          created_by: string | null
          literal_display_value: string | null
          literal_language: string | null
          literal_value: Json | null
          notes: string | null
          object_entity_id: string | null
          object_entity_label: string | null
          object_entity_type: string | null
          predicate: string | null
          status: string | null
          subject_id: string | null
          subject_label: string | null
          subject_type: string | null
          supersedes_claim_id: string | null
          updated_at: string | null
          updated_by: string | null
          value_kind: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_supersedes_claim_id_fkey"
            columns: ["supersedes_claim_id"]
            isOneToOne: false
            referencedRelation: "foregrounded_claim_details"
            referencedColumns: ["claim_id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  provenance: {
    Tables: {
      event: {
        Row: {
          event_kind: string
          id: string
        }
        Insert: {
          event_kind: string
          id: string
        }
        Update: {
          event_kind?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_event: { Args: { p_event_kind?: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  restitution: {
    Tables: {
      action_document: {
        Row: {
          action_id: string
          case_id: string
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          relationship: string | null
        }
        Insert: {
          action_id: string
          case_id: string
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          relationship?: string | null
        }
        Update: {
          action_id?: string
          case_id?: string
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_document_action_case_fkey"
            columns: ["action_id", "case_id"]
            isOneToOne: false
            referencedRelation: "case_action"
            referencedColumns: ["id", "case_id"]
          },
          {
            foreignKeyName: "action_document_document_case_fkey"
            columns: ["document_id", "case_id"]
            isOneToOne: false
            referencedRelation: "case_document"
            referencedColumns: ["id", "case_id"]
          },
        ]
      }
      action_party: {
        Row: {
          action_id: string
          agent_id: string
          created_at: string
          created_by: string | null
          id: string
          role: string
        }
        Insert: {
          action_id: string
          agent_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          role: string
        }
        Update: {
          action_id?: string
          agent_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_party_case_action_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "case_action"
            referencedColumns: ["id"]
          },
        ]
      }
      case_action: {
        Row: {
          action_kind: string
          case_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          occurred_end: string | null
          occurred_precision: string | null
          occurred_start: string | null
          sequence_number: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_kind: string
          case_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          occurred_end?: string | null
          occurred_precision?: string | null
          occurred_start?: string | null
          sequence_number: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_kind?: string
          case_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          occurred_end?: string | null
          occurred_precision?: string | null
          occurred_start?: string | null
          sequence_number?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_action_case_record_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_record"
            referencedColumns: ["id"]
          },
        ]
      }
      case_document: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          document_role: string
          id: string
          source_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          document_role: string
          id?: string
          source_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          document_role?: string
          id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_document_case_record_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_record"
            referencedColumns: ["id"]
          },
        ]
      }
      case_item: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          item_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          item_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_item_case_record_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_record"
            referencedColumns: ["id"]
          },
        ]
      }
      case_party: {
        Row: {
          agent_id: string
          case_id: string
          created_at: string
          created_by: string | null
          id: string
          role: string
        }
        Insert: {
          agent_id: string
          case_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          role: string
        }
        Update: {
          agent_id?: string
          case_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_party_case_record_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_record"
            referencedColumns: ["id"]
          },
        ]
      }
      case_record: {
        Row: {
          closed_end: string | null
          closed_precision: string | null
          closed_start: string | null
          created_at: string
          created_by: string | null
          id: string
          opened_end: string | null
          opened_precision: string | null
          opened_start: string | null
          reference: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          closed_end?: string | null
          closed_precision?: string | null
          closed_start?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          opened_end?: string | null
          opened_precision?: string | null
          opened_start?: string | null
          reference: string
          status: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          closed_end?: string | null
          closed_precision?: string | null
          closed_start?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          opened_end?: string | null
          opened_precision?: string | null
          opened_start?: string | null
          reference?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  entities: {
    Enums: {},
  },
  knowledge: {
    Enums: {},
  },
  presentation: {
    Enums: {},
  },
  provenance: {
    Enums: {},
  },
  restitution: {
    Enums: {},
  },
} as const
