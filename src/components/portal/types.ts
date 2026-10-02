export type Course = {
  id: string; title: string; description: string | null; price: number | null;
  currency: string; starts_at: string | null; ends_at: string | null;
  installments_count: number; online_url: string | null; cover_emoji: string | null;
  total_hours: number | null; active: boolean; is_archived?: boolean;
};
export type Enrollment = {
  id: string; user_id: string; course_id: string; status: "pending" | "approved" | "rejected";
  certificate_url: string | null; certificate_issued: boolean; notes: string | null;
  name_ar: string | null; name_en: string | null;
  certificate_url_ar: string | null; certificate_url_en: string | null;
  certificate_requested_at: string | null;
  payment_reminder_dismissed_at: string | null;
  courses: Course | null;
};
export type Profile = { full_name: string | null; email: string | null; phone: string | null; country: string | null; country_code: string | null; account_blocked?: boolean; avatar_url?: string | null };
export type ModuleRow = { id: string; course_id: string; completed_by_admin: boolean };
