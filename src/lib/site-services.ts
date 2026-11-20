import { queryOptions, useQuery } from "@tanstack/react-query";
import { Target, Layers, Lightbulb, HeartHandshake, Briefcase, Users, Bot, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SERVICES } from "@/components/home/data";

export const SITE_SERVICES_KEY = "site.services";
export const serviceIcons = { strategy: Target, training: Layers, design: Lightbulb, coaching: HeartHandshake, business: Briefcase, people: Users, ai: Bot, education: GraduationCap };
export type ServiceIcon = keyof typeof serviceIcons;
export type Service = { key: string; titleAr: string; titleEn: string; descAr: string; descEn: string; icon: ServiceIcon; visible: boolean; price: number | null; currency: string; showPrice: boolean };
export type ServicesConfig = { titleAr: string; titleEn: string; subtitleAr: string; subtitleEn: string; pricingEnabled: boolean; services: Service[] };
const defaultIcons: ServiceIcon[] = ["strategy", "training", "design", "coaching"];
export const DEFAULT_SERVICES: ServicesConfig = {
  titleAr: "", titleEn: "", subtitleAr: "", subtitleEn: "", pricingEnabled: false,
  services: SERVICES.map((s, i) => ({ key: s.key, titleAr: s.title.ar, titleEn: s.title.en, descAr: s.desc.ar, descEn: s.desc.en, icon: defaultIcons[i] ?? "business", visible: true, price: null, currency: "EGP", showPrice: false })),
};
const text = (v: unknown) => typeof v === "string" ? v.trim() : "";
export function parseServices(value: unknown): ServicesConfig {
  if (!value || typeof value !== "object") return DEFAULT_SERVICES;
  const raw = value as Record<string, unknown>;
  const services = Array.isArray(raw["services"]) ? raw["services"].flatMap((v, i): Service[] => {
    if (!v || typeof v !== "object") return [];
    const s = v as Record<string, unknown>;
    const titleAr = text(s["titleAr"]), titleEn = text(s["titleEn"]) || titleAr;
    if (!titleAr && !titleEn) return [];
    const icon = text(s["icon"]);
    return [{ key: text(s["key"]) || `service-${i}`, titleAr, titleEn, descAr: text(s["descAr"]), descEn: text(s["descEn"]) || text(s["descAr"]), icon: Object.hasOwn(serviceIcons, icon) ? icon as ServiceIcon : "business", visible: s["visible"] !== false, price: typeof s["price"] === "number" && Number.isFinite(s["price"]) && s["price"] >= 0 ? s["price"] : null, currency: text(s["currency"]) || "EGP", showPrice: s["showPrice"] === true }];
  }) : DEFAULT_SERVICES.services;
  return { titleAr: text(raw["titleAr"]), titleEn: text(raw["titleEn"]) || text(raw["titleAr"]), subtitleAr: text(raw["subtitleAr"]), subtitleEn: text(raw["subtitleEn"]) || text(raw["subtitleAr"]), pricingEnabled: raw["pricingEnabled"] === true, services };
}
export function visibleServicePrice(config: ServicesConfig, service: Service): number | null {
  return config.pricingEnabled && service.showPrice && service.price !== null && Number.isFinite(service.price) && service.price >= 0 ? service.price : null;
}
export const siteServicesOptions = queryOptions({
  queryKey: ["site-services"], staleTime: 30_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("site_content").select("content").eq("section_key", SITE_SERVICES_KEY).maybeSingle();
    if (error) throw error;
    return parseServices(data?.content);
  },
});
export const useSiteServices = () => useQuery(siteServicesOptions);