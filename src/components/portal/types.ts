import type { Tables } from "@/integrations/supabase/types";

// Portal view models derived from the generated database types so they stay in sync with the schema.
type CourseRow = Tables<"courses">;
type EnrollmentRow = Tables<"enrollments">;
type ProfileRow = Tables<"profiles">;

export type Course = Pick<CourseRow,
  "id" | "title" | "description" | "price" | "currency" | "starts_at" | "ends_at" |
  "installments_count" | "online_url" | "cover_emoji" | "active"
> & { total_hours: CourseRow["total_hours"] | null; is_archived?: CourseRow["is_archived"] };

export type Enrollment = Pick<EnrollmentRow,
  "id" | "user_id" | "course_id" | "status" | "certificate_url" | "certificate_issued" | "notes" |
  "name_ar" | "name_en" | "certificate_url_ar" | "certificate_url_en" | "certificate_requested_at" |
  "payment_reminder_dismissed_at"
> & { courses: Course | null };

export type Profile = Pick<ProfileRow, "full_name" | "email" | "phone" | "country" | "country_code"> &
  Partial<Pick<ProfileRow, "account_blocked" | "avatar_url">>;

export type ModuleRow = Pick<Tables<"course_modules">, "id" | "course_id" | "completed_by_admin">;
