import { supabase } from "@/integrations/supabase/client";

/** Logos for payment methods. Stored as { [paymentMethodId]: small image data URL } in the existing site_content table (same pattern as contract logos), so no schema change. */
export const PAYMENT_LOGOS_KEY = "site.payment_logos";
const MAX_LEN = 120_000;

/** Only small png/jpeg/webp data URLs or https URLs. */
export function parsePaymentLogo(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.length > MAX_LEN || /\s/.test(raw)) return "";
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(raw)) return raw;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && !u.username && !u.password ? u.toString() : "";
  } catch { return ""; }
}

export function parsePaymentLogos(content: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!content || typeof content !== "object" || Array.isArray(content)) return out;
  for (const [id, v] of Object.entries(content as Record<string, unknown>)) {
    const safe = parsePaymentLogo(v);
    if (safe) out[id] = safe;
  }
  return out;
}

export async function fetchPaymentLogos(): Promise<Record<string, string>> {
  const { data } = await supabase.from("site_content").select("content").eq("section_key", PAYMENT_LOGOS_KEY).maybeSingle();
  return parsePaymentLogos((data as { content?: unknown } | null)?.content);
}

/** Admin only. Sets or clears (logo = null) one payment method's logo, keeping the other entries. Throws on any read/write error. */
export async function setPaymentLogo(methodId: string, logo: string | null): Promise<void> {
  const { data, error: readError } = await supabase.from("site_content").select("id, content").eq("section_key", PAYMENT_LOGOS_KEY).maybeSingle();
  if (readError) throw readError;
  const next = parsePaymentLogos(data?.content);
  if (logo) { const safe = parsePaymentLogo(logo); if (!safe) throw new Error("Invalid logo"); next[methodId] = safe; } else delete next[methodId];
  const res = data?.id
    ? await supabase.from("site_content").update({ content: next, is_visible: true }).eq("id", data.id)
    : await supabase.from("site_content").insert({ section_key: PAYMENT_LOGOS_KEY, label: "لوجوهات طرق الدفع", content: next, is_visible: true });
  if (res.error) throw res.error;
}
