/**
 * An item (file, link, note) normally belongs to the module (unit) it is stored in.
 * To show a file under a different unit without moving data between tables, the item's
 * `content` can start with a tag naming the target unit. Items with video cues are
 * never tagged. Untagged items stay where they are.
 */
const TAG_RE = /^\[\[unit:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]\]\n?/i;

export function getItemUnit(content: string | null | undefined): string | null {
  const m = TAG_RE.exec(content ?? "");
  return m ? m[1].toLowerCase() : null;
}
export function stripItemUnit(content: string | null | undefined): string | null {
  const s = (content ?? "").replace(TAG_RE, "");
  return s ? s : null;
}
/** Returns the new content: the visible text with the tag for `unitId`, or no tag when null. */
export function setItemUnit(content: string | null | undefined, unitId: string | null): string | null {
  const rest = stripItemUnit(content);
  if (!unitId) return rest;
  return `[[unit:${unitId}]]` + (rest ? "\n" + rest : "");
}
/** Moves tagged items under their target unit (when it exists in this course). */
export function regroupByUnit<T extends { id: string; module_id: string; content?: string | null; order_index?: number }>(
  moduleIds: string[],
  grouped: Record<string, T[]>,
): Record<string, T[]> {
  const known = new Set(moduleIds.map((x) => x.toLowerCase()));
  const byLower = new Map(moduleIds.map((x) => [x.toLowerCase(), x]));
  const out: Record<string, T[]> = {};
  for (const id of moduleIds) out[id] = [];
  for (const id of moduleIds) {
    for (const it of grouped[id] ?? []) {
      const target = getItemUnit(it.content);
      const dest = target && known.has(target) ? byLower.get(target)! : id;
      out[dest].push(it);
    }
  }
  return out;
}
