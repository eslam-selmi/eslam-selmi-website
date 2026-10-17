import { useEffect, useState } from "react";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type SiteContentRow = Omit<Tables<"site_content">, "content"> & {
  content: Record<string, any>;
};

type Cache = {
  rows: SiteContentRow[];
  visibility: Map<string, boolean>;
  loaded: boolean;
  loading: Promise<void> | null;
  listeners: Set<() => void>;
};

const cache: Cache = { rows: [], visibility: new Map(), loaded: false, loading: null, listeners: new Set() };
const contentQueryClient = new QueryClient();
const contentOptions = queryOptions({
  queryKey: ["site-content", "visible-content-and-section-flags"],
  staleTime: 60_000,
  queryFn: async () => {
    const [content, visibility] = await Promise.all([
      supabase.from("site_content").select("*"),
      supabase.rpc("get_public_site_visibility"),
    ]);
    if (content.error) throw content.error;
    if (visibility.error) throw visibility.error;
    return { rows: content.data as SiteContentRow[], visibility: visibility.data };
  },
});

async function load() {
  if (cache.loading) return cache.loading;
  cache.loading = (async () => {
    const data = await contentQueryClient.fetchQuery(contentOptions);
    cache.rows = data.rows;
    cache.visibility = new Map(data.visibility.map((row) => [row.section_key, row.is_visible]));
    cache.loaded = true;
    cache.loading = null;
    cache.listeners.forEach((l) => l());
  })();
  return cache.loading;
}

export function invalidateSiteContent() {
  void contentQueryClient.invalidateQueries({ queryKey: contentOptions.queryKey });
  cache.loaded = false;
  cache.rows = [];
  cache.loading = null;
  load();
}

/** Hook returning a getter for editable content + visibility. */
export function useSiteContent() {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!cache.loaded) load();
    const fn = () => setTick((n) => n + 1);
    cache.listeners.add(fn);
    return () => { cache.listeners.delete(fn); };
  }, []);

  const get = <T = Record<string, any>>(key: string, fallback: T): T => {
    const row = cache.rows.find((r) => r.section_key === key);
    if (!row || !row.content || Object.keys(row.content).length === 0) return fallback;
    return { ...(fallback as any), ...row.content } as T;
  };
  const isVisible = (key: string, defaultVisible = true): boolean => {
    return cache.visibility.get(key) ?? defaultVisible;
  };
  return { get, isVisible, loaded: cache.loaded };
}
