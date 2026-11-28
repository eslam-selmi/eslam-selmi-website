import { WATCH_THRESHOLD } from "@/lib/watch-tracker";
// Learner-progress helpers for the unit page. Same rule as unitsDone in learner-progress.ts: a unit is done only when it has items and every one has a learner completion.
export type ProgressRow = { item_id: string; completed_at: string | null; watched_seconds?: number[] | null };

export function unitDoneFor(items: { id: string }[], prog: ProgressRow[]): boolean {
  if (!items.length) return false;
  const done = new Set(prog.filter((p) => p.completed_at).map((p) => p.item_id));
  return items.every((i) => done.has(i.id));
}

// Share of the video's seconds that were actually played, for display. At or above the completion threshold (95%, user rule 2026-11-28 16:12) it shows 100%,
// the raw seconds are kept as they are. The server alone decides completion.
export function itemWatchPercent(seconds: number[] | null | undefined, duration: number | null | undefined): number {
  const d = Math.ceil(Number(duration) || 0);
  if (!seconds || !seconds.length || d <= 0) return 0;
  const raw = new Set(seconds).size / d;
  return raw >= WATCH_THRESHOLD ? 100 : Math.floor(raw * 100);
}
