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

/** Admin only. Sets or clears (logo = null) one payment method's logo, keeping the other entries.
 *  Read-modify-write guarded by updated_at: if another admin saved in between, the write matches no row and is retried from a fresh read (max 4 tries), so nobody's logo is overwritten silently. Throws on any error. */
export async function setPaymentLogo(methodId: string, logo: string | null): Promise<void> {
  const safe = logo ? parsePaymentLogo(logo) : "";
  if (logo && !safe) throw new Error("Invalid logo");
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error: readError } = await supabase.from("site_content").select("id, content, updated_at").eq("section_key", PAYMENT_LOGOS_KEY).maybeSingle();
    if (readError) throw readError;
    const next = parsePaymentLogos(data?.content);
    if (safe) next[methodId] = safe; else delete next[methodId];
    if (!data?.id) {
      const ins = await supabase.from("site_content").insert({ section_key: PAYMENT_LOGOS_KEY, label: "لوجوهات طرق الدفع", content: next, is_visible: true });
      if (!ins.error) return;
      // lost an insert race: read again and update instead
      continue;
    }
    const upd = await supabase.from("site_content").update({ content: next, is_visible: true }).eq("id", data.id).eq("updated_at", data.updated_at).select("id");
    if (upd.error) throw upd.error;
    if (upd.data && upd.data.length > 0) return;
  }
  throw new Error("Another admin changed the logos at the same time. Try again.");
}
