// PREPARED, default OFF (only used when VITE_LEARNER_PROGRESS=1). Design A: the SERVER sets certificate_issued (issue_my_certificate);
// the browser then renders the certificate locally from the learner's own server row. The QR points to /verify/<enrollment id>.
import { supabase } from "@/integrations/supabase/client";
import { readCertificateSettings } from "@/lib/certificate-settings";

export type SelfCertInput = { id: string; course_id: string; name_ar: string | null; name_en: string | null; courses: { title: string; description?: string | null; total_hours?: number | null } | null };

// Date rule: ONLY the server's immutable timestamp (from issue_my_certificate or the learner's own row). No client clock fallback.
// Legacy rows have no timestamp: the exact issue date is unknown, so nothing is rendered with an invented date.
export function resolveIssueDate(...candidates: Array<string | null | undefined>): Date | null {
  for (const c of candidates) { if (!c) continue; const d = new Date(c); if (!isNaN(d.getTime())) return d; }
  return null;
}

export function buildPayload(row: SelfCertInput, lang: "ar" | "en", issueDate: Date, settings: unknown, course: any) {
  const name = lang === "ar" ? row.name_ar : row.name_en;
  if (!name || !row.courses) return null;
  return {
    lang, studentName: name, courseTitle: row.courses.title, courseDescription: row.courses.description ?? null,
    totalHours: Number(row.courses.total_hours ?? 0), issueDate, certificateId: row.id,
    courseLogoUrl: course?.logo_url ?? null, courseBrandName: course?.brand_name ?? null, settings: readCertificateSettings(settings as any),
  };
}

export async function renderOwnCertificates(row: SelfCertInput, issueDate: Date): Promise<{ ar: Blob; en: Blob }> {
  const { generateCertificatePdf } = await import("@/lib/certificate");
  const { data } = await (supabase as any).from("courses").select("certificate_settings,logo_url,brand_name").eq("id", row.course_id).maybeSingle();
  const pa = buildPayload(row, "ar", issueDate, data?.certificate_settings, data); const pe = buildPayload(row, "en", issueDate, data?.certificate_settings, data);
  if (!pa || !pe) throw new Error("names or course missing");
  const ar = await generateCertificatePdf(pa); const en = await generateCertificatePdf(pe); // sequential, as the admin flow does
  return { ar, en };
}
