import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, X as XIcon } from "lucide-react";
import { nextDueCue, parseVideoCues } from "@/lib/video-cues";

/**
 * Native video that pauses at admin-set times, asks a question in an overlay,
 * shows instant right/wrong feedback, then resumes after the trainee continues.
 * Nothing is stored. Works with no cues too (plain video).
 */
type YTPlayer = { getCurrentTime: () => number; pauseVideo: () => void; playVideo: () => void; getPlayerState: () => number; destroy: () => void };
type YTApi = { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer };
let ytApiPromise: Promise<YTApi> | null = null;
function loadYouTubeApi(): Promise<YTApi> {
  const w = window as unknown as { YT?: YTApi & { loaded?: number }; onYouTubeIframeAPIReady?: () => void };
  if (w.YT?.Player) return Promise.resolve(w.YT as YTApi);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve, reject) => {
      const prev = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => { prev?.(); resolve(w.YT as YTApi); };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.onerror = () => { ytApiPromise = null; reject(new Error("youtube api")); };
      document.head.appendChild(tag);
    });
  }
  return ytApiPromise;
}

export function VideoWithCues({
  youtubeId,
  src,
  content,
  isAr,
  onError,
  onProgress,
  onTick,
}: {
  /** play a YouTube video through the IFrame API (cues pause it the same way) */
  youtubeId?: string;
  src: string;
  /** module_items.content; cues are parsed from it when present */
  content?: string | null;
  isAr: boolean;
  onError?: () => void;
  /** optional: reports watch state (used by share links; nothing else needs it) */
  onProgress?: (p: { ended: boolean; maxRatio: number; cuesAnswered: number }) => void;
  /** optional: raw playback samples (time, playing, duration, rate) for actual-watch tracking; unused unless the learner-progress flag is on */
  onTick?: (t: number, playing: boolean, duration: number, rate: number) => void;
}) {
  const cues = useMemo(() => parseVideoCues(content), [content]);
  const ref = useRef<HTMLVideoElement>(null);
  const answered = useRef<Set<number>>(new Set());
  const [active, setActive] = useState<number>(-1);
  const [picked, setPicked] = useState<number | null>(null);
  const maxRatio = useRef(0);
  const ended = useRef(false);
  const emit = () => onProgress?.({ ended: ended.current, maxRatio: maxRatio.current, cuesAnswered: answered.current.size });

  // A refreshed signed URL differs only in its query: keep answers and position then, reset only for another file or other questions.
  const srcBase = src.split("?")[0];
  const resumeAt = useRef(0);
  const lastSrcBase = useRef(srcBase);
  useEffect(() => {
    answered.current = new Set();
    setActive(-1);
    setPicked(null);
    resumeAt.current = 0;
    lastSrcBase.current = srcBase;
  }, [srcBase, cues]); // eslint-disable-line react-hooks/exhaustive-deps

  const ytHost = useRef<HTMLDivElement>(null);
  const ytPlayer = useRef<YTPlayer | null>(null);
  const activeRef = useRef(-1);
  activeRef.current = active;
  useEffect(() => {
    if (!youtubeId || !ytHost.current) return;
    let off = false;
    let timer: number | undefined;
    const mount = document.createElement("div");
    ytHost.current.appendChild(mount);
    loadYouTubeApi().then((YT) => {
      if (off) return;
      ytPlayer.current = new YT.Player(mount, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
        events: { onError: () => onError?.() },
      });
      timer = window.setInterval(() => {
        const pl = ytPlayer.current;
        if (pl && onTick && typeof pl.getCurrentTime === "function") { try { onTick(pl.getCurrentTime(), pl.getPlayerState() === 1, Number((pl as any).getDuration?.() ?? 0), 1); } catch { /* ignore */ } }
        if (!pl || activeRef.current !== -1 || typeof pl.getCurrentTime !== "function") return;
        const i = nextDueCue(cues, answered.current, pl.getCurrentTime());
        if (i === -1) return;
        pl.pauseVideo();
        try { if (document.fullscreenElement) void document.exitFullscreen(); } catch { /* ignore */ }
        setPicked(null);
        setActive(i);
      }, 400);
    }).catch(() => onError?.());
    return () => { off = true; if (timer) window.clearInterval(timer); try { ytPlayer.current?.destroy(); } catch { /* ignore */ } ytPlayer.current = null; };
  }, [youtubeId, cues]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = useCallback(() => {
    const v = ref.current;
    if (!v || active !== -1) return;
    const i = nextDueCue(cues, answered.current, v.currentTime);
    if (i === -1) return;
    v.pause();
    // A native fullscreen player would hide the question, so leave it first.
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      (v as HTMLVideoElement & { webkitExitFullscreen?: () => void }).webkitExitFullscreen?.();
    } catch {
      /* ignore */
    }
    setPicked(null);
    setActive(i);
  }, [cues, active]);

  const cue = active >= 0 ? cues[active] : null;

  function resume() {
    if (active >= 0) answered.current.add(active);
    emit();
    setActive(-1);
    setPicked(null);
    void ref.current?.play();
    ytPlayer.current?.playVideo();
  }

  return (
    <div className="relative w-full h-full bg-black">
      {youtubeId ? <div ref={ytHost} className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full" /> : <video
        ref={ref}
        src={src}
        controls={!cue}
        controlsList="nodownload"
        playsInline
        onPause={() => { const v = ref.current; if (v && onTick) onTick(v.currentTime, false, v.duration, v.playbackRate); }}
        onSeeking={() => { const v = ref.current; if (v && onTick) onTick(v.currentTime, false, v.duration, v.playbackRate); }}
        onTimeUpdate={() => { const v = ref.current; if (v && onTick) onTick(v.currentTime, !v.paused && !v.seeking, v.duration, v.playbackRate); if (v) resumeAt.current = v.currentTime; if (v && v.duration > 0) maxRatio.current = Math.max(maxRatio.current, v.currentTime / v.duration); check(); }}
        onEnded={() => { ended.current = true; emit(); }}
        onSeeked={check}
        onLoadedMetadata={() => { const v = ref.current; if (v && resumeAt.current > 0 && Math.abs(v.currentTime - resumeAt.current) > 1 && resumeAt.current < v.duration - 0.5) v.currentTime = resumeAt.current; }}
        onError={onError}
        className="w-full h-full bg-black"
      />}
      {cue && (
        <div
          role="dialog"
          aria-modal="true"
          dir={isAr ? "rtl" : "ltr"}
          data-testid="video-question"
          className="absolute max-sm:fixed inset-0 z-10 max-sm:z-[95] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-auto"
        >
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0b1736] p-4 sm:p-5 shadow-2xl my-auto">
            <p className="text-[11px] text-[var(--gold)] mb-1">
              {isAr ? "سؤال سريع" : "Quick question"} {active + 1}/{cues.length}
            </p>
            <h4 className="font-bold text-white text-base sm:text-lg leading-relaxed mb-3">
              {cue.question}
            </h4>
            <div className="space-y-2">
              {cue.options.map((o, i) => {
                const done = picked !== null;
                const isRight = i === cue.correct;
                const isPicked = i === picked;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={done}
                    onClick={() => setPicked(i)}
                    className={
                      "w-full text-start rounded-xl border px-3 py-2.5 text-sm flex items-center gap-2 transition " +
                      (done
                        ? isRight
                          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
                          : isPicked
                            ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                            : "border-white/10 bg-white/[0.03] text-white/50"
                        : "border-white/15 bg-white/[0.04] text-white hover:bg-white/10")
                    }
                  >
                    <span className="flex-1">{o}</span>
                    {done && isRight && <Check className="w-4 h-4 shrink-0" />}
                    {done && isPicked && !isRight && <XIcon className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="mt-3" data-testid="video-feedback">
                <p
                  className={
                    "text-sm font-bold " +
                    (picked === cue.correct ? "text-emerald-300" : "text-rose-300")
                  }
                >
                  {picked === cue.correct
                    ? isAr
                      ? "إجابة صحيحة"
                      : "Correct"
                    : isAr
                      ? "إجابة غير صحيحة، الصحيحة معلّمة بالأخضر"
                      : "Not quite, the right answer is marked green"}
                </p>
                {cue.explanation && (
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">{cue.explanation}</p>
                )}
                <button
                  type="button"
                  onClick={resume}
                  className="mt-3 h-11 px-5 rounded-xl bg-[var(--gold)] text-[#0b1736] font-bold text-sm"
                >
                  {isAr ? "كمّل الفيديو" : "Continue video"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
