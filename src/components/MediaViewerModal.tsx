import { useEffect, useState } from "react";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { safeHref } from "@/lib/safe-url";

export type MediaItem = {
  title: string;
  subtitle?: string | null;
  kind: "link" | "file" | "video" | "pdf" | "embed" | "note";
  url?: string | null;
  content?: string | null;
  /** If true, `url` is a storage path in `course-files` bucket, not a public URL */
  isStoragePath?: boolean;
};

function toEmbedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // YouTube
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

export function MediaViewerModal({
  item,
  onClose,
}: {
  item: MediaItem | null;
  onClose: () => void;
}) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!item) {
      setResolvedUrl(null);
      setErr(null);
      return;
    }
    if (item.kind === "note" || !item.url) {
      setResolvedUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        if (item.isStoragePath) {
          const { data, error } = await supabase.storage
            .from("course-files")
            .createSignedUrl(item.url!, 600);
          if (error) throw error;
          if (!cancelled) setResolvedUrl(data.signedUrl);
        } else {
          if (!cancelled) setResolvedUrl(toEmbedUrl(item.url!));
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  const isPdf =
    item.kind === "pdf" ||
    (resolvedUrl && /\.pdf(\?|$)/i.test(resolvedUrl));
  const isVideoFile =
    item.kind === "video" ||
    (item.isStoragePath && resolvedUrl && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(resolvedUrl));
  const isImageFile =
    item.isStoragePath && resolvedUrl && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(resolvedUrl);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl rounded-2xl border border-white/15 bg-[#0b1736] shadow-2xl overflow-hidden flex flex-col"
        style={{ height: "min(88dvh, 88vh)", maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 48px)" }}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/10 shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate">{item.title}</h3>
            {item.subtitle && (
              <p className="text-[11px] text-white/55 truncate">{item.subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-black/40 relative">
          {item.kind === "note" ? (
            <div className="h-full overflow-auto p-6 text-white/85 whitespace-pre-wrap">
              {item.content ?? item.title}
            </div>
          ) : loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : err ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-rose-300 text-sm p-4 text-center">
              <p>{isAr ? "تعذّر فتح المحتوى" : "Could not open content"}</p>
              <p className="text-xs text-white/40">{err}</p>
            </div>
          ) : resolvedUrl ? (
            isVideoFile ? (
              <video
                src={resolvedUrl}
                controls
                controlsList="nodownload"
                className="w-full h-full bg-black"
              />
            ) : isImageFile ? (
              <img src={resolvedUrl} alt="" className="w-full h-full object-contain" />
            ) : item.kind === "link" && !resolvedUrl.includes("youtube.com") && !resolvedUrl.includes("vimeo.com") ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <ExternalLink className="w-8 h-8 text-sky-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">{isAr ? "رابط خارجي" : "External Link"}</h4>
                  <p className="text-white/60 max-w-md mx-auto">
                    {isAr ? "سيُفتح الرابط في تبويب جديد لتصفح سلس ومريح." : "Opening in a new tab for a seamless browsing experience."}
                  </p>
                </div>
                <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="mt-2 px-6 h-12 rounded-xl bg-[var(--gold)] hover:bg-[#b8923f] text-[#0b1736] font-bold inline-flex items-center justify-center gap-2 transition">
                  {isAr ? "فتح الرابط الآن" : "Open Link Now"} <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <iframe
                src={resolvedUrl + (isPdf ? "#toolbar=0" : "")}
                title={item.title}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                referrerPolicy="no-referrer"
              />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Tiny launcher button — only renders the title, never exposes raw URL */
export function MediaLaunchButton({
  item,
  onOpen,
  icon,
  className = "",
}: {
  item: MediaItem;
  onOpen: (item: MediaItem) => void;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={
        "inline-flex items-center gap-1.5 text-xs text-[var(--gold)] hover:underline " +
        className
      }
    >
      {icon ?? <ExternalLink className="w-3.5 h-3.5" />}
      <span className="truncate">{item.title}</span>
    </button>
  );
}
