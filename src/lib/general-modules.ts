/**
 * Sections that hold course-wide files (not tied to one unit). The database has no flag for this,
 * so the known sections are listed here by course id and module id. Anything not listed behaves
 * exactly as before. Limitation: a new course-wide section needs its ids added here.
 */
const GENERAL_FILE_MODULES: Record<string, string[]> = {
  "90458811-ece6-4ed8-a172-af87078c8c64": ["8da6232a-85b4-4131-86c0-950272a58aa4"],
};
export function isGeneralFilesModule(m: { id: string; course_id: string }): boolean {
  return !!GENERAL_FILE_MODULES[m.course_id]?.includes(m.id);
}
export type DisplayModule<T> = { m: T; i: number; num: number | null };
/** Display order: units first in their stored order (numbered 1..n), general sections last, unnumbered. `i` is the stored index. */
export function orderModulesForDisplay<T extends { id: string; course_id: string }>(modules: T[]): DisplayModule<T>[] {
  const units: DisplayModule<T>[] = [];
  const general: DisplayModule<T>[] = [];
  modules.forEach((m, i) => (isGeneralFilesModule(m) ? general.push({ m, i, num: null }) : units.push({ m, i, num: units.length + 1 })));
  return [...units, ...general];
}
