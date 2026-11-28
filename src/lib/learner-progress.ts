// ON by default. Server rules: drizzle/migrations/0009_recorded_course_auto_certificate.sql. Server switch: app_private.feature_flags.learner_progress. Set VITE_LEARNER_PROGRESS=0 to disable the client.
import { supabase } from "@/integrations/supabase/client";
import { createWatchTracker, WATCH_THRESHOLD } from "@/lib/watch-tracker";
import { itemMediaClass, isMeasuredVideo } from "@/lib/media-class";

export const LEARNER_PROGRESS_ENABLED = import.meta.env.VITE_LEARNER_PROGRESS !== "0";

export type Blockers = { unpaid_due: boolean; items_left: number };
export type Eligibility =
  | { ok: true }
  | { ok: false; reason: "debt" | "content" | "graduation" | "names" };

// Order matters: debt is shown first so the trainee sees "pay first" before anything else.
export function evaluateEligibility(b: Blockers, grad: { required: boolean; approved: boolean }, namesSaved: boolean): Eligibility {
  if (b.unpaid_due) return { ok: false, reason: "debt" };
  if (grad.required && !grad.approved) return { ok: false, reason: "graduation" };
  if (!namesSaved) return { ok: false, reason: "names" };
  return { ok: true };
}

export type ProgressStore = {
  load(userId: string, itemId: string): Promise<{ opened_at: string | null; watched_seconds: number[]; completed_at: string | null } | null>;
  // Returns the SERVER's decision when it gives one. For videos the client never sends a duration and never claims completion.
  save(row: { user_id: string; item_id: string; opened_at?: string | null; watched_seconds?: number[]; completed_at?: string | null }): Promise<{ completed?: boolean } | void>;
};

export const supabaseProgressStore: ProgressStore = {
  async load(userId, itemId) {
    const { data } = await (supabase as any).from("learner_item_progress").select("opened_at,watched_seconds,completed_at").eq("user_id", userId).eq("item_id", itemId).maybeSingle();
    return data ?? null;
  },
  async save(row) {
    const { data, error } = await (supabase as any).rpc("save_my_item_progress", { _item: row.item_id, _opened: !!row.opened_at, _seconds: row.watched_seconds ?? [], _completed: !!row.completed_at });
    if (error) return {};
    return { completed: data?.completed === true };
  },
};

// File / link / live-session item: opening only records that it was opened. It is NOT completion (opening is not proof of reading).
// The learner marks it finished explicitly with markItemDone. This is tracking only and never blocks the certificate.
export async function recordOpened(store: ProgressStore, userId: string, itemId: string) {
  if (!LEARNER_PROGRESS_ENABLED && !(store as any).__test) return;
  const prev = await store.load(userId, itemId);
  if (prev?.opened_at) return;
  await store.save({ user_id: userId, item_id: itemId, opened_at: new Date().toISOString() });
}

// Explicit "I finished this" mark. Only allowed after the item was opened. Videos are never marked this way (they are decided by watched seconds).
export async function markItemDone(store: ProgressStore, userId: string, itemId: string, kind: { measuredVideo: boolean }) {
  if (!LEARNER_PROGRESS_ENABLED && !(store as any).__test) return { ok: false as const, reason: "disabled" as const };
  if (kind.measuredVideo) return { ok: false as const, reason: "video" as const };
  const prev = await store.load(userId, itemId);
  if (!prev?.opened_at) return { ok: false as const, reason: "not_opened" as const };
  if (prev.completed_at) return { ok: true as const };
  const now = new Date().toISOString();
  await store.save({ user_id: userId, item_id: itemId, opened_at: prev.opened_at, completed_at: now });
  return { ok: true as const };
}

export type ItemLite = { id: string; module_id: string; kind: string; url?: string | null };
export type ProgressLite = { item_id: string; completed_at: string | null };

// A unit (module) counts as complete in the learner's progress only when it has items and every one has a learner completion.
// The old admin mark (course_modules.completed_by_admin) is deliberately ignored.
export function unitsDone(moduleIds: string[], items: ItemLite[], prog: ProgressLite[]): number {
  const done = new Set(prog.filter((p) => p.completed_at).map((p) => p.item_id));
  return moduleIds.filter((m) => { const its = items.filter((i) => i.module_id === m); return its.length > 0 && its.every((i) => done.has(i.id)); }).length;
}

// Certificate condition (user 2026-11-28 14:21:59): ALL recorded videos. Live sessions, files and links never block.
// Embedded Vimeo/Drive items cannot be measured yet, so they are NOT exempted: they stay incomplete (and block) until measurable support exists.
export function videosLeft(items: ItemLite[], prog: ProgressLite[]): number {
  const done = new Set(prog.filter((p) => p.completed_at).map((p) => p.item_id));
  return items.filter((i) => { const c = itemMediaClass(i); return (isMeasuredVideo(c) || c === "embed_other") && !done.has(i.id); }).length;
}

// Video item: send only the seconds actually played. The client sends NO duration and NO completion claim; the server compares
// against module_items.duration_seconds (trusted) and decides. Unknown duration means the server cannot complete it (admin repair).
export async function recordWatched(store: ProgressStore, userId: string, itemId: string, played: number[]) {
  if (!LEARNER_PROGRESS_ENABLED && !(store as any).__test) return { completed: false };
  const prev = await store.load(userId, itemId);
  const merged = [...new Set([...(prev?.watched_seconds ?? []), ...played])].sort((a, b) => a - b);
  const res = await store.save({ user_id: userId, item_id: itemId, watched_seconds: merged });
  return { completed: (res && (res as any).completed === true) || !!prev?.completed_at };
}

export type GateStatus = "ok" | "debt" | "content" | "graduation" | "names" | "issued" | "finance_unknown" | "unknown";
// Authoritative decision is the server's. Any error or unrecognised answer is treated as "unknown" (blocked), never as ok.
export async function fetchGate(enrollmentId: string): Promise<GateStatus> {
  try {
    const { data, error } = await (supabase as any).rpc("my_certificate_gate", { _enrollment: enrollmentId });
    if (error) return "unknown";
    const st = data?.status;
    return ["ok", "debt", "finance_unknown", "content", "graduation", "names", "issued"].includes(st) ? st : "unknown";
  } catch { return "unknown"; }
}
export type IssueResult = { status: GateStatus; issuedAt: string | null; blockers: string[] };
// The issue date comes ONLY from the server's immutable timestamp. No client clock fallback.
export async function issueMyCertificateFull(enrollmentId: string): Promise<IssueResult> {
  try {
    const { data, error } = await (supabase as any).rpc("issue_my_certificate", { _enrollment: enrollmentId });
    if (error) return { status: "unknown", issuedAt: null, blockers: [] };
    const st = data?.status;
    const status: GateStatus = ["ok", "debt", "finance_unknown", "content", "graduation", "names", "issued"].includes(st) ? st : "unknown";
    const t = typeof data?.issued_at === "string" && !isNaN(new Date(data.issued_at).getTime()) ? data.issued_at : null;
    const blockers: string[] = Array.isArray(data?.blockers) ? data.blockers.filter((x: unknown) => typeof x === "string") : [];
    return { status, issuedAt: t, blockers };
  } catch { return { status: "unknown", issuedAt: null, blockers: [] }; }
}
export async function issueMyCertificate(enrollmentId: string): Promise<GateStatus> { return (await issueMyCertificateFull(enrollmentId)).status; }
export function gateFromBlockers(b: Blockers): GateStatus { return b.unpaid_due ? "debt" : "ok"; }
export { createWatchTracker };
