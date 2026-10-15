import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Star, Quote, BadgeCheck } from "lucide-react";

type Item = { id: string; trainee_name: string; course_title: string; rating: number | null; comments: string };

export function TraineeReviews() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    supabase.rpc("get_featured_feedback").then(({ data }) => setItems((data ?? []) as Item[]));
  }, []);

  if (items.length === 0) return null;
  const avg = items.filter((i) => i.rating).reduce((a, i) => a + Number(i.rating), 0) / (items.filter((i) => i.rating).length || 1);

  return (
    <section id="trainee-reviews" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{isAr ? "آراء المتدربين" : "Trainee reviews"}</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">{isAr ? "ماذا يقول من تدرّبوا معنا" : "What our trainees say"}</h2>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-foreground">
            <span className="flex" dir="ltr">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-4 h-4 ${n <= Math.round(avg) ? "fill-accent text-accent" : "text-muted-foreground/40"}`} />)}</span>
            <span className="font-bold tabular-nums">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground">· {items.length} {isAr ? "تقييم موثّق" : "verified reviews"}</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <figure key={i.id} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <Quote className="absolute top-4 end-4 w-8 h-8 text-accent/20" />
              {i.rating && <div className="flex mb-3" dir="ltr">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-4 h-4 ${n <= Math.round(Number(i.rating)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />)}</div>}
              <blockquote className="text-sm leading-relaxed text-foreground line-clamp-6">{i.comments}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-bold text-foreground">{i.trainee_name.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1">{i.trainee_name} <BadgeCheck className="w-3.5 h-3.5 text-accent" /></p>
                  <p className="text-xs text-muted-foreground truncate">{i.course_title}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
