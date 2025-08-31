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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      contracts: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          pdf_url: string | null
          signature_brand: string | null
          signature_creator: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          pdf_url?: string | null
          signature_brand?: string | null
          signature_creator?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          pdf_url?: string | null
          signature_brand?: string | null
          signature_creator?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount_total: number
          created_at: string
          creator_id: string | null
          currency: string
          escrow_id: string | null
          id: string
          project_id: string
          state: Database["public"]["Enums"]["deal_state"]
          updated_at: string
        }
        Insert: {
          amount_total: number
          created_at?: string
          creator_id?: string | null
          currency?: string
          escrow_id?: string | null
          id?: string
          project_id: string
          state?: Database["public"]["Enums"]["deal_state"]
          updated_at?: string
        }
        Update: {
          amount_total?: number
          created_at?: string
          creator_id?: string | null
          currency?: string
          escrow_id?: string | null
          id?: string
          project_id?: string
          state?: Database["public"]["Enums"]["deal_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          checks: Json | null
          created_at: string
          file_hash: string | null
          id: string
          milestone_id: string
          submitted_at: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          checks?: Json | null
          created_at?: string
          file_hash?: string | null
          id?: string
          milestone_id: string
          submitted_at?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          checks?: Json | null
          created_at?: string
          file_hash?: string | null
          id?: string
          milestone_id?: string
          submitted_at?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          raised_by_user_id: string
          reason: string | null
          resolution: string | null
          state: Database["public"]["Enums"]["dispute_state"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          raised_by_user_id: string
          reason?: string | null
          resolution?: string | null
          state?: Database["public"]["Enums"]["dispute_state"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          raised_by_user_id?: string
          reason?: string | null
          resolution?: string | null
          state?: Database["public"]["Enums"]["dispute_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_user_id_fkey"
            columns: ["raised_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: string
          payload: Json | null
          type: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          type: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          amount: number
          created_at: string
          deal_id: string
          due_at: string | null
          id: string
          state: Database["public"]["Enums"]["milestone_state"]
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          deal_id: string
          due_at?: string | null
          id?: string
          state?: Database["public"]["Enums"]["milestone_state"]
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          deal_id?: string
          due_at?: string | null
          id?: string
          state?: Database["public"]["Enums"]["milestone_state"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          deal_id: string
          id: string
          milestone_id: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_ref: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          deal_id: string
          id?: string
          milestone_id?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_ref?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          deal_id?: string
          id?: string
          milestone_id?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_ref?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          country: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          kyc_status: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_account_id: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          kyc_status?: string | null
          last_name?: string | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_account_id?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          kyc_status?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_account_id?: string | null
          updated_at?: string
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
      deal_state: "DRAFT" | "FUNDED" | "RELEASED" | "DISPUTED" | "REFUNDED"
      dispute_state: "OPEN" | "PARTIAL" | "RESOLVED" | "REJECTED"
      escrow_state: "unfunded" | "funded" | "released" | "refunded"
      milestone_state:
        | "PENDING"
        | "SUBMITTED"
        | "APPROVED"
        | "RELEASED"
        | "DISPUTED"
      payment_provider: "STRIPE" | "MANGOPAY" | "CRYPTO"
      user_role: "CREATOR" | "BRAND" | "ADMIN"
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
    Enums: {
      deal_state: ["DRAFT", "FUNDED", "RELEASED", "DISPUTED", "REFUNDED"],
      dispute_state: ["OPEN", "PARTIAL", "RESOLVED", "REJECTED"],
      escrow_state: ["unfunded", "funded", "released", "refunded"],
      milestone_state: [
        "PENDING",
        "SUBMITTED",
        "APPROVED",
        "RELEASED",
        "DISPUTED",
      ],
      payment_provider: ["STRIPE", "MANGOPAY", "CRYPTO"],
      user_role: ["CREATOR", "BRAND", "ADMIN"],
    },
  },
} as const
