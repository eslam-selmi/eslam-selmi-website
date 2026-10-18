import training from "@/assets/program-training.jpg";
import talent from "@/assets/program-talent.jpg";
import skills from "@/assets/program-skills.jpg";
import consultation from "@/assets/consultation-banner.jpg";

export const programMedia = [
  { key: "training", ar: "إدارة التدريب والتطوير", en: "Training & Development Programs", image: training },
  { key: "talent", ar: "إدارة المواهب", en: "Talent Management", image: talent },
  { key: "skills", ar: "إدارة المهارات الناعمة", en: "Soft Skills Management", image: skills },
] as const;
export const consultationImage = consultation;
export type SiteMedia = Record<string, string>;
export function mediaImage(media: SiteMedia, key: string, fallback: string) {
  return media[key]?.trim() || fallback;
}
export function courseImage(media: SiteMedia, id: string, title: string) {
  const fallback = /talent|recruit|مواهب|توظيف/i.test(title) ? talent
    : /soft|leadership|communication|قياد|تواصل|ناعمة/i.test(title) ? skills : training;
  return mediaImage(media, `course:${id}`, fallback);
}