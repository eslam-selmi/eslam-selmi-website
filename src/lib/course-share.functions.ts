/** DRAFT server functions for course share links. Not used by any route; store is the service-role draft. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createShareLink, viewShareLink, startShareLink, reportShareProgress, revokeShareLink, listShareLinks, openShareCourse } from "./course-share-service";
import { supabaseShareStore as store } from "./course-share-store.server";

const tokenOk = (t: unknown): string => {
  if (typeof t !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(t)) throw new Error("bad token");
  return t;
};

export const createCourseShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { courseId: string; expiresAt?: string | null; autoClose?: boolean; bindFirst?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !isAdmin) throw new Error("forbidden");
    return createShareLink(store, { ...data, adminId: context.userId });
  });

export const revokeCourseShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("forbidden");
    await revokeShareLink(store, data.id);
    return { ok: true as const };
  });

export const viewCourseShare = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; claim: string | null }) => ({ token: tokenOk(d.token), claim: d.claim }))
  .handler(async ({ data }) => viewShareLink(store, data.token, data.claim));

export const startCourseShare = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; claim: string | null }) => ({ token: tokenOk(d.token), claim: d.claim }))
  .handler(async ({ data }) => startShareLink(store, data.token, data.claim));

export const reportCourseShareProgress = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; claim: string | null; progress: Record<string, unknown> }) => ({ token: tokenOk(d.token), claim: d.claim, progress: d.progress }))
  .handler(async ({ data }) => reportShareProgress(store, data.token, data.claim, data.progress as never));

export const listCourseShareLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("forbidden");
    return listShareLinks(store);
  });

export const openCourseShare = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; claim: string | null }) => ({ token: tokenOk(d.token), claim: d.claim }))
  .handler(async ({ data }) => openShareCourse(store, data.token, data.claim));
