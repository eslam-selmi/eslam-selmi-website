import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side check: verifies the caller is an authenticated admin via
 * Supabase RLS-aware has_role(). Throws on non-admins so route loaders
 * can redirect before any admin UI is served.
 */
export const assertAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (error) throw new Error("role check failed");
    if (!data) throw new Error("forbidden");
    return { ok: true as const };
  });
