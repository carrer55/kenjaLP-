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
      applications: {
        Row: {
          applicant_id: string
          approved_at: string | null
          created_at: string
          current_approver_id: string | null
          days_waiting: number | null
          department_id: string
          id: string
          metadata: Json | null
          priority: string
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          title: string
          total_amount: number | null
          type: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          approved_at?: string | null
          created_at?: string
          current_approver_id?: string | null
          days_waiting?: number | null
          department_id: string
          id?: string
          metadata?: Json | null
          priority?: string
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          title: string
          total_amount?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          approved_at?: string | null
          created_at?: string
          current_approver_id?: string | null
          days_waiting?: number | null
          department_id?: string
          id?: string
          metadata?: Json | null
          priority?: string
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
          total_amount?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_current_approver_id_fkey"
            columns: ["current_approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_logs: {
        Row: {
          action: string
          application_id: string
          approver_id: string
          comment: string | null
          created_at: string
          id: string
          new_status: string
          previous_status: string | null
        }
        Insert: {
          action: string
          application_id: string
          approver_id: string
          comment?: string | null
          created_at?: string
          id?: string
          new_status: string
          previous_status?: string | null
        }
        Update: {
          action?: string
          application_id?: string
          approver_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          new_status?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_logs_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          application_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          storage_path: string
        }
        Insert: {
          application_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path: string
        }
        Update: {
          application_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      business_trip_details: {
        Row: {
          action_and_results: string | null
          application_id: string
          companions: string | null
          end_date: string
          estimated_accommodation: number | null
          estimated_daily_allowance: number | null
          estimated_transportation: number | null
          id: string
          location: string
          purpose: string
          start_date: string
          visit_target: string
        }
        Insert: {
          action_and_results?: string | null
          application_id: string
          companions?: string | null
          end_date: string
          estimated_accommodation?: number | null
          estimated_daily_allowance?: number | null
          estimated_transportation?: number | null
          id?: string
          location: string
          purpose: string
          start_date: string
          visit_target: string
        }
        Update: {
          action_and_results?: string | null
          application_id?: string
          companions?: string | null
          end_date?: string
          estimated_accommodation?: number | null
          estimated_daily_allowance?: number | null
          estimated_transportation?: number | null
          id?: string
          location?: string
          purpose?: string
          start_date?: string
          visit_target?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_trip_details_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          representative: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          representative?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          representative?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_details: {
        Row: {
          application_id: string
          daily_allowance_received: number | null
          id: string
          total_expenses: number
        }
        Insert: {
          application_id: string
          daily_allowance_received?: number | null
          id?: string
          total_expenses: number
        }
        Update: {
          application_id?: string
          daily_allowance_received?: number | null
          id?: string
          total_expenses?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_details_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_items: {
        Row: {
          amount: number
          category: string
          description: string | null
          expense_detail_id: string
          id: string
          item_date: string
          ocr_processed: boolean
          ocr_result: Json | null
          receipt_url: string | null
          store_name: string | null
        }
        Insert: {
          amount: number
          category: string
          description?: string | null
          expense_detail_id: string
          id?: string
          item_date: string
          ocr_processed?: boolean
          ocr_result?: Json | null
          receipt_url?: string | null
          store_name?: string | null
        }
        Update: {
          amount?: number
          category?: string
          description?: string | null
          expense_detail_id?: string
          id?: string
          item_date?: string
          ocr_processed?: boolean
          ocr_result?: Json | null
          receipt_url?: string | null
          store_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_items_expense_detail_id_fkey"
            columns: ["expense_detail_id"]
            isOneToOne: false
            referencedRelation: "expense_details"
            referencedColumns: ["id"]
          },
        ]
      }
      positions_allowances: {
        Row: {
          domestic_accommodation: number
          domestic_daily_allowance: number
          domestic_transportation: number
          id: string
          overseas_accommodation: number
          overseas_daily_allowance: number
          overseas_preparation_fee: number
          overseas_transportation: number
          position_name: string
          regulation_id: string
        }
        Insert: {
          domestic_accommodation: number
          domestic_daily_allowance: number
          domestic_transportation: number
          id?: string
          overseas_accommodation: number
          overseas_daily_allowance: number
          overseas_preparation_fee: number
          overseas_transportation: number
          position_name: string
          regulation_id: string
        }
        Update: {
          domestic_accommodation?: number
          domestic_daily_allowance?: number
          domestic_transportation?: number
          id?: string
          overseas_accommodation?: number
          overseas_daily_allowance?: number
          overseas_preparation_fee?: number
          overseas_transportation?: number
          position_name?: string
          regulation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_allowances_regulation_id_fkey"
            columns: ["regulation_id"]
            isOneToOne: false
            referencedRelation: "travel_regulations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string
          created_at: string
          department_id: string | null
          email: string
          full_name: string
          id: string
          invited_by: string | null
          last_login_at: string | null
          phone_number: string
          plan: string
          position: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          department_id?: string | null
          email: string
          full_name: string
          id: string
          invited_by?: string | null
          last_login_at?: string | null
          phone_number: string
          plan?: string
          position: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          invited_by?: string | null
          last_login_at?: string | null
          phone_number?: string
          plan?: string
          position?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_regulations: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          custom_articles: Json | null
          distance_threshold: number
          established_date: string
          id: string
          is_accommodation_real_expense: boolean
          is_transportation_real_expense: boolean
          revision_number: number
          status: string
          updated_at: string
          use_preparation_fee: boolean
          version: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          custom_articles?: Json | null
          distance_threshold: number
          established_date: string
          id?: string
          is_accommodation_real_expense?: boolean
          is_transportation_real_expense?: boolean
          revision_number: number
          status?: string
          updated_at?: string
          use_preparation_fee?: boolean
          version: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          custom_articles?: Json | null
          distance_threshold?: number
          established_date?: string
          id?: string
          is_accommodation_real_expense?: boolean
          is_transportation_real_expense?: boolean
          revision_number?: number
          status?: string
          updated_at?: string
          use_preparation_fee?: boolean
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_regulations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_regulations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_status:
        | "draft"
        | "pending"
        | "returned"
        | "approved"
        | "rejected"
        | "on_hold"
        | "submitted"
      application_type: "business_trip" | "expense"
      user_plan: "Free" | "Pro" | "Enterprise"
      user_role: "admin" | "department_admin" | "approver" | "general_user"
      user_status: "active" | "invited" | "inactive"
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
  ? DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
  : DefaultSchemaEnumNameOrOptions extends keyof DatabaseWithoutInternals
    ? DefaultSchemaEnumNameOrOptions extends keyof DatabaseWithoutInternals["Enums"]
      ? DatabaseWithoutInternals["Enums"][DefaultSchemaEnumNameOrOptions]
      : never
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
  : PublicCompositeTypeNameOrOptions extends keyof DatabaseWithoutInternals
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "draft",
        "pending",
        "returned",
        "approved",
        "rejected",
        "on_hold",
        "submitted",
      ],
      application_type: ["business_trip", "expense"],
      user_plan: ["Free", "Pro", "Enterprise"],
      user_role: ["admin", "department_admin", "approver", "general_user"],
      user_status: ["active", "invited", "inactive"],
    },
  },
} as const
