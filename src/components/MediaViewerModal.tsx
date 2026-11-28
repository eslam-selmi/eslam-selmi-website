import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, Loader2, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { safeHref } from "@/lib/safe-url";
import { itemMediaClass, isMeasuredVideo } from "@/lib/media-class";
import { mediaSource } from "@/lib/media-url";
import { WATCH_THRESHOLD } from "@/lib/watch-tracker";
import { hasVideoCues } from "@/lib/video-cues";
import { Button } from "@/components/ui/button";
import { VideoWithCues } from "@/components/VideoWithCues";
import { LEARNER_PROGRESS_ENABLED, recordOpened, markItemDone, recordWatched, supabaseProgressStore, createWatchTracker } from "@/lib/learner-progress";

export type MediaItem = {
  title: string;
  subtitle?: string | null;
  kind: "link" | "file" | "video" | "pdf" | "embed" | "note";
  url?: string | null;
  content?: string | null;
  /** If true, `url` is a storage path in `course-files` bucket, not a public URL */
  isStoragePath?: boolean;
  /** module_items.id, used only for learner progress (flag-gated) */
  id?: string;
};

export function MediaViewerModal({
  item,
  onClose,
  progress,
}: {
  item: MediaItem | null;
  onClose: () => void;
  /** learner progress target; ignored unless VITE_LEARNER_PROGRESS=1 */
  progress?: { userId: string; itemId: string };
}) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Learner progress (default off). Files/links/notes are recorded as opened, learner marks them finished; videos by actual played seconds.
  const tracker = useRef<ReturnType<typeof createWatchTracker> | null>(null);
  const durRef = useRef(0);
  const mediaClass = item ? itemMediaClass(item) : "plain";
  const [markedDone, setMarkedDone] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const [srvDone, setSrvDone] = useState(false);
  const lastFlush = useRef(0);
  useEffect(() => { setMarkedDone(false); setPct(null); setSrvDone(false); }, [item?.id]);
  useEffect(() => {
    if (!LEARNER_PROGRESS_ENABLED || !progress || !item) return;
    let on = true;
    void supabaseProgressStore.load(progress.userId, progress.itemId).then((p) => { if (on && p?.completed_at) setSrvDone(true); }).catch(() => {});
    return () => { on = false; };
  }, [item?.id, progress?.itemId]); // eslint-disable-line react-hooks/exhaustive-deps
  const canMark = LEARNER_PROGRESS_ENABLED && !!progress && !isMeasuredVideo(mediaClass) && mediaClass !== "embed_other";
  const onMarkDone = async () => { if (!progress) return; const r = await markItemDone(supabaseProgressStore, progress.userId, progress.itemId, { measuredVideo: false }); if (r.ok) setMarkedDone(true); };
  const flushWatch = () => {
    if (!LEARNER_PROGRESS_ENABLED || !progress || !tracker.current || durRef.current <= 0) return;
    const snap = tracker.current.snapshot(); if (!snap.length) return;
    void recordWatched(supabaseProgressStore, progress.userId, progress.itemId, snap).then((r) => { if (r?.completed) setSrvDone(true); }).catch(() => {});
  };
  useEffect(() => {
    if (!LEARNER_PROGRESS_ENABLED || !progress || !item) return;
    tracker.current = null; durRef.current = 0;
    if (!isMeasuredVideo(mediaClass) && mediaClass !== "embed_other") void recordOpened(supabaseProgressStore, progress.userId, progress.itemId).catch(() => {});
    const iv = window.setInterval(flushWatch, 30000);
    return () => { window.clearInterval(iv); flushWatch(); };
  }, [item?.id, progress?.itemId]); // eslint-disable-line react-hooks/exhaustive-deps
  const onTick = LEARNER_PROGRESS_ENABLED && progress ? (t: number, playing: boolean, duration: number, rate: number, ended?: boolean) => {
    if (!(duration > 0)) return;
    if (!tracker.current || durRef.current !== duration) { tracker.current = createWatchTracker(duration); durRef.current = duration; }
    tracker.current.tick(t, playing, rate);
    if (ended) tracker.current.end();
    const r = Math.min(1, tracker.current.ratio());
    setPct((prev) => { const n = r >= WATCH_THRESHOLD ? 100 : Math.floor(r * 100); return prev === n ? prev : n; });
    // Send progress when the learner pauses, seeks or reaches the end (not only every 30 s), so the server can decide completion promptly.
    const now = Date.now();
    if ((!playing || r >= WATCH_THRESHOLD) && now - lastFlush.current > 2000) { lastFlush.current = now; flushWatch(); }
  } : undefined;

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
    const url = item.url;
    setResolvedUrl(null);
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        if (item.isStoragePath) {
          const { data, error } = await supabase.storage
            .from("course-files")
            .createSignedUrl(url, 60);
          if (error) throw error;
          if (!cancelled) setResolvedUrl(data.signedUrl);
        } else {
          if (!cancelled) setResolvedUrl(mediaSource(url).url);
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
  const source = mediaSource(resolvedUrl ?? "");
  const isVideoFile = source.kind === "video";
  const ytId = source.kind === "embed" ? (/^https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{11})/.exec(source.url)?.[1] ?? null) : null;
  const originalUrl = safeHref(item.isStoragePath ? resolvedUrl : item.url);
  const isDownloadOnly = !!resolvedUrl && /\.(xlsx?|xlsm|docx?|pptx?|zip|rar|csv)(\?|$)/i.test(resolvedUrl);
  const isImageFile =
    item.isStoragePath && resolvedUrl && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(resolvedUrl);

  return createPortal(
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
            {LEARNER_PROGRESS_ENABLED && !!progress && isMeasuredVideo(mediaClass) && (srvDone || pct !== null) && (
              <p className={`text-[11px] truncate ${srvDone ? "text-emerald-300" : "text-white/70"}`} data-testid="watch-status">
                {srvDone ? (isAr ? "✓ تم إكمال هذا الفيديو" : "✓ Video completed") : (isAr ? `تمت مشاهدة ${pct}% في هذه الجلسة` : `${pct}% watched this session`)}
              </p>
            )}
          </div>
          {canMark && (
            <Button size="sm" onClick={onMarkDone} disabled={markedDone} className="bg-emerald-500/90 hover:bg-emerald-500 text-white">
              {markedDone ? (isAr ? "تم تسجيل الإنجاز" : "Marked as finished") : (isAr ? "تم الانتهاء" : "I finished this")}
            </Button>
          )}
          {originalUrl && (
            <Button asChild variant="outline" size="sm" className="bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white">
              <a href={originalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />{isAr ? "فتح المصدر" : "Open source"}
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {LEARNER_PROGRESS_ENABLED && progress && mediaClass === "embed_other" && (
          <div className="px-4 py-2 text-xs bg-amber-500/15 text-amber-200 border-b border-amber-300/20 shrink-0">
            {isAr ? "لا يمكن قياس مشاهدة هذا الفيديو بعد، لذلك لن يُحتسب مكتملًا تلقائيًا. تواصل مع المدرّب." : "Watching this video cannot be measured yet, so it will not be counted as complete automatically. Please contact the trainer."}
          </div>
        )}

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
              <VideoWithCues
                src={resolvedUrl}
                content={item.content}
                isAr={isAr}
                onTick={onTick}
                onError={() => setErr(isAr ? "تعذّر تشغيل الفيديو؛ يمكنك فتحه من المصدر." : "Video playback failed; open the source instead.")}
              />
            ) : ytId && (hasVideoCues(item.content) || (LEARNER_PROGRESS_ENABLED && !!progress)) ? (
              <VideoWithCues youtubeId={ytId} src="" content={item.content} isAr={isAr} onTick={onTick}
                onError={() => setErr(isAr ? "تعذّر تشغيل الفيديو؛ يمكنك فتحه من المصدر." : "Video playback failed; open the source instead.")} />
            ) : isImageFile ? (
              <img src={resolvedUrl} alt="" className="w-full h-full object-contain" />
            ) : isDownloadOnly ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center bg-[#0b1736]">
                <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center">
                  <FileDown className="w-8 h-8 text-[var(--gold)]" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-white/60 max-w-md mx-auto">
                    {isAr ? "هذا الملف يُفتح في برنامج على جهازك (إكسيل أو وورد). حمّله ثم افتحه." : "This file opens in an app on your device (Excel or Word). Download it, then open it."}
                  </p>
                </div>
                {safeHref(resolvedUrl) && (
                  <a href={safeHref(resolvedUrl) ?? undefined} download rel="noopener noreferrer" className="mt-2 px-6 h-12 rounded-xl bg-primary text-primary-foreground font-bold inline-flex items-center justify-center gap-2 transition">
                    {isAr ? "تحميل الملف" : "Download file"} <FileDown className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : source.kind === "external" && !isPdf && !item.isStoragePath && item.kind !== "embed" ? (
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
                {safeHref(resolvedUrl) && (
                  <a href={originalUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-2 px-6 h-12 rounded-xl bg-primary text-primary-foreground font-bold inline-flex items-center justify-center gap-2 transition">
                    {isAr ? "فتح الرابط الآن" : "Open Link Now"} <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              <iframe
                src={resolvedUrl + (isPdf ? "#toolbar=0" : "")}
                title={item.title}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            )
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
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
