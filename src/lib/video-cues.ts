/**
 * Time-coded questions inside a course video.
 * Stored as text in module_items.content (no schema change), behind a marker
 * so ordinary note text is never mistaken for cues.
 */
export const CUE_PREFIX = "[[video-cues:v1]]";

export type VideoCue = {
  /** seconds from the start of the video */
  at: number;
  question: string;
  options: string[];
  /** index into options */
  correct: number;
  explanation?: string;
};

export function hasVideoCues(content: string | null | undefined): boolean {
  return typeof content === "string" && content.startsWith(CUE_PREFIX);
}

function cleanCue(raw: unknown): VideoCue | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const at = Number(r.at);
  const question = typeof r.question === "string" ? r.question.trim() : "";
  const options = Array.isArray(r.options)
    ? (r.options as unknown[])
        .filter((o): o is string => typeof o === "string")
        .map((o) => o.trim())
    : [];
  const correct = Number(r.correct);
  if (!Number.isFinite(at) || at < 0 || !question) return null;
  if (options.length < 2 || options.length > 6 || options.some((o) => !o)) return null;
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) return null;
  const explanation =
    typeof r.explanation === "string" && r.explanation.trim() ? r.explanation.trim() : undefined;
  return { at: Math.round(at * 10) / 10, question, options, correct, explanation };
}

export function parseVideoCues(content: string | null | undefined): VideoCue[] {
  if (!hasVideoCues(content)) return [];
  try {
    const data = JSON.parse((content as string).slice(CUE_PREFIX.length));
    if (!Array.isArray(data)) return [];
    return data
      .map(cleanCue)
      .filter((c): c is VideoCue => c !== null)
      .sort((a, b) => a.at - b.at);
  } catch {
    return [];
  }
}

/** Returns null when there are no valid cues (so the column is cleared). */
export function serializeVideoCues(cues: VideoCue[]): string | null {
  const valid = cues
    .map(cleanCue)
    .filter((c): c is VideoCue => c !== null)
    .sort((a, b) => a.at - b.at);
  return valid.length ? CUE_PREFIX + JSON.stringify(valid) : null;
}

/** Text safe to show to people: cue storage is hidden. */
export function visibleItemText(content: string | null | undefined): string | null {
  if (!content || hasVideoCues(content)) return null;
  return content;
}

/** "1:30" or "90" or "1:02:03" to seconds, null when invalid. */
export function parseTimeInput(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  const parts = s.split(":");
  if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p.trim()))) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.length > 1 && nums.slice(1).some((n) => n >= 60)) return null;
  return nums.reduce((acc, n) => acc * 60 + n, 0);
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? h + ":" : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** Index of the first unanswered cue whose time has been reached, or -1. */
export function nextDueCue(
  cues: VideoCue[],
  answered: ReadonlySet<number>,
  currentTime: number,
): number {
  for (let i = 0; i < cues.length; i++) {
    if (!answered.has(i) && currentTime >= cues[i].at) return i;
  }
  return -1;
}

/** True for a course file item that is a playable video file. */
export function isVideoFileItem(it: { kind: string; url?: string | null }): boolean {
  return (
    ["file", "video"].includes(it.kind) && !!it.url && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(it.url)
  );
}
