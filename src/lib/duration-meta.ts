// Reads a media file's duration from its OWN metadata (admin only). Returns whole seconds, or null if unreadable/implausible.
export function sanitizeDuration(d: number): number | null {
  if (!Number.isFinite(d) || d <= 0 || d > 60 * 60 * 24) return null;
  return Math.ceil(d);
}
export function readDurationFromUrl(url: string, timeoutMs = 20000): Promise<number | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video"); v.preload = "metadata";
    const done = (x: number | null) => { clearTimeout(t); v.removeAttribute("src"); v.load(); resolve(x); };
    const t = setTimeout(() => done(null), timeoutMs);
    v.onloadedmetadata = () => done(sanitizeDuration(v.duration));
    v.onerror = () => done(null);
    v.src = url;
  });
}
