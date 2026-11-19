import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PROGRAMS } from "@/components/home/data";
import { programMedia } from "./site-media-data";

export const SITE_PROGRAMS_KEY = "site.programs";
export type ProgramModule = { nameAr: string; nameEn: string; descAr: string; descEn: string };
export type ProgramTrack = { key: string; titleAr: string; titleEn: string; introAr: string; introEn: string; image: string; modules: ProgramModule[] };

export const DEFAULT_PROGRAM_TRACKS: ProgramTrack[] = PROGRAMS.map((p, i) => ({
  key: programMedia[i]?.key ?? `track-${i}`,
  titleAr: p.track.ar, titleEn: p.track.en, introAr: p.intro.ar, introEn: p.intro.en, image: "",
  modules: p.items.map((it) => ({ nameAr: it.name.ar, nameEn: it.name.en, descAr: it.desc.ar, descEn: it.desc.en })),
}));

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function parseProgramTracks(content: unknown): ProgramTrack[] {
  const list = (content as { tracks?: unknown })?.tracks;
  if (!Array.isArray(list)) return DEFAULT_PROGRAM_TRACKS;
  return list.filter((x) => x && typeof x === "object").map((raw, i) => {
    const x = raw as Record<string, unknown>;
    const mods = Array.isArray(x.modules) ? x.modules : [];
    return {
      key: str(x.key) || `track-${i}`,
      titleAr: str(x.titleAr), titleEn: str(x.titleEn) || str(x.titleAr),
      introAr: str(x.introAr), introEn: str(x.introEn) || str(x.introAr),
      image: str(x.image),
      modules: mods.filter((m) => m && typeof m === "object").map((m) => {
        const r = m as Record<string, unknown>;
        return { nameAr: str(r.nameAr), nameEn: str(r.nameEn) || str(r.nameAr), descAr: str(r.descAr), descEn: str(r.descEn) || str(r.descAr) };
      }).filter((m) => m.nameAr || m.nameEn),
    };
  }).filter((t) => t.titleAr || t.titleEn);
}

export const siteProgramsOptions = queryOptions({
  queryKey: ["site-programs"],
  staleTime: 30_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("site_content").select("content").eq("section_key", SITE_PROGRAMS_KEY).maybeSingle();
    if (error) throw error;
    return parseProgramTracks(data?.content);
  },
});
export const useSitePrograms = () => useQuery(siteProgramsOptions);
