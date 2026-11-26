import headshotAsset from "@/assets/portfolio/headshot-cutout.png.asset.json";
import logoAsset from "@/assets/brand-logo-light.png.asset.json";
import logoDarkAsset from "@/assets/brand-logo-dark.png.asset.json";
import type { Tables } from "@/integrations/supabase/types";

export type SiteProfileRow = Pick<Tables<"site_content">, "id" | "content">;
export type SocialLink = { platform: string; url: string; label?: string };
export type SiteProfile = {
  logo: string;
  logoDark: string;
  portrait: string;
  phone: string;
  secondary_phone: string;
  email: string;
  linkedin: string;
  socials: SocialLink[];
  footer_ar: string;
  footer_en: string;
};
export const siteProfileDefaults: SiteProfile = {
  logo: logoAsset.url,
  logoDark: logoDarkAsset.url,
  portrait: headshotAsset.url,
  phone: "+966 555 376 228",
  secondary_phone: "+20 10 9727 9900",
  email: "eslam.m.selmi@gmail.com",
  linkedin: "https://www.linkedin.com/in/eslam-selmi/",
  socials: [],
  footer_ar: "",
  footer_en: "",
};
export function readSiteProfile(content: SiteProfileRow["content"]): SiteProfile {
  const result = { ...siteProfileDefaults };
  if (content && typeof content === "object" && !Array.isArray(content)) {
    for (const key of Object.keys(result) as (keyof SiteProfile)[]) {
      const value = content[key];
      if (typeof value === "string") (result as Record<string, unknown>)[key] = value;
    }
    if (Array.isArray(content.socials)) {
      result.socials = content.socials.filter((x): x is SocialLink => !!x && typeof x === "object" && typeof (x as SocialLink).platform === "string" && typeof (x as SocialLink).url === "string").map((x) => ({ platform: x.platform, url: x.url, label: typeof x.label === "string" ? x.label : undefined }));
    }
  }
  return result;
}
export function profileLinks(profile: SiteProfile) {
  const digits = profile.phone.replace(/\D/g, "");
  return {
    phone: `tel:${profile.phone.replace(/[^+\d]/g, "")}`,
    whatsapp: `https://wa.me/${digits}`,
    email: `mailto:${profile.email}`,
    socials: validSocials(profile.socials),
    linkedin: /^https:\/\/(www\.)?linkedin\.com\//i.test(profile.linkedin) ? profile.linkedin : siteProfileDefaults.linkedin,
  };
}
export const SOCIAL_PLATFORMS = ["facebook", "instagram", "x", "youtube", "tiktok", "telegram", "snapchat", "whatsapp_channel", "threads", "pinterest", "github", "behance", "medium", "twitch", "website", "custom"] as const;
/** Returns a normalized https URL, or "" when it is not a plausible public https address. */
export function parseSocialUrl(value: string): string {
  const raw = (value || "").trim();
  if (!raw || raw.length > 500 || /\s/.test(raw)) return "";
  let u: URL;
  try { u = new URL(raw); } catch { return ""; }
  if (u.protocol !== "https:" || u.username || u.password) return "";
  const h = u.hostname;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(h) || /^\d+(\.\d+){3}$/.test(h) || /\.(local|internal|localhost)$/i.test(h)) return "";
  return u.toString();
}
export function validSocials(list: SocialLink[]) {
  const seen = new Set<string>();
  return (list || []).map((x) => ({ ...x, href: parseSocialUrl(x.url) })).filter((x) => { if (!x.href || seen.has(x.href)) return false; seen.add(x.href); return true; });
}
