import { useRef, useState } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mediaSource } from "@/lib/media-url";
import { useSiteVideos } from "@/lib/site-videos";

export function VideoShowcase() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data } = useSiteVideos();
  const videos = (data?.videos ?? []).filter(v => v.visible);
  const [playing, setPlaying] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  if (!data || videos.length === 0) return null;
  const scroll = (dir: number) => {
    const el = railRef.current; if (!el) return;
    el.scrollBy({ left: dir * (ar ? -1 : 1) * (el.clientWidth * 0.9), behavior: "smooth" });
  };

  return (
    <section id="videos" className="vs-section relative px-4 sm:px-6 py-16 lg:py-24" aria-label={ar ? data.titleAr : data.titleEn}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-10 lg:mb-12">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-2">{ar ? data.eyebrowAr : data.eyebrowEn}</p>
            <h2 className="font-display section-title font-bold tracking-tight text-foreground">{ar ? data.titleAr : data.titleEn}</h2>
          </div>
          {videos.length > 3 && <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => scroll(-1)} className="vs-arrow" aria-label={ar ? "السابق" : "Previous"}>{ar ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
            <button type="button" onClick={() => scroll(1)} className="vs-arrow" aria-label={ar ? "التالي" : "Next"}>{ar ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</button>
          </div>}
        </div>
        <div ref={railRef} className="vs-rail flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-2" role="list">
          {videos.map(v => {
            const s = mediaSource(v.url);
            const t = (ar ? v.titleAr : v.titleEn) || (ar ? "فيديو" : "Video");
            const on = playing === v.key && s.url;
            return (
              <div key={v.key} role="listitem" className="vs-thumb snap-start shrink-0 w-[82%] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]">
                <div className="vs-stage relative aspect-video rounded-2xl overflow-hidden">
                  {on ? (
                    s.kind === "video" ? <video src={s.url!} controls autoPlay playsInline className="absolute inset-0 size-full bg-background object-contain" />
                    : <iframe src={`${s.url}${s.url!.includes("?") ? "&" : "?"}autoplay=1`} title={t} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 size-full" />
                  ) : (
                    <button type="button" onClick={() => setPlaying(v.key)} className="group absolute inset-0 size-full" aria-label={`${ar ? "تشغيل" : "Play"}: ${t}`}>
                      {v.poster ? <img src={v.poster} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                        : s.kind === "video" ? <video src={`${s.url}#t=0.5`} muted preload="metadata" playsInline className="absolute inset-0 size-full object-cover" />
                        : <div className="absolute inset-0 vs-fallback" />}
                      <div className="absolute inset-0 vs-scrim opacity-60" />
                      <span className="vs-play absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center size-14 rounded-full">
                        <Play className="size-6 translate-x-0.5 fill-current" />
                      </span>
                    </button>
                  )}
                </div>
                <p className="mt-3 text-[0.95rem] sm:text-base font-semibold text-center line-clamp-2 text-foreground/85">{t}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
