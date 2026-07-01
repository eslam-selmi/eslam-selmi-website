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
          file_path: string | null
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
          file_path?: string | null
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
          file_path?: string | null
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
          is_graduation_project: boolean
          is_visible: boolean
          max_score: number
          module_id: string
          reference_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_graduation_project?: boolean
          is_visible?: boolean
          max_score?: number
          module_id: string
          reference_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_graduation_project?: boolean
          is_visible?: boolean
          max_score?: number
          module_id?: string
          reference_url?: string | null
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
      consultation_slots: {
        Row: {
          admin_notes: string | null
          booked_at: string | null
          booked_by: string | null
          booker_email: string | null
          booker_name: string | null
          booker_phone: string | null
          created_at: string
          duration_minutes: number
          id: string
          starts_at: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          booked_at?: string | null
          booked_by?: string | null
          booker_email?: string | null
          booker_name?: string | null
          booker_phone?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          starts_at: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          booked_at?: string | null
          booked_by?: string | null
          booker_email?: string | null
          booker_name?: string | null
          booker_phone?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          starts_at?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
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
      course_interests: {
        Row: {
          country_code: string | null
          course_id: string | null
          course_title: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          language: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          country_code?: string | null
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          language?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          country_code?: string | null
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          language?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_interests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
      course_trainers: {
        Row: {
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_trainers_course_id_fkey"
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
          brand_name: string | null
          brand_primary_color: string | null
          brand_tagline_ar: string | null
          brand_tagline_en: string | null
          course_goals: string | null
          cover_emoji: string | null
          created_at: string
          currency: string
          description: string | null
          ends_at: string | null
          id: string
          installments_count: number
          is_archived: boolean
          is_upcoming: boolean
          logo_url: string | null
          online_url: string | null
          phase: number
          price: number | null
          slug: string | null
          starts_at: string | null
          target_audience: string | null
          title: string
          total_hours: number
          track_key: string | null
        }
        Insert: {
          active?: boolean
          brand_name?: string | null
          brand_primary_color?: string | null
          brand_tagline_ar?: string | null
          brand_tagline_en?: string | null
          course_goals?: string | null
          cover_emoji?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          installments_count?: number
          is_archived?: boolean
          is_upcoming?: boolean
          logo_url?: string | null
          online_url?: string | null
          phase?: number
          price?: number | null
          slug?: string | null
          starts_at?: string | null
          target_audience?: string | null
          title: string
          total_hours?: number
          track_key?: string | null
        }
        Update: {
          active?: boolean
          brand_name?: string | null
          brand_primary_color?: string | null
          brand_tagline_ar?: string | null
          brand_tagline_en?: string | null
          course_goals?: string | null
          cover_emoji?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          installments_count?: number
          is_archived?: boolean
          is_upcoming?: boolean
          logo_url?: string | null
          online_url?: string | null
          phase?: number
          price?: number | null
          slug?: string | null
          starts_at?: string | null
          target_audience?: string | null
          title?: string
          total_hours?: number
          track_key?: string | null
        }
        Relationships: []
      }
      custom_countries: {
        Row: {
          created_at: string
          created_by: string | null
          dial: string | null
          flag: string | null
          id: string
          name_ar: string
          name_en: string
          normalized: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dial?: string | null
          flag?: string | null
          id?: string
          name_ar: string
          name_en: string
          normalized: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dial?: string | null
          flag?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          normalized?: string
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
          grace_until: string | null
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
          grace_until?: string | null
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
          grace_until?: string | null
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
          {
            foreignKeyName: "installments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "trainer_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          cover_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          is_published: boolean
          resource_url: string
          sort_order: number
          title_ar: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_published?: boolean
          resource_url: string
          sort_order?: number
          title_ar: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_published?: boolean
          resource_url?: string
          sort_order?: number
          title_ar?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      latest_additions: {
        Row: {
          created_at: string
          custom_label: string | null
          id: string
          kind: string
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string
          title_en: string
          url: string
        }
        Insert: {
          created_at?: string
          custom_label?: string | null
          id?: string
          kind: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar: string
          title_en: string
          url: string
        }
        Update: {
          created_at?: string
          custom_label?: string | null
          id?: string
          kind?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string
          title_en?: string
          url?: string
        }
        Relationships: []
      }
      latest_additions_settings: {
        Row: {
          id: string
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          id?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
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
      payment_methods: {
        Row: {
          active: boolean
          created_at: string
          details_ar: string | null
          details_en: string | null
          id: string
          name_ar: string
          name_en: string
          order_index: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          details_ar?: string | null
          details_en?: string | null
          id?: string
          name_ar: string
          name_en: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          details_ar?: string | null
          details_en?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          order_index?: number
          updated_at?: string
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
          payment_method_id: string | null
          payment_method_name: string | null
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
          payment_method_id?: string | null
          payment_method_name?: string | null
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
          payment_method_id?: string | null
          payment_method_name?: string | null
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
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "trainer_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          activation_request_template_ar: string
          activation_request_template_en: string
          admin_whatsapp_e164: string | null
          id: string
          singleton: boolean
          updated_at: string
          welcome_message_template_ar: string
          welcome_message_template_en: string
        }
        Insert: {
          activation_request_template_ar?: string
          activation_request_template_en?: string
          admin_whatsapp_e164?: string | null
          id?: string
          singleton?: boolean
          updated_at?: string
          welcome_message_template_ar?: string
          welcome_message_template_en?: string
        }
        Update: {
          activation_request_template_ar?: string
          activation_request_template_en?: string
          admin_whatsapp_e164?: string | null
          id?: string
          singleton?: boolean
          updated_at?: string
          welcome_message_template_ar?: string
          welcome_message_template_en?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_blocked: boolean
          activated_at: string | null
          activation_status: string
          country: string | null
          country_code: string | null
          created_at: string
          email: string | null
          force_password_reset: boolean
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_blocked?: boolean
          activated_at?: string | null
          activation_status?: string
          country?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          force_password_reset?: boolean
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_blocked?: boolean
          activated_at?: string | null
          activation_status?: string
          country?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          force_password_reset?: boolean
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          id: string
          is_visible: boolean
          label: string | null
          section_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          is_visible?: boolean
          label?: string | null
          section_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          is_visible?: boolean
          label?: string | null
          section_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_popups: {
        Row: {
          body_ar: string | null
          body_en: string | null
          created_at: string
          cta_label_ar: string | null
          cta_label_en: string | null
          cta_url: string | null
          delay_seconds: number
          ends_at: string | null
          frequency: string
          frequency_days: number
          id: string
          image_url: string | null
          is_active: boolean
          starts_at: string | null
          title_ar: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          cta_label_ar?: string | null
          cta_label_en?: string | null
          cta_url?: string | null
          delay_seconds?: number
          ends_at?: string | null
          frequency?: string
          frequency_days?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          starts_at?: string | null
          title_ar: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          cta_label_ar?: string | null
          cta_label_en?: string | null
          cta_url?: string | null
          delay_seconds?: number
          ends_at?: string | null
          frequency?: string
          frequency_days?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          starts_at?: string | null
          title_ar?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      success_cases: {
        Row: {
          challenges_ar: string | null
          challenges_en: string | null
          cover_image_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          display_order: number
          external_url: string | null
          gallery_urls: string[] | null
          id: string
          is_visible: boolean
          name_ar: string
          name_en: string | null
          results_ar: string | null
          results_en: string | null
          slug: string | null
          solutions_ar: string | null
          solutions_en: string | null
          tools: string[] | null
          updated_at: string
        }
        Insert: {
          challenges_ar?: string | null
          challenges_en?: string | null
          cover_image_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          external_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          is_visible?: boolean
          name_ar: string
          name_en?: string | null
          results_ar?: string | null
          results_en?: string | null
          slug?: string | null
          solutions_ar?: string | null
          solutions_en?: string | null
          tools?: string[] | null
          updated_at?: string
        }
        Update: {
          challenges_ar?: string | null
          challenges_en?: string | null
          cover_image_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          external_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          is_visible?: boolean
          name_ar?: string
          name_en?: string | null
          results_ar?: string | null
          results_en?: string | null
          slug?: string | null
          solutions_ar?: string | null
          solutions_en?: string | null
          tools?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          last_message_at: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          unread_for_admin: boolean
          unread_for_user: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          unread_for_admin?: boolean
          unread_for_user?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          unread_for_admin?: boolean
          unread_for_user?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          name: string
          quote: string
          rating: number | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          name: string
          quote: string
          rating?: number | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          name?: string
          quote?: string
          rating?: number | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trainer_permissions: {
        Row: {
          can_approve_enrollments: boolean
          can_archive_course: boolean
          can_edit_content: boolean
          can_grade_assignments: boolean
          can_grade_graduation: boolean
          can_view_trainees: boolean
          course_trainer_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          can_approve_enrollments?: boolean
          can_archive_course?: boolean
          can_edit_content?: boolean
          can_grade_assignments?: boolean
          can_grade_graduation?: boolean
          can_view_trainees?: boolean
          course_trainer_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          can_approve_enrollments?: boolean
          can_archive_course?: boolean
          can_edit_content?: boolean
          can_grade_assignments?: boolean
          can_grade_graduation?: boolean
          can_view_trainees?: boolean
          course_trainer_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trainings: {
        Row: {
          challenge_ar: string | null
          challenge_en: string | null
          cover_url: string | null
          created_at: string
          gallery: Json
          id: string
          is_featured: boolean
          is_published: boolean
          period_ar: string | null
          period_en: string | null
          result_ar: string | null
          result_en: string | null
          role_ar: string | null
          role_en: string | null
          solution_ar: string | null
          solution_en: string | null
          sort_order: number
          tags: string[]
          title_ar: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          challenge_ar?: string | null
          challenge_en?: string | null
          cover_url?: string | null
          created_at?: string
          gallery?: Json
          id?: string
          is_featured?: boolean
          is_published?: boolean
          period_ar?: string | null
          period_en?: string | null
          result_ar?: string | null
          result_en?: string | null
          role_ar?: string | null
          role_en?: string | null
          solution_ar?: string | null
          solution_en?: string | null
          sort_order?: number
          tags?: string[]
          title_ar: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          challenge_ar?: string | null
          challenge_en?: string | null
          cover_url?: string | null
          created_at?: string
          gallery?: Json
          id?: string
          is_featured?: boolean
          is_published?: boolean
          period_ar?: string | null
          period_en?: string | null
          result_ar?: string | null
          result_en?: string | null
          role_ar?: string | null
          role_en?: string | null
          solution_ar?: string | null
          solution_en?: string | null
          sort_order?: number
          tags?: string[]
          title_ar?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_suspended: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_suspended?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_suspended?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      trainer_enrollments: {
        Row: {
          blocked: boolean | null
          certificate_issued: boolean | null
          certificate_requested_at: string | null
          course_id: string | null
          created_at: string | null
          id: string | null
          name_ar: string | null
          name_en: string | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          certificate_issued?: boolean | null
          certificate_requested_at?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string | null
          name_ar?: string | null
          name_en?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          certificate_issued?: boolean | null
          certificate_requested_at?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string | null
          name_ar?: string | null
          name_en?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at?: string | null
          user_id?: string | null
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
    }
    Functions: {
      apply_coupon_to_enrollment: {
        Args: { _code: string; _enrollment_id: string }
        Returns: Json
      }
      get_activation_contact: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_trainer_of_course: { Args: { _course_id: string }; Returns: boolean }
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
      trainer_has_perm: {
        Args: { _course_id: string; _perm: string }
        Returns: boolean
      }
      validate_coupon: {
        Args: { _code: string; _course_id: string }
        Returns: Json
      }
      verify_certificate: { Args: { _enrollment_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "trainee" | "trainer"
      coupon_discount_type: "percent" | "fixed"
      enrollment_status: "pending" | "approved" | "rejected"
      payment_status: "pending" | "approved" | "rejected"
      support_ticket_status:
        | "open"
        | "pending_admin"
        | "pending_user"
        | "closed"
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
      app_role: ["admin", "trainee", "trainer"],
      coupon_discount_type: ["percent", "fixed"],
      enrollment_status: ["pending", "approved", "rejected"],
      payment_status: ["pending", "approved", "rejected"],
      support_ticket_status: [
        "open",
        "pending_admin",
        "pending_user",
        "closed",
      ],
    },
  },
} as const
