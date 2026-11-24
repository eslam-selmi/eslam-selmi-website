import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, Hand } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mediaSource } from "@/lib/media-url";
import { useSiteVideos } from "@/lib/site-videos";

export function VideoShowcase() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data } = useSiteVideos();
  const videos = (data?.videos ?? []).filter(v => v.visible);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  if (!data || videos.length === 0) return null;
  const current = videos[Math.min(active, videos.length - 1)]!;
  const src = mediaSource(current.url);
  const select = (i: number) => { setActive(i); setPlaying(false); };
  const scroll = (dir: number) => railRef.current?.scrollBy({ left: dir * (ar ? -1 : 1) * 320, behavior: "smooth" });
  const title = (v: typeof current) => (ar ? v.titleAr : v.titleEn) || (ar ? "فيديو" : "Video");

  return (
    <section id="videos" className="vs-section relative py-20 sm:py-28 overflow-hidden" aria-label={ar ? data.titleAr : data.titleEn}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-accent mb-3">{ar ? data.eyebrowAr : data.eyebrowEn}</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold leading-tight max-w-2xl">{ar ? data.titleAr : data.titleEn}</h2>
          </div>
          <span className="hidden sm:block font-display text-6xl font-bold text-foreground/10 tabular-nums" aria-hidden>
            {String(active + 1).padStart(2, "0")}<span className="text-2xl">/{String(videos.length).padStart(2, "0")}</span>
          </span>
        </div>

        <motion.div key={current.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="vs-stage relative aspect-video rounded-[1.75rem] overflow-hidden">
          {playing && src.url ? (
            src.kind === "video" ? <video src={src.url} controls autoPlay playsInline className="absolute inset-0 size-full bg-background object-contain" />
            : <iframe src={`${src.url}${src.url.includes("?") ? "&" : "?"}autoplay=1`} title={title(current)} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 size-full" />
          ) : (
            <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full text-start" aria-label={`${ar ? "تشغيل" : "Play"}: ${title(current)}`}>
              {current.poster ? <img src={current.poster} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                : src.kind === "video" ? <video src={`${src.url}#t=0.5`} muted preload="metadata" playsInline className="absolute inset-0 size-full object-cover" />
                : <div className="absolute inset-0 vs-fallback" />}
              <div className="absolute inset-0 vs-scrim" />
              <span className="vs-play absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center size-20 sm:size-24 rounded-full">
                <Play className="size-8 sm:size-9 translate-x-0.5 fill-current" />
              </span>
              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-8">
                <h3 className="font-display text-xl sm:text-3xl font-bold text-primary-foreground">{title(current)}</h3>
                {(ar ? current.descAr : current.descEn) && <p className="mt-2 text-sm sm:text-base text-primary-foreground/80 max-w-2xl line-clamp-2">{ar ? current.descAr : current.descEn}</p>}
              </div>
            </button>
          )}
        </motion.div>

        {videos.length > 1 && <>
          <div className="flex items-center justify-between mt-8 mb-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2"><Hand className="size-4" />{ar ? "اسحب للتنقل بين المقاطع" : "Swipe to browse clips"}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => scroll(-1)} className="vs-arrow" aria-label={ar ? "السابق" : "Previous"}>{ar ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
              <button type="button" onClick={() => scroll(1)} className="vs-arrow" aria-label={ar ? "التالي" : "Next"}>{ar ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</button>
            </div>
          </div>
          <div ref={railRef} className="vs-rail flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3" role="list">
            {videos.map((v, i) => {
              const s = mediaSource(v.url);
              return <button key={v.key} role="listitem" type="button" onClick={() => select(i)} aria-current={i === active} className="vs-thumb group snap-start shrink-0 w-64 sm:w-72 text-start">
                <div className="relative aspect-video rounded-2xl overflow-hidden">
                  {v.poster ? <img src={v.poster} alt="" loading="lazy" className="size-full object-cover" /> : s.kind === "video" ? <video src={`${s.url}#t=0.5`} muted preload="metadata" className="size-full object-cover" /> : <div className="size-full vs-fallback" />}
                  <span className="absolute top-3 start-3 text-[11px] font-bold tabular-nums vs-chip">{String(i + 1).padStart(2, "0")}</span>
                  <Play className="absolute bottom-3 end-3 size-5 text-primary-foreground fill-current opacity-80" />
                </div>
                <p className="mt-2.5 text-sm font-semibold line-clamp-1">{title(v)}</p>
              </button>;
            })}
          </div>
        </>}
      </div>
    </section>
  );
}
