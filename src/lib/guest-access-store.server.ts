/** DRAFT service-role store for guest-access-service. The guest_access table does not exist until the reviewed SQL is applied. */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { GuestStore } from "./guest-access-service";
import { supabaseShareStore } from "./course-share-store.server";

type Loose = { from: (t: string) => any };
const db = () => supabaseAdmin as unknown as Loose;

export const supabaseGuestStore: GuestStore = {
  async getGuest() {
    const { data, error } = await db().from("guest_access").select("user_id,email,enabled").limit(1).maybeSingle();
    if (error) throw new Error("guest lookup failed");
    return data ?? null;
  },
  async createGuestUser(email, password, adminId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { guest: true } });
    if (error || !data.user) throw new Error("guest create failed");
    const id = data.user.id;
    // The signup trigger gives every new user the trainee role; the guest keeps no role at all.
    await db().from("user_roles").delete().eq("user_id", id);
    // Mark the profile active so the portal does not send the guest to onboarding.
    await db().from("profiles").update({ activation_status: "active", activated_at: new Date().toISOString() }).eq("id", id);
    const { error: e2 } = await db().from("guest_access").insert({ user_id: id, email, enabled: true, created_by: adminId });
    if (e2) { await supabaseAdmin.auth.admin.deleteUser(id); throw new Error("guest create failed"); }
    return id;
  },
  async setPassword(userId, password) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (error) throw new Error("guest password failed");
  },
  async setEnabled(userId, enabled) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: enabled ? "none" : "876000h" });
    if (error) throw new Error("guest toggle failed");
    const { error: e2 } = await db().from("guest_access").update({ enabled, updated_at: new Date().toISOString() }).eq("user_id", userId);
    if (e2) throw new Error("guest toggle failed");
  },
  async listActiveCourses() {
    const { data, error } = await db().from("courses").select("id,title,description").eq("active", true).eq("is_archived", false).order("title");
    if (error) throw new Error("guest courses failed");
    return ((data as any[]) ?? []).map((c) => ({ id: c.id, title: c.title ?? "", description: c.description ?? "" }));
  },
  loadCourseContent: (id) => supabaseShareStore.loadCourseContent(id),
};
