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
      profiles: {
        Row: {
          confidence_level: number | null
          created_at: string
          current_programme_id: string | null
          full_name: string | null
          goal: string | null
          id: string
          onboarded: boolean
          role: string | null
          scenarios: string[] | null
          updated_at: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string
          current_programme_id?: string | null
          full_name?: string | null
          goal?: string | null
          id: string
          onboarded?: boolean
          role?: string | null
          scenarios?: string[] | null
          updated_at?: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string
          current_programme_id?: string | null
          full_name?: string | null
          goal?: string | null
          id?: string
          onboarded?: boolean
          role?: string | null
          scenarios?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      programmes: {
        Row: {
          created_at: string
          daily_sessions: number
          description: string
          id: string
          slug: string
          sort_order: number
          target_outcomes: string[]
          title: string
          weeks: number
        }
        Insert: {
          created_at?: string
          daily_sessions: number
          description: string
          id?: string
          slug: string
          sort_order?: number
          target_outcomes?: string[]
          title: string
          weeks: number
        }
        Update: {
          created_at?: string
          daily_sessions?: number
          description?: string
          id?: string
          slug?: string
          sort_order?: number
          target_outcomes?: string[]
          title?: string
          weeks?: number
        }
        Relationships: []
      }
      session_exercises: {
        Row: {
          audio_path: string | null
          created_at: string
          display_order: number
          duration_seconds: number
          exercise_type: string
          id: string
          prompt: string | null
          session_id: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_path?: string | null
          created_at?: string
          display_order?: number
          duration_seconds?: number
          exercise_type: string
          id?: string
          prompt?: string | null
          session_id: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          audio_path?: string | null
          created_at?: string
          display_order?: number
          duration_seconds?: number
          exercise_type?: string
          id?: string
          prompt?: string | null
          session_id?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_scores: {
        Row: {
          avg_sentence_length: number
          clarity: number
          created_at: string
          feedback: Json
          filler: number
          filler_count: number
          id: string
          overall: number
          pace: number
          pause_count: number
          session_id: string
          structure: number
          user_id: string
          wpm: number
        }
        Insert: {
          avg_sentence_length?: number
          clarity: number
          created_at?: string
          feedback?: Json
          filler: number
          filler_count?: number
          id?: string
          overall: number
          pace: number
          pause_count?: number
          session_id: string
          structure: number
          user_id: string
          wpm?: number
        }
        Update: {
          avg_sentence_length?: number
          clarity?: number
          created_at?: string
          feedback?: Json
          filler?: number
          filler_count?: number
          id?: string
          overall?: number
          pace?: number
          pause_count?: number
          session_id?: string
          structure?: number
          user_id?: string
          wpm?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          duration_seconds: number
          id: string
          programme_id: string | null
          session_date: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          duration_seconds?: number
          id?: string
          programme_id?: string | null
          session_date?: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          duration_seconds?: number
          id?: string
          programme_id?: string | null
          session_date?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          current_streak: number
          last_session_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_session_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_session_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          goal_description: string | null
          goal_title: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_description?: string | null
          goal_title: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          goal_description?: string | null
          goal_title?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_programmes: {
        Row: {
          active: boolean
          completed_at: string | null
          completed_sessions: number
          id: string
          programme_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          active?: boolean
          completed_at?: string | null
          completed_sessions?: number
          id?: string
          programme_id: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          active?: boolean
          completed_at?: string | null
          completed_sessions?: number
          id?: string
          programme_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_programmes_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
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
