export type MediaSource = { url: string; kind: "embed" | "video" | "external" };

export function mediaSource(raw: string): MediaSource {
  const fallback: MediaSource = { url: "", kind: "external" };
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return fallback;
    const host = u.hostname.toLowerCase();
    const parts = u.pathname.split("/").filter(Boolean);
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be", "www.youtu.be"].includes(host)) {
      const id = host.endsWith("youtu.be") ? parts[0] : u.searchParams.get("v") || (["shorts", "live", "embed"].includes(parts[0]) ? parts[1] : "");
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
        const player = new URL(`https://www.youtube.com/embed/${id}`);
        player.searchParams.set("rel", "0");
        return { url: player.href, kind: "embed" };
      }
    }
    if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)) {
      const index = parts.findIndex((part) => /^\d+$/.test(part));
      if (index >= 0) {
        const player = new URL(`https://player.vimeo.com/video/${parts[index]}`);
        const hash = u.searchParams.get("h") || parts[index + 1];
        if (hash && /^[A-Za-z0-9]+$/.test(hash)) player.searchParams.set("h", hash);
        return { url: player.href, kind: "embed" };
      }
    }
    if (host === "drive.google.com") {
      const id = parts[0] === "file" && parts[1] === "d" ? parts[2] : u.searchParams.get("id");
      if (id && /^[A-Za-z0-9_-]+$/.test(id)) return { url: `https://drive.google.com/file/d/${id}/preview`, kind: "embed" };
    }
    return { url: u.href, kind: /\.(mp4|webm|mov|m4v)$/i.test(u.pathname) ? "video" : "external" };
  } catch {
    return fallback;
  }
}