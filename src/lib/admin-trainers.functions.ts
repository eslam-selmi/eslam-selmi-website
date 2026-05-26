import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
    const { userId } = context;

    // Verify caller is admin
    const { data: roles, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (roleErr) throw new Error(roleErr.message);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Forbidden: admin only");
    }

    // Create the auth user with email auto-confirmed
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

    // Ensure profile row exists (trigger may have created one with empty fields)
    await supabaseAdmin.from("profiles").upsert({
      id: newUserId,
      email: data.email,
      full_name: data.full_name,
    });

    // Remove default 'trainee' role inserted by the trigger and set 'trainer'
    await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "trainer" });
    if (rErr) throw new Error(rErr.message);

    // Assign to courses if provided
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
    const { userId } = context;
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Forbidden: admin only");
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
