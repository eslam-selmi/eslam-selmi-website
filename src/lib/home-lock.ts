import { supabase } from "@/integrations/supabase/client";

/** Homepage lock setting, stored in the existing site_content table (no schema change). Default: unlocked. */
export const HOME_LOCK_KEY = "site.home_lock";

export type HomeLockConfig = { enabled: boolean; message_ar: string; message_en: string };

export function parseHomeLock(content: unknown): HomeLockConfig {
  const c = content && typeof content === "object" && !Array.isArray(content) ? (content as Record<string, unknown>) : {};
  const s = (v: unknown) => (typeof v === "string" ? v.slice(0, 500) : "");
  return { enabled: c.enabled === true, message_ar: s(c.message_ar), message_en: s(c.message_en) };
}

/** What the homepage shows a given person. Pure, so it is unit-tested. "unknown" = keep the page hidden. */
export function homeLockDecision(opts: { pathname: string; config: HomeLockConfig | null | "failed"; session: "unknown" | "none" | "user"; isAdmin: boolean | null }): "show" | "hide" | "to-portal" | "locked-visitor" {
  if (opts.pathname !== "/") return "show";
  if (opts.config === null) return "hide"; // not read yet: never flash the homepage
  if (opts.config !== "failed" && !opts.config.enabled) return "show";
  // locked, or the setting could not be read (fail closed, like maintenance)
  if (opts.session === "unknown") return "hide";
  if (opts.session === "none") return "locked-visitor";
  if (opts.isAdmin === null) return "hide";
  return opts.isAdmin ? "show" : "to-portal";
}
