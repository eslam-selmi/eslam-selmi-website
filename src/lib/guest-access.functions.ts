/** DRAFT server functions for the guest login. Admin ones check the admin role; guest ones check the guest flag. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createGuest, resetGuestPassword, setGuestEnabled, guestSummary, isEnabledGuest, guestCourses, guestOpenCourse } from "./guest-access-service";
import { supabaseGuestStore as store } from "./guest-access-store.server";

async function needAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("forbidden");
}

export const getGuestAccount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => { await needAdmin(context); return guestSummary(store); });

export const createGuestAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => ({ email: String(d.email ?? "") }))
  .handler(async ({ data, context }) => { await needAdmin(context); return createGuest(store, context.userId, data.email); });

export const resetGuestAccountPassword = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => { await needAdmin(context); return resetGuestPassword(store); });

export const setGuestAccountEnabled = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { enabled: boolean }) => ({ enabled: !!d.enabled }))
  .handler(async ({ data, context }) => { await needAdmin(context); return setGuestEnabled(store, data.enabled); });

/** Used by the login redirect: is the signed-in user the enabled guest? */
export const amIGuest = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ guest: await isEnabledGuest(store, context.userId) }));

export const listGuestCourses = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guestCourses(store, context.userId));

export const openGuestCourse = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { courseId: string }) => ({ courseId: String(d.courseId ?? "") }))
  .handler(async ({ data, context }) => guestOpenCourse(store, context.userId, data.courseId));
