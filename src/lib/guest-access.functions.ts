/** DRAFT server functions for the guest login. Admin ones check the admin role; guest ones check a signed server cookie. The guest has no database session. */
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createHmac } from "node:crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createGuest, resetGuestPassword, setGuestEnabled, setGuestCourses, removeGuest, guestSummary, guestLogin, guestCourses, guestOpenCourse, sessionValid, SESSION_TTL_MS } from "./guest-access-service";
import { supabaseGuestStore as store } from "./guest-access-store.server";

const COOKIE = "guest_session";
/** Derived from the existing server key; no new secret to manage. Changing the key logs every guest out. */
const secret = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("guest session key is missing");
  return createHmac("sha256", key).update("guest-session-v1").digest("hex");
};

async function needAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("forbidden");
}

export const getGuestAccount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => { await needAdmin(context); return guestSummary(store); });
const uuid = (v: unknown) => { const x = String(v ?? ""); if (!/^[0-9a-f-]{36}$/i.test(x)) throw new Error("bad id"); return x; };
const uuids = (v: unknown) => (Array.isArray(v) ? v.slice(0, 200).map(uuid) : []);
export const createGuestAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; name?: string; courseIds?: string[] }) => ({ email: String(d.email ?? ""), name: String(d.name ?? "").slice(0, 80), courseIds: uuids(d.courseIds) }))
  .handler(async ({ data, context }) => { await needAdmin(context); return createGuest(store, context.userId, data.email, data.name, data.courseIds); });
export const resetGuestAccountPassword = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: uuid(d.id) }))
  .handler(async ({ data, context }) => { await needAdmin(context); return resetGuestPassword(store, data.id); });
export const setGuestAccountEnabled = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; enabled: boolean }) => ({ id: uuid(d.id), enabled: !!d.enabled }))
  .handler(async ({ data, context }) => { await needAdmin(context); return setGuestEnabled(store, data.id, data.enabled); });
export const setGuestAccountCourses = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; courseIds: string[] }) => ({ id: uuid(d.id), courseIds: uuids(d.courseIds) }))
  .handler(async ({ data, context }) => { await needAdmin(context); return setGuestCourses(store, data.id, data.courseIds); });
export const removeGuestAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: uuid(d.id) }))
  .handler(async ({ data, context }) => { await needAdmin(context); return removeGuest(store, data.id); });

export const guestSignIn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => ({ email: String(d.email ?? "").slice(0, 254), password: String(d.password ?? "").slice(0, 200) }))
  .handler(async ({ data }) => {
    const r = await guestLogin(store, data.email, data.password, secret());
    if (!r.ok) return { ok: false as const, reason: r.reason };
    setCookie(COOKIE, r.token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: Math.floor(SESSION_TTL_MS / 1000) });
    return { ok: true as const };
  });
export const guestSignOut = createServerFn({ method: "POST" }).handler(async () => { deleteCookie(COOKIE, { path: "/" }); return { ok: true as const }; });
export const amIGuest = createServerFn({ method: "GET" }).handler(async () => ({ guest: await sessionValid(store, getCookie(COOKIE), secret()) }));
export const listGuestCourses = createServerFn({ method: "GET" }).handler(async () => guestCourses(store, getCookie(COOKIE), secret()));
export const openGuestCourse = createServerFn({ method: "POST" })
  .inputValidator((d: { courseId: string }) => ({ courseId: String(d.courseId ?? "") }))
  .handler(async ({ data }) => guestOpenCourse(store, getCookie(COOKIE), secret(), data.courseId));
