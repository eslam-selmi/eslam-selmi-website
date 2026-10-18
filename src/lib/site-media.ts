import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SiteMedia } from "./site-media-data";

export const siteMediaKey = ["site-media"];
export const siteMediaOptions = queryOptions({
  queryKey: siteMediaKey,
  staleTime: 60_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("site_content").select("id,content").eq("section_key", "site.media").maybeSingle();
    if (error) throw error;
    const media: SiteMedia = {};
    if (data?.content && typeof data.content === "object" && !Array.isArray(data.content)) {
      for (const [key, value] of Object.entries(data.content)) if (typeof value === "string") media[key] = value;
    }
    return { id: data?.id, media };
  },
});
export function useSiteMedia() { return useQuery(siteMediaOptions); }