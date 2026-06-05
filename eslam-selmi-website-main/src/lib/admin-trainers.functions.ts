import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data: roles, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!roles?.some((r) => r.role === "admin")) {
    throw new Error("Forbidden: admin only");
  }
}

const CreateTrainerInput = z.object({
  email: z.string().email().max(320),
  full_name: z.string().min(2).max(120),
  password: z.string().min(8).max(128),
  course_ids: z.array(z.string().uuid()).max(50).optional(),
});

export const createTrainerAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateTrainerInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message || "Failed to create user");
    }
    const newUserId = created.user.id;

    // Profile with force_password_reset flag set so first login forces a reset
    await supabaseAdmin.from("profiles").upsert({
      id: newUserId,
      email: data.email,
      full_name: data.full_name,
      force_password_reset: true,
    });

    await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "trainer" });
    if (rErr) throw new Error(rErr.message);

    if (data.course_ids && data.course_ids.length > 0) {
      const rows = data.course_ids.map((cid) => ({ course_id: cid, user_id: newUserId }));
      await supabaseAdmin.from("course_trainers").insert(rows);
    }

    return { ok: true, user_id: newUserId };
  });

const SetPasswordInput = z.object({
  user_id: z.string().uuid(),
  password: z.string().min(8).max(128),
});

export const resetTrainerPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SetPasswordInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    // Force the trainer to choose a new password on next login
    await supabaseAdmin
      .from("profiles")
      .update({ force_password_reset: true })
      .eq("id", data.user_id);
    return { ok: true };
  });

// Trainer (self) sets a new password — clears the force_password_reset flag
const SelfPasswordInput = z.object({
  password: z.string().min(8).max(128),
});
export const completeForcedPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SelfPasswordInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin
      .from("profiles")
      .update({ force_password_reset: false })
      .eq("id", userId);
    return { ok: true };
  });

// Suspend / unsuspend a trainer (revokes course access via is_trainer_of_course)
const SuspendInput = z.object({
  user_id: z.string().uuid(),
  suspended: z.boolean(),
});
export const setTrainerSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SuspendInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .update({ is_suspended: data.suspended })
      .eq("user_id", data.user_id)
      .eq("role", "trainer");
    if (error) throw new Error(error.message);
    // Immediately invalidate sessions if suspending
    if (data.suspended) {
      await supabaseAdmin.auth.admin.signOut(data.user_id).catch(() => {});
    }
    return { ok: true };
  });

// Terminate (delete trainer account entirely)
const TerminateInput = z.object({ user_id: z.string().uuid() });
export const terminateTrainerAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TerminateInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Update granular permissions on a (trainer, course) link
const PermsInput = z.object({
  course_trainer_id: z.string().uuid(),
  perms: z.object({
    can_edit_content: z.boolean().optional(),
    can_view_trainees: z.boolean().optional(),
    can_grade_assignments: z.boolean().optional(),
    can_grade_graduation: z.boolean().optional(),
    can_approve_enrollments: z.boolean().optional(),
    can_archive_course: z.boolean().optional(),
  }),
});
export const updateTrainerPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PermsInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("trainer_permissions")
      .update(data.perms)
      .eq("course_trainer_id", data.course_trainer_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Soft-delete (archive) a course
const ArchiveInput = z.object({
  course_id: z.string().uuid(),
  archived: z.boolean(),
});
export const archiveCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ArchiveInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("courses")
      .update({ is_archived: data.archived })
      .eq("id", data.course_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
