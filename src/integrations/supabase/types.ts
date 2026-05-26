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
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          feedback: string | null
          graded_at: string | null
          id: string
          link: string | null
          score: number | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          feedback?: string | null
          graded_at?: string | null
          id?: string
          link?: string | null
          score?: number | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          feedback?: string | null
          graded_at?: string | null
          id?: string
          link?: string | null
          score?: number | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          instructions: string | null
          max_score: number
          module_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_score?: number
          module_id: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_score?: number
          module_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          discount_amount: number
          enrollment_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          enrollment_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          enrollment_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          course_id: string | null
          created_at: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          note: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          course_id?: string | null
          created_at?: string
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          note?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          course_id?: string | null
          created_at?: string
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          note?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      course_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          language: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          language?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          language?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          completed_by_admin: boolean
          course_id: string
          created_at: string
          id: string
          online_url: string | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          completed_by_admin?: boolean
          course_id: string
          created_at?: string
          id?: string
          online_url?: string | null
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          completed_by_admin?: boolean
          course_id?: string
          created_at?: string
          id?: string
          online_url?: string | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          course_id: string
          created_at: string
          duration_minutes: number
          id: string
          online_url: string | null
          starts_at: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          online_url?: string | null
          starts_at: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          online_url?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean
          cover_emoji: string | null
          created_at: string
          currency: string
          description: string | null
          ends_at: string | null
          id: string
          installments_count: number
          online_url: string | null
          price: number | null
          starts_at: string | null
          title: string
          total_hours: number
        }
        Insert: {
          active?: boolean
          cover_emoji?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          installments_count?: number
          online_url?: string | null
          price?: number | null
          starts_at?: string | null
          title: string
          total_hours?: number
        }
        Update: {
          active?: boolean
          cover_emoji?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          installments_count?: number
          online_url?: string | null
          price?: number | null
          starts_at?: string | null
          title?: string
          total_hours?: number
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          blocked: boolean
          certificate_issued: boolean
          certificate_requested_at: string | null
          certificate_url: string | null
          certificate_url_ar: string | null
          certificate_url_en: string | null
          coupon_code: string | null
          course_id: string
          created_at: string
          discount_amount: number
          id: string
          name_ar: string | null
          name_en: string | null
          notes: string | null
          payment_reminder_dismissed_at: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          blocked?: boolean
          certificate_issued?: boolean
          certificate_requested_at?: string | null
          certificate_url?: string | null
          certificate_url_ar?: string | null
          certificate_url_en?: string | null
          coupon_code?: string | null
          course_id: string
          created_at?: string
          discount_amount?: number
          id?: string
          name_ar?: string | null
          name_en?: string | null
          notes?: string | null
          payment_reminder_dismissed_at?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          blocked?: boolean
          certificate_issued?: boolean
          certificate_requested_at?: string | null
          certificate_url?: string | null
          certificate_url_ar?: string | null
          certificate_url_en?: string | null
          coupon_code?: string | null
          course_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          name_ar?: string | null
          name_en?: string | null
          notes?: string | null
          payment_reminder_dismissed_at?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date: string | null
          enrollment_id: string
          id: string
          note: string | null
          paid: boolean
          paid_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          due_date?: string | null
          enrollment_id: string
          id?: string
          note?: string | null
          paid?: boolean
          paid_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          enrollment_id?: string
          id?: string
          note?: string | null
          paid?: boolean
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      module_items: {
        Row: {
          content: string | null
          created_at: string
          id: string
          kind: string
          module_id: string
          order_index: number
          title: string
          url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          kind: string
          module_id: string
          order_index?: number
          title: string
          url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          kind?: string
          module_id?: string
          order_index?: number
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_items_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          enrollment_id: string
          id: string
          note: string | null
          paid_at: string
          proof_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          submitted_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          enrollment_id: string
          id?: string
          note?: string | null
          paid_at?: string
          proof_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          enrollment_id?: string
          id?: string
          note?: string | null
          paid_at?: string
          proof_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_blocked: boolean
          country: string | null
          country_code: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_blocked?: boolean
          country?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_blocked?: boolean
          country?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_coupon_to_enrollment: {
        Args: { _code: string; _enrollment_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_admins: {
        Args: { _body: string; _link: string; _title: string }
        Returns: undefined
      }
      notify_course_enrollees: {
        Args: {
          _body: string
          _course_id: string
          _link: string
          _title: string
        }
        Returns: undefined
      }
      validate_coupon: {
        Args: { _code: string; _course_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "trainee"
      coupon_discount_type: "percent" | "fixed"
      enrollment_status: "pending" | "approved" | "rejected"
      payment_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "trainee"],
      coupon_discount_type: ["percent", "fixed"],
      enrollment_status: ["pending", "approved", "rejected"],
      payment_status: ["pending", "approved", "rejected"],
    },
  },
} as const
