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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bib_announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          importance: string
          pinned: boolean
          subject_code: string | null
          teacher_id: string | null
          teacher_name: string
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          importance?: string
          pinned?: boolean
          subject_code?: string | null
          teacher_id?: string | null
          teacher_name?: string
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          importance?: string
          pinned?: boolean
          subject_code?: string | null
          teacher_id?: string | null
          teacher_name?: string
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      bib_blocked_words: {
        Row: {
          created_at: string
          word: string
        }
        Insert: {
          created_at?: string
          word: string
        }
        Update: {
          created_at?: string
          word?: string
        }
        Relationships: []
      }
      bib_calendar_events: {
        Row: {
          created_at: string
          description: string
          ends_at: string | null
          event_type: string
          id: string
          starts_at: string
          subject_code: string | null
          teacher_id: string | null
          teacher_name: string
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          description?: string
          ends_at?: string | null
          event_type?: string
          id?: string
          starts_at: string
          subject_code?: string | null
          teacher_id?: string | null
          teacher_name?: string
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          ends_at?: string | null
          event_type?: string
          id?: string
          starts_at?: string
          subject_code?: string | null
          teacher_id?: string | null
          teacher_name?: string
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      bib_message_reads: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          message_id: string
          read_at: string | null
          reader_key: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          message_id: string
          read_at?: string | null
          reader_key: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          message_id?: string
          read_at?: string | null
          reader_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bib_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "bib_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_message_targets: {
        Row: {
          created_at: string
          id: string
          message_id: string
          target_person: string | null
          target_role: string | null
          target_type: string
          target_year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          target_person?: string | null
          target_role?: string | null
          target_type: string
          target_year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          target_person?: string | null
          target_role?: string | null
          target_type?: string
          target_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bib_message_targets_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "bib_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_name: string
          sender_role: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          sender_name?: string
          sender_role: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_name?: string
          sender_role?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bib_resources: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          downloads: number
          external_url: string | null
          featured: boolean
          file_path: string | null
          file_size: number | null
          id: string
          kind: string
          mime_type: string | null
          provider: string | null
          subject_code: string
          tags: string[]
          teacher_id: string | null
          teacher_name: string
          title: string
          topic: string | null
          unit: string | null
          updated_at: string
          views: number
          year: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          downloads?: number
          external_url?: string | null
          featured?: boolean
          file_path?: string | null
          file_size?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          provider?: string | null
          subject_code: string
          tags?: string[]
          teacher_id?: string | null
          teacher_name?: string
          title: string
          topic?: string | null
          unit?: string | null
          updated_at?: string
          views?: number
          year: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          downloads?: number
          external_url?: string | null
          featured?: boolean
          file_path?: string | null
          file_size?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          provider?: string | null
          subject_code?: string
          tags?: string[]
          teacher_id?: string | null
          teacher_name?: string
          title?: string
          topic?: string | null
          unit?: string | null
          updated_at?: string
          views?: number
          year?: number
        }
        Relationships: []
      }
      bib_subjects: {
        Row: {
          code: string
          created_at: string
          name: string
          updated_at: string
          year: number
        }
        Insert: {
          code: string
          created_at?: string
          name: string
          updated_at?: string
          year: number
        }
        Update: {
          code?: string
          created_at?: string
          name?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      bib_teachers: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          onboarded: boolean
          subject_codes: string[]
          teach_years: number[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          onboarded?: boolean
          subject_codes?: string[]
          teach_years?: number[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          onboarded?: boolean
          subject_codes?: string[]
          teach_years?: number[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          data: Json
          section: string
          updated_at: string
        }
        Insert: {
          data?: Json
          section: string
          updated_at?: string
        }
        Update: {
          data?: Json
          section?: string
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
