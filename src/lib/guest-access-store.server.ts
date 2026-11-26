/** Service-role store for guest-access-service. Only server functions touch these tables. No auth.users involved. */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireUpdated, type GuestStore } from "./guest-access-service";
import { supabaseShareStore } from "./course-share-store.server";

type Loose = { from: (t: string) => any; rpc: (f: string, a: object) => Promise<{ error: unknown }> };
const db = () => supabaseAdmin as unknown as Loose;
const COLS = "id,email,name,password_hash,version,enabled,failed_count,locked_until";
const courseOk = (q: any) => q.eq("active", true).eq("is_archived", false).eq("is_upcoming", false);

export const supabaseGuestStore: GuestStore = {
  async getGuest(id) {
    const { data, error } = await db().from("guest_access").select(COLS).eq("id", id).maybeSingle();
    if (error) throw new Error("guest lookup failed");
    return data ?? null;
  },
  async getGuestByEmail(email) {
    const { data, error } = await db().from("guest_access").select(COLS).eq("email", email).maybeSingle();
    if (error) throw new Error("guest lookup failed");
    return data ?? null;
  },
  async listGuests() {
    const { data, error } = await db().from("guest_access").select(COLS).order("created_at");
    if (error) throw new Error("guest list failed");
    const { data: links, error: e2 } = await db().from("guest_course_access").select("guest_id,course_id");
    if (e2) throw new Error("guest list failed");
    const by = new Map<string, string[]>();
    for (const l of (links as any[]) ?? []) by.set(l.guest_id, [...(by.get(l.guest_id) ?? []), l.course_id]);
    return ((data as any[]) ?? []).map((g) => ({ ...g, course_ids: by.get(g.id) ?? [] }));
  },
  async create(email, name, passwordHash, adminId) {
    const { data, error } = await db().from("guest_access").insert({ email, name, password_hash: passwordHash, created_by: adminId }).select("id").single();
    if (error || !data) throw new Error("guest create failed");
    return data.id as string;
  },
  async setPassword(id, passwordHash) {
    const g = await this.getGuest(id); if (!g) throw new Error("no guest");
    const { data, error } = await db().from("guest_access").update({ password_hash: passwordHash, version: g.version + 1, failed_count: 0, locked_until: null, updated_at: new Date().toISOString() }).eq("id", id).eq("version", g.version).select("id");
    if (error) throw new Error("guest password failed");
    requireUpdated(data, "password reset");
  },
  async setEnabled(id, enabled) {
    const g = await this.getGuest(id); if (!g) throw new Error("no guest");
    const { data, error } = await db().from("guest_access").update({ enabled, version: g.version + 1, updated_at: new Date().toISOString() }).eq("id", id).eq("version", g.version).select("id");
    if (error) throw new Error("guest toggle failed");
    requireUpdated(data, "toggle");
  },
  async setCourses(id, courseIds) {
    const { error: d } = await db().from("guest_course_access").delete().eq("guest_id", id);
    if (d) throw new Error("guest courses failed");
    if (courseIds.length) {
      const { error } = await db().from("guest_course_access").insert(courseIds.map((c) => ({ guest_id: id, course_id: c })));
      if (error) throw new Error("guest courses failed");
    }
  },
  async remove(id) {
    const { error } = await db().from("guest_access").delete().eq("id", id);
    if (error) throw new Error("guest delete failed");
  },
  async recordFailure(id, max, lockMs) {
    const res = await db().rpc("guest_record_failure", { _id: id, _max: max, _lock_seconds: Math.round(lockMs / 1000) });
    // fail closed: a failing counter must not silently turn the lock off
    if (res?.error) { console.error("guest lock counter failed"); throw new Error("guest lock unavailable"); }
  },
  async clearFailures(id) {
    await db().from("guest_access").update({ failed_count: 0, locked_until: null }).eq("id", id);
  },
  async listCoursesFor(id) {
    const { data: links, error: e1 } = await db().from("guest_course_access").select("course_id").eq("guest_id", id);
    if (e1) throw new Error("guest courses failed");
    const ids = ((links as any[]) ?? []).map((l) => l.course_id);
    if (!ids.length) return [];
    const { data, error } = await courseOk(db().from("courses").select("id,title,description").in("id", ids)).order("title");
    if (error) throw new Error("guest courses failed");
    return ((data as any[]) ?? []).map((c) => ({ id: c.id, title: c.title ?? "", description: c.description ?? "" }));
  },
  async listAssignableCourses() {
    const { data, error } = await db().from("courses").select("id,title,description").eq("is_archived", false).order("title");
    if (error) throw new Error("guest courses failed");
    return ((data as any[]) ?? []).map((c) => ({ id: c.id, title: c.title ?? "", description: c.description ?? "" }));
  },
  loadCourseContent: (id) => supabaseShareStore.loadCourseContent(id),
};
