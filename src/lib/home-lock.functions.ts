import { createServerFn } from "@tanstack/react-start";
import { HOME_LOCK_KEY, parseHomeLock, type HomeLockConfig } from "@/lib/home-lock";

export type HomeLockLoad = { ok: true; config: HomeLockConfig } | { ok: false };

/** Reads the homepage-lock setting on the server with the public (anon) key, same visibility any visitor already has.
 *  Used by the "/" loader so the server-rendered HTML is already the locked screen or the full homepage. The same HTML is served to everyone (no per-user content). */
export const getHomeLock = createServerFn({ method: "GET" }).handler(async (): Promise<HomeLockLoad> => {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { ok: false };
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.from("site_content").select("content").eq("section_key", HOME_LOCK_KEY).maybeSingle();
    if (error) return { ok: false };
    return { ok: true, config: parseHomeLock((data as { content?: unknown } | null)?.content ?? null) };
  } catch {
    return { ok: false };
  }
});
