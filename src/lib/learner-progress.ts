// PREPARED, default OFF. Needs the prepared SQL in docs/prepared-sql/learner_progress_and_self_certificate.sql applied first.
import { supabase } from "@/integrations/supabase/client";
import { createWatchTracker, WATCH_THRESHOLD } from "@/lib/watch-tracker";

export const LEARNER_PROGRESS_ENABLED = import.meta.env.VITE_LEARNER_PROGRESS === "1";

export type Blockers = { unpaid_due: boolean; items_left: number };
export type Eligibility =
  | { ok: true }
  | { ok: false; reason: "debt" | "content" | "graduation" | "names" };

// Order matters: debt is shown first so the trainee sees "pay first" before anything else.
export function evaluateEligibility(b: Blockers, grad: { required: boolean; approved: boolean }, namesSaved: boolean): Eligibility {
  if (b.unpaid_due) return { ok: false, reason: "debt" };
  if (b.items_left > 0) return { ok: false, reason: "content" };
  if (grad.required && !grad.approved) return { ok: false, reason: "graduation" };
  if (!namesSaved) return { ok: false, reason: "names" };
  return { ok: true };
}

export type ProgressStore = {
  load(userId: string, itemId: string): Promise<{ opened_at: string | null; watched_seconds: number[]; completed_at: string | null } | null>;
  save(row: { user_id: string; item_id: string; opened_at?: string | null; watched_seconds?: number[]; completed_at?: string | null }): Promise<void>;
};

export const supabaseProgressStore: ProgressStore = {
  async load(userId, itemId) {
    const { data } = await (supabase as any).from("learner_item_progress").select("opened_at,watched_seconds,completed_at").eq("user_id", userId).eq("item_id", itemId).maybeSingle();
    return data ?? null;
  },
  async save(row) { await (supabase as any).rpc("save_my_item_progress", { _item: row.item_id, _opened: !!row.opened_at, _seconds: row.watched_seconds ?? [], _completed: !!row.completed_at }); },
};

// File item: opening it counts as seen (complete).
export async function recordOpened(store: ProgressStore, userId: string, itemId: string) {
  if (!LEARNER_PROGRESS_ENABLED && !(store as any).__test) return;
  const now = new Date().toISOString();
  await store.save({ user_id: userId, item_id: itemId, opened_at: now, completed_at: now });
}

// Video item: merge newly played seconds with saved ones, complete at the proposed threshold.
export async function recordWatched(store: ProgressStore, userId: string, itemId: string, duration: number, played: number[]) {
  if (!LEARNER_PROGRESS_ENABLED && !(store as any).__test) return { completed: false };
  const prev = await store.load(userId, itemId);
  const merged = [...new Set([...(prev?.watched_seconds ?? []), ...played])].sort((a, b) => a - b);
  const completed = duration > 0 && merged.length / Math.floor(duration) >= WATCH_THRESHOLD;
  await store.save({ user_id: userId, item_id: itemId, watched_seconds: merged, completed_at: completed || prev?.completed_at ? (prev?.completed_at ?? new Date().toISOString()) : null });
  return { completed: completed || !!prev?.completed_at };
}

export type GateStatus = "ok" | "debt" | "content" | "graduation" | "names" | "issued" | "unknown";
// Authoritative decision is the server's. Any error or unrecognised answer is treated as "unknown" (blocked), never as ok.
export async function fetchGate(enrollmentId: string): Promise<GateStatus> {
  try {
    const { data, error } = await (supabase as any).rpc("my_certificate_gate", { _enrollment: enrollmentId });
    if (error) return "unknown";
    const st = data?.status;
    return ["ok", "debt", "content", "graduation", "names", "issued"].includes(st) ? st : "unknown";
  } catch { return "unknown"; }
}
export async function issueMyCertificate(enrollmentId: string): Promise<GateStatus> {
  try {
    const { data, error } = await (supabase as any).rpc("issue_my_certificate", { _enrollment: enrollmentId });
    if (error) return "unknown";
    const st = data?.status;
    return ["ok", "debt", "content", "graduation", "names", "issued"].includes(st) ? st : "unknown";
  } catch { return "unknown"; }
}
export function gateFromBlockers(b: Blockers): GateStatus { return b.unpaid_due ? "debt" : b.items_left > 0 ? "content" : "ok"; }
export { createWatchTracker };
