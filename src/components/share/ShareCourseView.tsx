import { VideoWithCues } from "@/components/VideoWithCues";
import { visibleItemText } from "@/lib/video-cues";
import { safeHref } from "@/lib/safe-url";
import { mediaSource } from "@/lib/media-url";
import type { Progress } from "@/lib/course-share-core";
import type { VisitorCourse, VisitorItem } from "@/lib/course-share-service";

const T = {
  ar: { open: "فتح", done: "تم", marked: "✓ تم", finished: "خلصت الكورس", units: "عنصر", watched: "✓ اتشاهد" },
  en: { open: "Open", done: "Mark done", marked: "✓ Done", finished: "Course finished", units: "items", watched: "✓ Watched" },
};
type Props = { lang: "ar" | "en"; course: VisitorCourse; progress: Progress; finished?: boolean; onProgress: (itemId: string, patch: Progress[string]) => void };

function Item({ it, lang, p, onProgress }: { it: VisitorItem; lang: "ar" | "en"; p: Progress[string] | undefined; onProgress: (patch: Progress[string]) => void }) {
  const t = T[lang];
  const text = visibleItemText(it.content);
  const href = it.kind === "link" ? safeHref(it.url) : it.url;
  // Lectures stored as a plain link or file (the TNA unit videos) must still play inside the page, with their questions, like in the trainee view.
  const media = it.url && (it.kind === "link" || it.kind === "file") ? mediaSource(it.url) : null;
  const playInline = media?.kind === "video" ? "video" : media?.kind === "embed" ? "embed" : null;
  return (
    <li className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
      <p className="font-medium text-sm">{it.title}</p>
      {text && <p className="text-xs text-white/65 whitespace-pre-wrap">{text}</p>}
      {(it.kind === "video" || playInline === "video") && it.url && (
        <div className="aspect-video overflow-hidden rounded-lg">
          <VideoWithCues src={it.url} content={it.content} isAr={lang === "ar"} onProgress={(v) => onProgress(v)} />
        </div>
      )}
      {(it.kind === "embed" || playInline === "embed") && it.url && /^https:\/\//i.test(media?.url || it.url) && <iframe referrerPolicy="no-referrer" src={media?.url || it.url} title={it.title} className="w-full aspect-video rounded-lg border-0" allowFullScreen onLoad={() => onProgress({ opened: true })} />}
      {["pdf", "file", "link"].includes(it.kind) && !playInline && href && (
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => onProgress({ opened: true })} className="inline-block text-xs text-[#2dd4bf] underline">{p?.opened ? t.marked : t.open}</a>
      )}
      {(it.kind === "note" || it.kind === "text") && (
        <button onClick={() => onProgress({ markedDone: true })} className="text-xs rounded-lg border border-[#2dd4bf]/40 px-3 h-8 text-[#2dd4bf]">{p?.markedDone ? t.marked : t.done}</button>
      )}
      {(it.kind === "video" || playInline === "video") && p?.ended && <p className="text-xs text-[#2dd4bf]">{t.watched}</p>}
    </li>
  );
}

export function ShareCourseView({ lang, course, progress, finished, onProgress }: Props) {
  const t = T[lang];
  const n = course.modules.reduce((a, m) => a + m.items.length, 0);
  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#0b1736] text-white px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1"><h1 className="text-2xl font-bold">{course.title}</h1><p className="text-sm text-white/60">{n} {t.units}</p></header>
        {finished && <p className="rounded-xl border border-[#2dd4bf]/40 bg-[#2dd4bf]/10 p-3 text-sm">{t.finished}</p>}
        {course.modules.map((m) => (
          <section key={m.id} className="space-y-3"><h2 className="font-semibold text-lg">{m.title}</h2>
            <ul className="space-y-3">{m.items.map((it) => <Item key={it.id} it={it} lang={lang} p={progress[it.id]} onProgress={(patch) => onProgress(it.id, patch)} />)}</ul></section>
        ))}
      </div>
    </main>
  );
}
