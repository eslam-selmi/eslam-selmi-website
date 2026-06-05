export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const u = new URL(normalized);
    return u.protocol === "http:" || u.protocol === "https:" ? normalized : null;
  } catch {
    return null;
  }
}
