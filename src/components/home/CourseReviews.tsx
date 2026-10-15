import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareQuote, Star, ThumbsUp, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type CourseReview = {
  id: string; course_id: string; trainee_name: string; rating: number | null;
  content_rating: number | null; trainer_rating: number | null; would_recommend: boolean | null;
  comments: string | null; created_at: string;
};

export const courseReviewsOptions = {
  queryKey: ["home", "course-reviews"] as const,
  staleTime: 60_000,
  queryFn: async (): Promise<CourseReview[]> => {
    const { data, error } = await supabase.rpc("get_course_featured_reviews");
    if (error) throw error;
    return (data ?? []) as CourseReview[];
  },
};

export function useCourseReviews() {
  return useQuery(courseReviewsOptions);
}

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return <span className="inline-flex gap-0.5" aria-label={`${value} / 5`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= Math.round(value) ? "fill-[var(--gold)] text-[var(--gold)]" : "text-foreground/20"}`} />)}
  </span>;
}

export function CourseReviewsButton({ reviews, isAr, onOpen }: { reviews: CourseReview[]; isAr: boolean; onOpen: () => void }) {
  if (!reviews.length) return null;
  const rated = reviews.filter((r) => r.rating != null);
  const avg = rated.length ? rated.reduce((a, r) => a + Number(r.rating), 0) / rated.length : 0;
  return <button type="button" onClick={onOpen}
    className="mt-2 w-full flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-xl px-4 py-3 text-sm hover:border-[var(--gold)]/40 hover:bg-white/[0.08] transition">
    <span className="flex items-center gap-2 font-bold"><MessageSquareQuote className="size-4 text-[var(--gold)]" />{isAr ? "آراء المتدربين" : "Trainee reviews"}</span>
    <span className="flex items-center gap-2 text-xs text-muted-foreground">{avg > 0 && <><Stars value={avg} size="size-3.5" /><b className="text-foreground">{avg.toFixed(1)}</b></>}({reviews.length})</span>
  </button>;
}

export function CourseReviewsModal({ title, reviews, isAr, onClose }: { title: string; reviews: CourseReview[]; isAr: boolean; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const rated = reviews.filter((r) => r.rating != null);
  const avg = rated.length ? rated.reduce((a, r) => a + Number(r.rating), 0) / rated.length : 0;
  const rec = reviews.filter((r) => r.would_recommend != null);
  const recPct = rec.length ? Math.round((rec.filter((r) => r.would_recommend).length / rec.length) * 100) : null;
  return <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" dir={isAr ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-label={isAr ? "آراء المتدربين" : "Trainee reviews"}>
    <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />
    <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[2rem] border border-white/15 bg-card/80 backdrop-blur-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)] flex flex-col">
      <div className="absolute -top-24 -end-24 size-64 rounded-full bg-[var(--gold)]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -start-24 size-64 rounded-full bg-[var(--accent)]/20 blur-3xl pointer-events-none" />
      <div className="relative p-6 border-b border-white/10">
        <button onClick={onClose} aria-label={isAr ? "إغلاق" : "Close"} className="absolute top-4 end-4 p-2 rounded-full hover:bg-white/10"><X className="size-5" /></button>
        <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[var(--gold)]">{isAr ? "آراء المتدربين" : "Trainee reviews"}</p>
        <h3 className="mt-1 font-display font-extrabold text-2xl pe-10">{title}</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {avg > 0 && <div className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2.5 flex items-center gap-3"><span className="font-display font-extrabold text-3xl">{avg.toFixed(1)}</span><div><Stars value={avg} /><p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? `${rated.length} تقييم` : `${rated.length} ratings`}</p></div></div>}
          {recPct != null && <div className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2.5 flex items-center gap-3"><ThumbsUp className="size-5 text-emerald-400" /><div><b className="font-display text-xl">{recPct}%</b><p className="text-[11px] text-muted-foreground">{isAr ? "ينصحون بالكورس" : "recommend it"}</p></div></div>}
        </div>
      </div>
      <div className="relative overflow-y-auto p-6 grid gap-4">
        {reviews.map((r) => <article key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="size-10 rounded-full grid place-items-center font-bold bg-gradient-to-br from-[var(--gold)] to-[var(--accent)] text-primary-foreground">{r.trainee_name.charAt(0)}</span>
              <div><b className="block text-sm">{r.trainee_name}</b><span className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { month: "long", year: "numeric" })}</span></div>
            </div>
            {r.rating != null && <Stars value={Number(r.rating)} size="size-3.5" />}
          </div>
          {r.comments ? <p className="mt-3 text-sm leading-relaxed text-foreground/85">“{r.comments}”</p>
            : <p className="mt-3 text-xs text-muted-foreground">{isAr ? "قيّم الكورس بدون تعليق مكتوب" : "Rated without a written comment"}</p>}
          {r.would_recommend && <p className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1"><ThumbsUp className="size-3" />{isAr ? "ينصح بالكورس" : "Recommends this course"}</p>}
        </article>)}
      </div>
    </div>
  </div>;
}
