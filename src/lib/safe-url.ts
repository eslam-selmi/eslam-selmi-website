export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  // any explicit non-http(s) scheme (javascript:, data:, file:, ...) is refused; 'host:443/path' (port) is still allowed
  if (/^(?!https?:)[a-z][a-z0-9+.-]*:(?!\d)/i.test(url.trim())) return null;
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const u = new URL(normalized);
    return u.protocol === "http:" || u.protocol === "https:" ? normalized : null;
  } catch {
    return null;
  }
}
