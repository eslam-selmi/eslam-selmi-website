/** Mirrors public.item_media_class in docs/prepared-sql (same cases in media-class.test.ts). */
export type MediaClass = "youtube" | "video_file" | "embed_other" | "plain";

export function itemMediaClass(it: { kind: string; url?: string | null }): MediaClass {
  const url = it.url ?? "";
  if (it.kind === "note" || !url) return "plain";
  if (/^https?:\/\/(((www|m)\.)?youtube(-nocookie)?\.com\/(watch\?([^#]*&)?v=|shorts\/|live\/|embed\/)[A-Za-z0-9_-]{11}|(www\.)?youtu\.be\/[A-Za-z0-9_-]{11})/i.test(url)) return "youtube";
  if (/^https?:\/\/((www|player)\.)?vimeo\.com\//i.test(url) || /^https?:\/\/drive\.google\.com\//i.test(url)) return "embed_other";
  if ((it.kind === "file" || it.kind === "video") && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return "video_file";
  return "plain";
}

/** Items whose completion needs measured watching (trusted admin duration + played seconds). */
export const isMeasuredVideo = (c: MediaClass) => c === "youtube" || c === "video_file";
