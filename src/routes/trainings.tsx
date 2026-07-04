import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Nav, Footer, type ThemeMode } from "@/routes/index";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  GraduationCap,
  Target,
  Lightbulb,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";


export const Route = createFileRoute("/trainings")({
  head: () => ({
    meta: [
      { title: "التدريبات والممارسات · إسلام سلمي" },
      {
        name: "description",
        content:
          "مجموعة مختارة من حالات تدريبية واقعية صمّمها وقادها إسلام سلمي — التحدي، المنهجية، والأثر.",
      },
      { property: "og:title", content: "التدريبات والممارسات · إسلام سلمي" },
      {
        property: "og:description",
        content: "حالات تدريبية مختارة: التحدي، المنهجية، والأثر.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainingsPage,
});

type TrainingRow = {
  id: string;
  title_ar: string;
  title_en: string | null;
  role_ar: string | null;
  role_en: string | null;
  period_ar: string | null;
  period_en: string | null;
  cover_url: string | null;
  challenge_ar: string | null;
  challenge_en: string | null;
  solution_ar: string | null;
  solution_en: string | null;
  result_ar: string | null;
  result_en: string | null;
  gallery: string[];
  tags: string[];
  is_featured: boolean;
};

function TrainingsPage() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const { theme, toggle } = useTheme();
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<TrainingRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("trainings")
        .select(
          "id,title_ar,title_en,role_ar,role_en,period_ar,period_en,cover_url,challenge_ar,challenge_en,solution_ar,solution_en,result_ar,result_en,gallery,tags,is_featured",
        )
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setRows(
          ((data as any) ?? []).map((r: any) => ({
            ...r,
            gallery: Array.isArray(r.gallery) ? r.gallery : [],
            tags: Array.isArray(r.tags) ? r.tags : [],
          })),
        );
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground" dir={dir}>
      <Nav theme={theme as ThemeMode} onThemeToggle={toggle} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-foreground/10">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{
            background:
              "radial-gradient(60% 80% at 20% 0%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%), radial-gradient(50% 70% at 100% 100%, color-mix(in oklab, var(--gold) 18%, transparent), transparent 60%), linear-gradient(180deg, color-mix(in oklab, var(--background) 96%, transparent), var(--background))",
          }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 80%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-[11px] font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              {tt("التدريبات والممارسات", "Trainings & practice")}
            </div>
            <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
              {tt("حالات تدريبية", "Selected training")}
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(110deg, var(--foreground) 0%, var(--accent) 55%, var(--gold) 100%)",
                }}
              >
                {tt("مختارة ومؤثّرة", "case studies")}
              </span>
            </h1>
            <p className="mt-5 text-foreground/70 text-base sm:text-lg leading-relaxed max-w-2xl">
              {tt(
                "نماذج حقيقية من برامج تدريبية صمّمتها وقُدتها — التحدي الذي واجهناه، المنهجية التي بنيناها، والأثر الذي تحقّق.",
                "Real programs I designed and led — the challenge we faced, the methodology we built, and the impact we delivered.",
              )}
            </p>
            <div className="mt-6 flex items-center gap-4 text-xs text-foreground/55">
              <div className="inline-flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-accent" />
                {rows.length > 0
                  ? tt(`${rows.length} حالة موثّقة`, `${rows.length} documented cases`)
                  : tt("محتوى قادم", "Content coming")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">


        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-foreground/[0.04] animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20 text-foreground/50">
            {tt("لا توجد حالات تدريبية منشورة بعد.", "No training case studies published yet.")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[260px] gap-5">
            {rows.map((r, i) => {
              const title = isAr ? r.title_ar : r.title_en || r.title_ar;
              const role = isAr ? r.role_ar : r.role_en || r.role_ar;
              const span =
                r.is_featured && i % 5 === 0
                  ? "sm:col-span-2 sm:row-span-2"
                  : r.is_featured
                    ? "lg:row-span-2"
                    : "";
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActive(r)}
                  className={`group relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] hover:border-accent/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_22px_60px_-30px_var(--accent)] text-start ${span}`}
                >
                  {r.cover_url ? (
                    <img
                      src={r.cover_url}
                      alt={title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-foreground/[0.04] to-transparent" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end gap-2">
                    {r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {r.tags.slice(0, 3).map((tag, j) => (
                          <span
                            key={j}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 border border-white/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h3 className="text-white font-extrabold text-lg sm:text-xl leading-snug drop-shadow line-clamp-3">
                      {title}
                    </h3>
                    {role && <div className="text-xs text-white/80 line-clamp-1">{role}</div>}
                    <div className="pt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--gold)]">
                      {tt("استعرض الحالة الكاملة", "View full case study")} →
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <TrainingModal training={active} onClose={() => setActive(null)} />
      </div>
      <Footer />
    </main>
  );
}

function TrainingModal({
  training,
  onClose,
}: {
  training: TrainingRow | null;
  onClose: () => void;
}) {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!training) return null;
  const title = isAr ? training.title_ar : training.title_en || training.title_ar;
  const role = isAr ? training.role_ar : training.role_en || training.role_ar;
  const period = isAr ? training.period_ar : training.period_en || training.period_ar;
  const challenge = isAr ? training.challenge_ar : training.challenge_en || training.challenge_ar;
  const solution = isAr ? training.solution_ar : training.solution_en || training.solution_ar;
  const result = isAr ? training.result_ar : training.result_en || training.result_ar;

  const Block = ({
    icon: Icon,
    label,
    body,
    tint,
  }: {
    icon: any;
    label: string;
    body: string | null;
    tint: string;
  }) => {
    if (!body) return null;
    return (
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 relative overflow-hidden">
        <div
          className="absolute -top-12 -end-12 w-32 h-32 rounded-full blur-3xl opacity-40"
          style={{ background: tint }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)] mb-2">
            <Icon className="w-4 h-4" />
            {label}
          </div>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed whitespace-pre-wrap">
            {body}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={!!training} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
          <div className="relative h-44 sm:h-56 flex-shrink-0 overflow-hidden bg-black/40">
            {training.cover_url ? (
              <img src={training.cover_url} className="w-full h-full object-cover" alt={title} />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-transparent" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6" dir={dir}>
              {training.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {training.tags.map((tag, j) => (
                    <span
                      key={j}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 border border-white/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h2 className="text-white font-extrabold text-xl sm:text-3xl leading-tight drop-shadow">
                {title}
              </h2>
              <div className="mt-1.5 text-xs sm:text-sm text-white/80 flex flex-wrap gap-x-3 gap-y-1">
                {role && <span>{role}</span>}
                {period && <span>· {period}</span>}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-5" dir={dir}>
            <Block
              icon={Target}
              label={tt("التحدي", "The Challenge")}
              body={challenge}
              tint="rgba(239,68,68,0.35)"
            />
            <Block
              icon={Lightbulb}
              label={tt("الحل / المنهجية", "The Solution")}
              body={solution}
              tint="rgba(212,175,55,0.35)"
            />
            <Block
              icon={TrendingUp}
              label={tt("النتائج والأثر", "Results & Impact")}
              body={result}
              tint="rgba(34,197,94,0.35)"
            />

            {training.gallery.length > 0 && (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
                  <Award className="w-4 h-4" />
                  {tt("من معرض البرنامج", "Program gallery")}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {training.gallery.map((url, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setLightbox(url)}
                      className="aspect-square rounded-xl overflow-hidden border border-foreground/10 hover:border-accent/40 transition group"
                    >
                      <img
                        src={url}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        alt=""
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="!max-w-4xl w-[95vw] p-0 overflow-hidden bg-black/95">
          {lightbox && (
            <img src={lightbox} className="w-full h-auto max-h-[85vh] object-contain" alt="" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
