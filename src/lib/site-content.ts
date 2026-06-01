import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteContentRow = {
  id: string;
  section_key: string;
  label: string | null;
  content: Record<string, any>;
  is_visible: boolean;
  updated_at: string;
};

type Cache = {
  rows: SiteContentRow[];
  loaded: boolean;
  loading: Promise<void> | null;
  listeners: Set<() => void>;
};

const cache: Cache = { rows: [], loaded: false, loading: null, listeners: new Set() };

async function load() {
  if (cache.loading) return cache.loading;
  cache.loading = (async () => {
    const { data } = await supabase.from("site_content").select("*");
    cache.rows = (data as SiteContentRow[]) || [];
    cache.loaded = true;
    cache.loading = null;
    cache.listeners.forEach((l) => l());
  })();
  return cache.loading;
}

export function invalidateSiteContent() {
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
    const row = cache.rows.find((r) => r.section_key === key);
    if (!row) return defaultVisible;
    return row.is_visible;
  };
  return { get, isVisible, loaded: cache.loaded };
}
