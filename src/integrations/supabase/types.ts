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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          birth_date: string | null
          created_at: string
          created_date: string | null
          email: string | null
          followers: number | null
          ga_enabled: boolean | null
          id: string
          keranjang_kuning: boolean | null
          managed_by: string | null
          notes: string | null
          password_encrypted: string | null
          phone: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          status: Database["public"]["Enums"]["account_status"] | null
          team_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          birth_date?: string | null
          created_at?: string
          created_date?: string | null
          email?: string | null
          followers?: number | null
          ga_enabled?: boolean | null
          id?: string
          keranjang_kuning?: boolean | null
          managed_by?: string | null
          notes?: string | null
          password_encrypted?: string | null
          phone?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          status?: Database["public"]["Enums"]["account_status"] | null
          team_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          birth_date?: string | null
          created_at?: string
          created_date?: string | null
          email?: string | null
          followers?: number | null
          ga_enabled?: boolean | null
          id?: string
          keranjang_kuning?: boolean | null
          managed_by?: string | null
          notes?: string | null
          password_encrypted?: string | null
          phone?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          status?: Database["public"]["Enums"]["account_status"] | null
          team_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      kpi_targets: {
        Row: {
          created_at: string
          created_by: string
          end_date: string
          id: string
          metric: string
          period: Database["public"]["Enums"]["period_type"]
          start_date: string
          target_for_id: string
          target_for_type: Database["public"]["Enums"]["target_for_type"]
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date: string
          id?: string
          metric: string
          period: Database["public"]["Enums"]["period_type"]
          start_date: string
          target_for_id: string
          target_for_type: Database["public"]["Enums"]["target_for_type"]
          target_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
          metric?: string
          period?: Database["public"]["Enums"]["period_type"]
          start_date?: string
          target_for_id?: string
          target_for_type?: Database["public"]["Enums"]["target_for_type"]
          target_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      performance_logs: {
        Row: {
          created_at: string
          date: string
          division: Database["public"]["Enums"]["division_type"] | null
          id: string
          meta: Json | null
          metric: string
          team_id: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          created_at?: string
          date: string
          division?: Database["public"]["Enums"]["division_type"] | null
          id?: string
          meta?: Json | null
          metric: string
          team_id?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          created_at?: string
          date?: string
          division?: Database["public"]["Enums"]["division_type"] | null
          id?: string
          meta?: Json | null
          metric?: string
          team_id?: string | null
          user_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          spreadsheet_url: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          spreadsheet_url: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          spreadsheet_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sops: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          file_path: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          file_path?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          file_path?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role_in_team: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role_in_team?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role_in_team?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          division: Database["public"]["Enums"]["division_type"] | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          division?: Database["public"]["Enums"]["division_type"] | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          division?: Database["public"]["Enums"]["division_type"] | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      tutorials: {
        Row: {
          body: string | null
          created_at: string
          created_by: string
          file_path: string | null
          id: string
          is_public: boolean | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by: string
          file_path?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string
          file_path?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      users_meta: {
        Row: {
          created_at: string
          division: Database["public"]["Enums"]["division_type"] | null
          full_name: string
          id: string
          profile: Json | null
          registered_at: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          division?: Database["public"]["Enums"]["division_type"] | null
          full_name: string
          id: string
          profile?: Json | null
          registered_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          division?: Database["public"]["Enums"]["division_type"] | null
          full_name?: string
          id?: string
          profile?: Json | null
          registered_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_manager: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "active" | "banned" | "pelanggaran" | "not_recommended"
      account_type: "affiliate" | "seller"
      app_role: "manager" | "karyawan" | "pkl"
      division_type: "konten_kreator" | "host_live" | "model" | "manager"
      period_type: "daily" | "monthly"
      platform_type: "tiktok" | "shopee" | "other"
      target_for_type: "user" | "team" | "division"
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
      account_status: ["active", "banned", "pelanggaran", "not_recommended"],
      account_type: ["affiliate", "seller"],
      app_role: ["manager", "karyawan", "pkl"],
      division_type: ["konten_kreator", "host_live", "model", "manager"],
      period_type: ["daily", "monthly"],
      platform_type: ["tiktok", "shopee", "other"],
      target_for_type: ["user", "team", "division"],
    },
  },
} as const
