import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!data?.some((r) => r.role === "admin")) throw new Error("Forbidden: admin only");
}

const CreateInput = z.object({
  email: z.string().email().max(320),
  full_name: z.string().min(2).max(120),
  password: z.string().min(8).max(128),
  course_ids: z.array(z.string().uuid()).min(1).max(50),
});

/** Admin creates an email/password account tied to one course. Same kind of account as a normal trainee, flagged course-only. */
export const createCourseOnlyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => CreateInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const email = data.email.trim().toLowerCase();
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: data.password, email_confirm: true, user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message || "Failed to create user");
    const uid = created.user.id;
    // The profile guard trigger only lets an admin session change activation and password-reset flags, so this runs as the signed-in admin, not the service role.
    const { error: pErr } = await context.supabase.from("profiles").update({
      full_name: data.full_name, force_password_reset: true, activation_status: "active",
    }).eq("id", uid);
    if (pErr) {
      await supabaseAdmin.auth.admin.deleteUser(uid).catch(() => {});
      throw new Error(pErr.message);
    }
    const { error: fErr } = await (supabaseAdmin as any).from("course_only_accounts").insert({ user_id: uid, created_by: context.userId });
    if (fErr) throw new Error(fErr.message);
    const { error: eErr } = await supabaseAdmin.from("enrollments").insert(
      [...new Set(data.course_ids)].map((course_id) => ({ user_id: uid, course_id, status: "approved" })),
    );
    if (eErr) throw new Error(eErr.message);
    return { ok: true, user_id: uid };
  });

export const listCourseOnlyAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: flags, error } = await (supabaseAdmin as any).from("course_only_accounts").select("user_id,created_at");
    if (error) throw new Error(error.message);
    const ids: string[] = ((flags ?? []) as any[]).map((f: any) => f.user_id);
    if (!ids.length) return [];
    const [{ data: profs }, { data: enr }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,email,full_name").in("id", ids),
      supabaseAdmin.from("enrollments").select("user_id,course_id,status,blocked,courses(title)").in("user_id", ids),
    ]);
    return ids.map((id: string) => ({
      user_id: id,
      email: profs?.find((p) => p.id === id)?.email ?? "",
      full_name: profs?.find((p) => p.id === id)?.full_name ?? "",
      courses: (enr ?? []).filter((e: any) => e.user_id === id && !e.blocked && e.status === "approved").map((e: any) => ({ id: e.course_id, title: e.courses?.title ?? "", status: e.status })),
    }));
  });

/** Same account becomes a regular trainee: only the course-only flag is removed. Enrollments and progress stay. */
export const convertCourseOnlyToFull = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await (supabaseAdmin as any).from("course_only_accounts").delete().eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Set the exact list of courses a course-only account can open. Removing a course blocks that enrollment (progress is kept); re-adding unblocks it. */
export const setCourseOnlyCourses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid(), course_ids: z.array(z.string().uuid()).min(1).max(50) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: flag } = await (supabaseAdmin as any).from("course_only_accounts").select("user_id").eq("user_id", data.user_id).maybeSingle();
    if (!flag) throw new Error("not a course-only account");
    const want = new Set(data.course_ids);
    const { data: ex, error } = await supabaseAdmin.from("enrollments").select("id,course_id,blocked,status").eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    const have = new Map((ex ?? []).map((e: any) => [e.course_id as string, e]));
    for (const cid of want) {
      const e: any = have.get(cid);
      if (!e) {
        const { error: iErr } = await supabaseAdmin.from("enrollments").insert({ user_id: data.user_id, course_id: cid, status: "approved" });
        if (iErr) throw new Error(iErr.message);
      } else if (e.blocked || e.status !== "approved") {
        const { error: uErr } = await supabaseAdmin.from("enrollments").update({ blocked: false, status: "approved" }).eq("id", e.id);
        if (uErr) throw new Error(uErr.message);
      }
    }
    for (const [cid, e] of have as Map<string, any>) {
      if (!want.has(cid) && !e.blocked) {
        const { error: bErr } = await supabaseAdmin.from("enrollments").update({ blocked: true }).eq("id", e.id);
        if (bErr) throw new Error(bErr.message);
      }
    }
    return { ok: true };
  });
