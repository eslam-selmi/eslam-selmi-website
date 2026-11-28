// Learner-progress helpers for the unit page. Same rule as unitsDone in learner-progress.ts: a unit is done only when it has items and every one has a learner completion.
export type ProgressRow = { item_id: string; completed_at: string | null; watched_seconds?: number[] | null };

export function unitDoneFor(items: { id: string }[], prog: ProgressRow[]): boolean {
  if (!items.length) return false;
  const done = new Set(prog.filter((p) => p.completed_at).map((p) => p.item_id));
  return items.every((i) => done.has(i.id));
}

// Share of the video's seconds that were actually played (distinct seconds / whole seconds). Display only; the server alone decides completion.
export function itemWatchPercent(seconds: number[] | null | undefined, duration: number | null | undefined): number {
  const d = Math.floor(Number(duration) || 0);
  if (!seconds || !seconds.length || d <= 0) return 0;
  return Math.min(100, Math.floor((new Set(seconds).size / d) * 100));
}
