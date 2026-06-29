import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Normalize a remote URL into something iframe-friendly. */
export function toEmbedUrl(raw: string): string {
  if (!raw) return raw;
  const url = raw.trim();

  // Google Drive: /view, /view?usp=..., /edit -> /preview
  if (/drive\.google\.com/i.test(url)) {
    return url
      .replace(/\/view(\?[^#]*)?/i, "/preview")
      .replace(/\/edit(\?[^#]*)?/i, "/preview");
  }

  // YouTube watch?v=ID -> embed/ID
  const ytWatch = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (/youtube\.com\/watch/i.test(url) && ytWatch) {
    return `https://www.youtube.com/embed/${ytWatch[1]}`;
  }
  // youtu.be/ID
  const ytShort = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
  if (ytShort) {
    return `https://www.youtube.com/embed/${ytShort[1]}`;
  }
  // YouTube shorts
  const ytShorts = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i);
  if (ytShorts) {
    return `https://www.youtube.com/embed/${ytShorts[1]}`;
  }

  return url;
}

export function UniversalEmbedModal({
  open,
  onOpenChange,
  url,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title?: string;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [loading, setLoading] = useState(true);
  const embedUrl = toEmbedUrl(url);

  useEffect(() => {
    if (open) setLoading(true);
  }, [open, embedUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[92vw] h-[85vh] sm:h-[85vh] p-0 overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/[0.03]">
          <h3 className="text-sm sm:text-base font-semibold text-white/90 truncate flex-1">
            {title || t("معاينة المحتوى", "Content preview")}
          </h3>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-[var(--gold)]/40 text-white/85 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t("فتح في تبويب جديد", "Open in new tab")}
          </a>
        </div>

        <div className="relative flex-1 bg-black/40">
          {loading && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
            </div>
          )}
          {embedUrl ? (
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={title || "embed"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              onLoad={() => setLoading(false)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
