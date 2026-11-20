import { queryOptions, useQuery } from "@tanstack/react-query";
import { UserCheck, TrendingUp, BarChart3, Target, Layers, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const SITE_PILLARS_KEY = "site.pillars";
export const pillarIcons = { talent: UserCheck, performance: TrendingUp, metrics: BarChart3, strategy: Target, training: Layers, design: Lightbulb };
export type PillarIcon = keyof typeof pillarIcons;
export type Pillar = { key: string; titleAr: string; titleEn: string; descAr: string; descEn: string; icon: PillarIcon; visible: boolean };
export type PillarsConfig = { eyebrowAr: string; eyebrowEn: string; titleAr: string; titleEn: string; pillars: Pillar[] };
export const DEFAULT_PILLARS: PillarsConfig = {
  eyebrowAr: "ثلاث ركائز", eyebrowEn: "Three pillars", titleAr: "المواهب · الأداء · المؤشرات", titleEn: "Talent · Performance · KPIs",
  pillars: [
    { key: "talent", titleAr: "إدارة المواهب", titleEn: "Talent Management", descAr: "تصميم وتنفيذ برامج التدريب والتطوير، تخطيط التعاقب الوظيفي، رسم خرائط الجدارات، هندسة استقطاب الكفاءات، تحديد المواهب الواعدة، واستراتيجيات استبقاء الموظفين.", descEn: "Succession planning, workforce capability mapping, talent acquisition architecture, high-potential (HiPo) identification, and employee retention strategies.", icon: "talent", visible: true },
    { key: "perf", titleAr: "إدارة الأداء", titleEn: "Performance Management", descAr: "أطر التغذية الراجعة المستمرة، تحديث نظم تقييم الأداء، مواءمة الأهداف المؤسسية، وتطوير السلوكيات الوظيفية.", descEn: "Continuous feedback frameworks, appraisal system modernization, performance alignment, and structural workplace behavioral optimization.", icon: "performance", visible: true },
    { key: "kpi", titleAr: "مؤشرات الأداء الرئيسية (KPIs)", titleEn: "Key Performance Indicators (KPIs)", descAr: "تصميم بطاقات الأداء المتوازن، هندسة المقاييس الكمية، بناء لوحات قياس الأداء، ومواءمة برامج التعلم بقرارات قائمة على البيانات وقياس العائد على الاستثمار.", descEn: "Balanced scorecard design, quantitative metrics engineering, performance dashboarding, data-driven L&D alignment, and ROI measurement.", icon: "metrics", visible: true },
  ],
};
const text = (v: unknown) => typeof v === "string" ? v.trim() : "";
export function parsePillars(value: unknown): PillarsConfig {
  if (!value || typeof value !== "object") return DEFAULT_PILLARS;
  const raw = value as Record<string, unknown>;
  const pillars = Array.isArray(raw["pillars"]) ? raw["pillars"].flatMap((item, i): Pillar[] => {
    if (!item || typeof item !== "object") return [];
    const p = item as Record<string, unknown>, icon = text(p["icon"]);
    const titleAr = text(p["titleAr"]), titleEn = text(p["titleEn"]) || titleAr;
    if (!titleAr && !titleEn) return [];
    return [{ key: text(p["key"]) || `pillar-${i}`, titleAr, titleEn, descAr: text(p["descAr"]), descEn: text(p["descEn"]) || text(p["descAr"]), icon: Object.hasOwn(pillarIcons, icon) ? icon as PillarIcon : "talent", visible: p["visible"] !== false }];
  }) : DEFAULT_PILLARS.pillars;
  return { eyebrowAr: text(raw["eyebrowAr"]), eyebrowEn: text(raw["eyebrowEn"]) || text(raw["eyebrowAr"]), titleAr: text(raw["titleAr"]), titleEn: text(raw["titleEn"]) || text(raw["titleAr"]), pillars };
}
export const sitePillarsOptions = queryOptions({ queryKey: ["site-pillars"], staleTime: 30_000, queryFn: async () => {
  const { data, error } = await supabase.from("site_content").select("content").eq("section_key", SITE_PILLARS_KEY).maybeSingle();
  if (error) throw error;
  return parsePillars(data?.content);
} });
export const useSitePillars = () => useQuery(sitePillarsOptions);