import headshotAsset from "@/assets/portfolio/headshot-cutout.png.asset.json";
import logoAsset from "@/assets/brand-logo.webp.asset.json";
import type { Tables } from "@/integrations/supabase/types";

export type SiteProfileRow = Pick<Tables<"site_content">, "id" | "content">;
export type SiteProfile = {
  logo: string;
  portrait: string;
  phone: string;
  secondary_phone: string;
  email: string;
  linkedin: string;
  footer_ar: string;
  footer_en: string;
};
export const siteProfileDefaults: SiteProfile = {
  logo: logoAsset.url,
  portrait: headshotAsset.url,
  phone: "+966 555 376 228",
  secondary_phone: "+20 10 9727 9900",
  email: "eslam.m.selmi@gmail.com",
  linkedin: "https://www.linkedin.com/in/eslam-selmi/",
  footer_ar: "",
  footer_en: "",
};
export function readSiteProfile(content: SiteProfileRow["content"]): SiteProfile {
  const result = { ...siteProfileDefaults };
  if (content && typeof content === "object" && !Array.isArray(content)) {
    for (const key of Object.keys(result) as (keyof SiteProfile)[]) {
      const value = content[key];
      if (typeof value === "string") result[key] = value;
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
    linkedin: /^https:\/\/(www\.)?linkedin\.com\//i.test(profile.linkedin) ? profile.linkedin : siteProfileDefaults.linkedin,
  };
}