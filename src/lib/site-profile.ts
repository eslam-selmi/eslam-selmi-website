import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { profileLinks, readSiteProfile } from "./site-profile-data";

export const siteProfileKey = ["site", "profile"] as const;
export function useSiteProfile() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: siteProfileKey,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("id, content").eq("section_key", "site.profile").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    const channel = supabase.channel(`site-profile-${crypto.randomUUID()}`).on("postgres_changes", { event: "*", schema: "public", table: "site_content", filter: "section_key=eq.site.profile" }, () => { void client.invalidateQueries({ queryKey: siteProfileKey }); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [client]);
  const profile = readSiteProfile(query.data?.content ?? null);
  return { ...query, profile, links: profileLinks(profile) };
}