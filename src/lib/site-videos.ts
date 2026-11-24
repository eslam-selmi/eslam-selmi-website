import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SITE_VIDEOS_KEY = "site.videos";
export type SiteVideo = { key: string; titleAr: string; titleEn: string; descAr: string; descEn: string; url: string; poster: string; visible: boolean };
export type VideosConfig = { eyebrowAr: string; eyebrowEn: string; titleAr: string; titleEn: string; videos: SiteVideo[] };
export const DEFAULT_VIDEOS: VideosConfig = { eyebrowAr: "من القاعة", eyebrowEn: "From the room", titleAr: "مقاطع من التدريب والاستشارات", titleEn: "Clips from training and consulting", videos: [] };
const text = (v: unknown) => typeof v === "string" ? v.trim() : "";
export function parseVideos(value: unknown): VideosConfig {
  if (!value || typeof value !== "object") return DEFAULT_VIDEOS;
  const raw = value as Record<string, unknown>;
  const videos = Array.isArray(raw["videos"]) ? raw["videos"].flatMap((item, i): SiteVideo[] => {
    if (!item || typeof item !== "object") return [];
    const v = item as Record<string, unknown>, url = text(v["url"]);
    if (!url) return [];
    const titleAr = text(v["titleAr"]);
    return [{ key: text(v["key"]) || `video-${i}`, titleAr, titleEn: text(v["titleEn"]) || titleAr, descAr: text(v["descAr"]), descEn: text(v["descEn"]) || text(v["descAr"]), url, poster: text(v["poster"]), visible: v["visible"] !== false }];
  }) : [];
  return { eyebrowAr: text(raw["eyebrowAr"]) || DEFAULT_VIDEOS.eyebrowAr, eyebrowEn: text(raw["eyebrowEn"]) || DEFAULT_VIDEOS.eyebrowEn, titleAr: text(raw["titleAr"]) || DEFAULT_VIDEOS.titleAr, titleEn: text(raw["titleEn"]) || DEFAULT_VIDEOS.titleEn, videos };
}
export const siteVideosOptions = queryOptions({ queryKey: ["site-videos"], staleTime: 30_000, queryFn: async () => {
  const { data, error } = await supabase.from("site_content").select("content").eq("section_key", SITE_VIDEOS_KEY).maybeSingle();
  if (error) throw error;
  return parseVideos(data?.content);
} });
export const useSiteVideos = () => useQuery(siteVideosOptions);
