import { supabase } from "@/integrations/supabase/client";

export type ToolId = "tna" | "perf";

export const TOOLS: Record<ToolId, {
  ar: string; en: string; descAr: string; descEn: string;
  handout: { ar: string; en: string };
  siteKeys: { home: string; nav: string };
}> = {
  tna: {
    ar: "تحليل الاحتياجات التدريبية", en: "Training Needs Analysis",
    descAr: "أدخل الكفاءات والموظفين والتقييمات، وتظهر الفجوات والأولويات وخطة التدريب والميزانية فورًا.",
    descEn: "Enter competencies, staff and ratings. Gaps, priorities, and a training plan with budget update instantly.",
    handout: { ar: "دليل استخدام مصنف تحليل الاحتياجات التدريبية", en: "TNA workbook handbook" },
    siteKeys: { home: "home.tna_tool", nav: "nav.tna_tool" },
  },
  perf: {
    ar: "قياس الأداء قبل التدريب", en: "Pre-training performance",
    descAr: "اجمع أدلة الأداء الفعلي مقابل المعايير، وشوف الفجوة وقوة الدليل قبل اختيار تدريب.",
    descEn: "Collect actual performance evidence against standards and see the gap and evidence strength before choosing training.",
    handout: { ar: "دليل قياس الأداء قبل التدريب", en: "Pre-training performance handbook" },
    siteKeys: { home: "home.perf_tool", nav: "nav.perf_tool" },
  },
};

export const TOOL_IDS = Object.keys(TOOLS) as ToolId[];
export const isToolId = (v: unknown): v is ToolId => v === "tna" || v === "perf";

// New tables are not in the generated types yet.
const db = supabase as any;

/** Tools the signed-in user may open. Decided by the database (grant + active profile). */
export async function fetchMyTools(): Promise<ToolId[]> {
  const { data, error } = await db.rpc("get_my_tools");
  if (error) throw error;
  return ((data as string[]) || []).filter(isToolId);
}

export async function loadWorkspace(tool: ToolId): Promise<{ data: unknown | null; revision: number }> {
  const { data, error } = await db.from("tool_workspaces").select("data,revision").eq("tool", tool).maybeSingle();
  if (error) throw error;
  return data ? { data: data.data, revision: data.revision } : { data: null, revision: 0 };
}

/** Saves the workspace. Keeps up to 20 snapshots, at most one every 10 minutes. */
export async function saveWorkspace(tool: ToolId, data: unknown, revision: number, userId: string): Promise<number> {
  const next = revision + 1;
  const row = { user_id: userId, tool, data, revision: next, updated_at: new Date().toISOString() };
  const { error } = await db.from("tool_workspaces").upsert(row, { onConflict: "user_id,tool" });
  if (error) throw error;
  void snapshot(tool, data, userId);
  return next;
}

async function snapshot(tool: ToolId, data: unknown, userId: string) {
  try {
    const { data: last } = await db.from("tool_workspace_versions").select("id,created_at").eq("tool", tool).order("created_at", { ascending: false }).limit(20);
    const rows = (last as { id: string; created_at: string }[]) || [];
    if (rows[0] && Date.now() - new Date(rows[0].created_at).getTime() < 10 * 60_000) return;
    await db.from("tool_workspace_versions").insert({ user_id: userId, tool, data });
    if (rows.length >= 20) await db.from("tool_workspace_versions").delete().in("id", rows.slice(19).map((r) => r.id));
  } catch {
    /* snapshots are best effort; the workspace itself is already saved */
  }
}

/** Admin: list grants joined with profile info. */
export async function adminListGrants(): Promise<{ user_id: string; tool: ToolId }[]> {
  const { data, error } = await db.from("tool_access").select("user_id,tool");
  if (error) throw error;
  return (data || []).filter((r: any) => isToolId(r.tool));
}
export async function adminSetGrant(userId: string, tool: ToolId, on: boolean, adminId: string) {
  const q = on
    ? db.from("tool_access").upsert({ user_id: userId, tool, granted_by: adminId }, { onConflict: "user_id,tool", ignoreDuplicates: true })
    : db.from("tool_access").delete().eq("user_id", userId).eq("tool", tool);
  const { error } = await q;
  if (error) throw error;
}
