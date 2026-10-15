import type { Tables } from "@/integrations/supabase/types";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";
import { generateCertificatePdf } from "@/lib/certificate";
import { useI18n } from "@/lib/i18n";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Wallet,
  Loader2,
  Users,
  BookOpen,
  Award,
  FileText,
  X,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Layers,
  Link as LinkIcon,
  StickyNote,
  Paperclip,
  Pencil,
  Check,
  Clock,
  Settings2,
  Sparkles,
  Ticket,
  Percent,
  Archive,
  Camera,
  LifeBuoy,
  Star,
  CreditCard,
  Trophy,
  Video,
  ShieldCheck,
  LayoutDashboard,
  MoreHorizontal,
} from "lucide-react";
import { findCountry } from "@/lib/countries";
import { safeHref } from "@/lib/safe-url";
import { AdminSupportPanel } from "@/components/SupportTickets";
import { assertAdmin } from "@/lib/admin-guard.functions";
import { SiteManagementPanel } from "@/components/admin/SiteManagementPanel";
import { SuccessCasesPanel } from "@/components/admin/SuccessCasesPanel";
import { PartnersPanel } from "@/components/admin/PartnersPanel";
import { ContractsPanel } from "@/components/admin/ContractsPanel";
import { BookingsPanel } from "@/components/admin/BookingsPanel";
import { PackagesPanel } from "@/components/admin/PackagesPanel";
import { InterviewsPanel } from "@/components/admin/InterviewsPanel";
import { TrainingsPanel } from "@/components/admin/TrainingsPanel";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { TraineeDrawer } from "@/components/admin/TraineeDrawer";
import { ExecutiveOverview } from "@/components/admin/ExecutiveOverview";
import { CourseFeedbackPanel } from "@/components/admin/CourseFeedbackPanel";
import { Button } from "@/components/ui/button";


export type Course = Pick<Tables<"courses">,
  "id" | "title" | "description" | "price" | "currency" | "active" | "starts_at" | "ends_at" |
  "installments_count" | "online_url" | "cover_emoji"
> & { total_hours: number | null; course_goals?: string | null; target_audience?: string | null };

export type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: "pending" | "approved" | "rejected";
  certificate_url: string | null;
  certificate_issued: boolean;
  notes: string | null;
  created_at: string;
  blocked: boolean;
  name_ar: string | null;
  name_en: string | null;
  certificate_url_ar: string | null;
  certificate_url_en: string | null;
  certificate_requested_at: string | null;
  courses: Course | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    country_code: string | null;
    account_blocked: boolean | null;
  } | null;
};

export type CouponRow = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  course_id: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  note: string | null;
  created_at: string;
};

export type LatestAdditionAdminRow = {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  custom_label: string | null;
  kind: "link" | "file" | "video" | "pdf" | "embed";
  url: string;
  created_at: string;
};

export type LatestAdditionsSettingsRow = {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string | null;
  subtitle_en: string | null;
};

export type TestimonialAdminRow = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  quote: string;
  avatar_url: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
};

export type SnapshotRow = {
  id: string;
  image_url: string;
  caption_ar: string | null;
  caption_en: string | null;
  display_order: number;
  is_visible: boolean;
};

export type PendingProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  country_code: string | null;
  activation_status: "pending" | "active" | "rejected";
  created_at: string;
};

export type ActivationSettings = {
  admin_whatsapp_e164: string | null;
  activation_request_template_ar: string;
  activation_request_template_en: string;
  welcome_message_template_ar: string;
  welcome_message_template_en: string;
};

export type CourseLead = {
  id: string;
  course_id: string | null;
  course_title: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  country_code: string | null;
  notes: string | null;
  admin_notes: string | null;
  language: string;
  status: string;
  created_at: string;
};

export type LeadStatus = "new" | "contacted" | "converted" | "archived";
