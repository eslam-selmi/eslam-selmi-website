import { supabase } from "@/integrations/supabase/client";
import { parseSocialUrl } from "@/lib/site-profile-data";

/** Company logos for the "عقود التميز" cards. Stored as { [contractId]: https url } in the existing site_content table, so no schema change. */
export const CONTRACT_LOGOS_KEY = "site.contract_logos";

export function parseContractLogos(content: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!content || typeof content !== "object" || Array.isArray(content)) return out;
  for (const [id, url] of Object.entries(content as Record<string, unknown>)) {
    if (typeof url !== "string") continue;
    const safe = parseSocialUrl(url);
    if (safe) out[id] = safe;
  }
  return out;
}

export async function fetchContractLogos(): Promise<Record<string, string>> {
  const { data } = await supabase.from("site_content").select("content").eq("section_key", CONTRACT_LOGOS_KEY).maybeSingle();
  return parseContractLogos((data as { content?: unknown } | null)?.content);
}

/** Admin only. Sets or clears (url = null) one contract's logo, keeping the other entries. */
export async function setContractLogo(contractId: string, url: string | null): Promise<void> {
  const { data, error: readError } = await supabase.from("site_content").select("id, content").eq("section_key", CONTRACT_LOGOS_KEY).maybeSingle();
  if (readError) throw readError;
  const next = parseContractLogos(data?.content);
  if (url) next[contractId] = url; else delete next[contractId];
  const res = data?.id
    ? await supabase.from("site_content").update({ content: next, is_visible: true }).eq("id", data.id)
    : await supabase.from("site_content").insert({ section_key: CONTRACT_LOGOS_KEY, label: "لوجوهات عقود التميز", content: next, is_visible: true });
  if (res.error) throw res.error;
}
