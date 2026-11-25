/** DRAFT service-role store for guest-access-service. The guest_access table does not exist until the reviewed SQL is applied. No auth.users involved. */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { GuestStore } from "./guest-access-service";
import { supabaseShareStore } from "./course-share-store.server";

type Loose = { from: (t: string) => any };
const db = () => supabaseAdmin as unknown as Loose;
const COLS = "id,email,password_hash,version,enabled,failed_count,locked_until";

export const supabaseGuestStore: GuestStore = {
  async getGuest() {
    const { data, error } = await db().from("guest_access").select(COLS).limit(1).maybeSingle();
    if (error) throw new Error("guest lookup failed");
    return data ?? null;
  },
  async create(email, passwordHash, adminId) {
    const { error } = await db().from("guest_access").insert({ email, password_hash: passwordHash, created_by: adminId });
    if (error) throw new Error("guest create failed");
  },
  async setPassword(passwordHash) {
    const g = await this.getGuest(); if (!g) throw new Error("no guest");
    // one statement: new hash, version + 1, failures cleared
    const { error } = await db().from("guest_access").update({ password_hash: passwordHash, version: g.version + 1, failed_count: 0, locked_until: null, updated_at: new Date().toISOString() }).eq("id", g.id).eq("version", g.version);
    if (error) throw new Error("guest password failed");
  },
  async setEnabled(enabled) {
    const g = await this.getGuest(); if (!g) throw new Error("no guest");
    const { error } = await db().from("guest_access").update({ enabled, version: g.version + 1, updated_at: new Date().toISOString() }).eq("id", g.id).eq("version", g.version);
    if (error) throw new Error("guest toggle failed");
  },
  async recordFailure(max, lockMs) {
    // atomic in SQL (guest_record_failure); a read-modify-write here would lose parallel failures
    await (supabaseAdmin as unknown as { rpc: (f: string, a: object) => Promise<unknown> }).rpc("guest_record_failure", { _max: max, _lock_seconds: Math.round(lockMs / 1000) });
  },
  async clearFailures() {
    await db().from("guest_access").update({ failed_count: 0, locked_until: null }).not("id", "is", null);
  },
  async listActiveCourses() {
    // active, not archived, not "coming soon": paid courses are included
    const { data, error } = await db().from("courses").select("id,title,description").eq("active", true).eq("is_archived", false).eq("is_upcoming", false).order("title");
    if (error) throw new Error("guest courses failed");
    return ((data as any[]) ?? []).map((c) => ({ id: c.id, title: c.title ?? "", description: c.description ?? "" }));
  },
  loadCourseContent: (id) => supabaseShareStore.loadCourseContent(id),
};
