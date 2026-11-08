import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BUILD_EFFECTS_KEY = "site.effects";
export function buildEffectsEnabled(content: unknown): boolean {
  return !(typeof content === "object" && content !== null && "build_enabled" in content && content.build_enabled === false);
}
export const buildEffectsOptions = queryOptions({
  queryKey: ["site-effects"],
  staleTime: 30_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("site_content").select("content").eq("section_key", BUILD_EFFECTS_KEY).maybeSingle();
    if (error) throw error;
    return buildEffectsEnabled(data?.content);
  },
});
export function useBuildEffects() {
  const query = useQuery(buildEffectsOptions);
  return { enabled: query.data === true, ...query };
}