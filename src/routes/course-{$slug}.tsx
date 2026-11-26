import { createFileRoute, Link, useNavigate, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { useI18n } from "@/lib/i18n";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";

type Course = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  cover_emoji: string | null;
  total_hours: number;
  logo_url: string | null;
  brand_name: string | null;
  brand_primary_color: string | null;
  brand_tagline_ar: string | null;
  brand_tagline_en: string | null;
  course_goals: string | null;
  target_audience: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

export const Route = createFileRoute("/course-{$slug}")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Course` },
      { name: "description", content: `Dedicated learning page for ${params.slug}` },
      { property: "og:title", content: `${params.slug} — Course | Eslam Selmi` },
      { property: "og:description", content: `Dedicated learning page for ${params.slug}` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-muted-foreground">Course not found</p>
    </div>
  ),
  errorComponent: ({ error }: ErrorComponentProps) => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-destructive">{(error as Error).message}</p>
    </div>
  ),
  component: WhiteLabelCoursePage,
});

function WhiteLabelCoursePage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const { lang, setLang } = useI18n();

  const { data: course, isLoading } = useQuery({
    queryKey: ["wl-course", slug],
    queryFn: async (): Promise<Course | null> => {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "id, slug, title, description, price, currency, cover_emoji, total_hours, logo_url, brand_name, brand_primary_color, brand_tagline_ar, brand_tagline_en, course_goals, target_audience, starts_at, ends_at",
        )
        .eq("slug", slug)
        .eq("active", true)
        .eq("is_archived", false)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Course | null;
    },
  });

  // Stable course URL: a signed-in trainee who is approved in this course goes straight into it. The URL itself grants nothing.
  const nav = useNavigate();
  const { data: enrolled } = useQuery({
    queryKey: ["wl-enrolled", course?.id, user?.id],
    enabled: !!course?.id && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("enrollments").select("id").eq("user_id", user!.id).eq("course_id", course!.id).eq("status", "approved").maybeSingle();
      return !!data;
    },
  });
  useEffect(() => {
    if (enrolled && course?.id) nav({ to: "/portal", search: { view: course.id } as never, replace: true });
  }, [enrolled, course?.id, nav]);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">{t("الكورس غير متاح", "Course not available")}</p>
      </div>
    );
  }

  const tagline = lang === "ar" ? course.brand_tagline_ar : course.brand_tagline_en;
  const brandName = course.brand_name || course.title;

  const lines = (txt: string | null) => (txt ?? "").split(/\r?\n/).map((x) => x.replace(/^[\s•\-–*]+/, "").trim()).filter(Boolean);
  const goals = lines(course.course_goals);
  const audience = lines(course.target_audience);
  const hours = Number(course.total_hours) > 0 ? Number(course.total_hours) : 0;
  const price = Number(course.price) > 0 ? `${course.price} ${course.currency}` : null;
  const TURQ = "oklch(0.78 0.12 195)";
  const cta = user ? (
    <Link to="/portal" className="inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-base font-bold transition hover:brightness-110" style={{ background: TURQ, color: "#06122b" }}>
      {t("افتح بوابتك", "Open your portal")}
    </Link>
  ) : (
    <Link to="/auth" className="inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-base font-bold transition hover:brightness-110" style={{ background: TURQ, color: "#06122b" }}>
      {t("تسجيل الدخول للكورس", "Sign in to the course")}
    </Link>
  );

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen w-full text-white"
      style={{ background: "radial-gradient(ellipse 80% 50% at 15% -10%, oklch(0.42 0.14 258 / 0.55), transparent 60%), radial-gradient(ellipse 60% 40% at 90% 0%, oklch(0.6 0.1 195 / 0.25), transparent 60%), #07112a" }}
    >
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <img src={brandLogoAsset.url} alt={brandName} className="h-9 w-auto" />
        <div className="flex items-center gap-2.5">
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10">
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <Link to={user ? "/portal" : "/auth"} className="rounded-lg px-4 py-1.5 text-sm font-semibold" style={{ background: TURQ, color: "#06122b" }}>
            {user ? t("بوابتي", "My portal") : t("دخول", "Sign in")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: TURQ }}>
            <span className="h-px w-8" style={{ background: TURQ }} />
            {t("كورس تدريبي", "Training course")}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl" style={{ lineHeight: 1.25, fontFamily: '"Thmanyah Serif Display", "IBM Plex Sans Arabic", serif' }}>{course.title}</h1>
          {course.description && <p className="mt-5 text-base leading-8 text-white/80 sm:text-lg">{course.description}</p>}
          {(hours > 0 || price) && (
            <div className="mt-6 flex flex-wrap gap-2.5">
              {hours > 0 && <span className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-white/90">{t(`${hours} ساعة تدريبية`, `${hours} training hours`)}</span>}
              {price && <span className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-white/90">{price}</span>}
            </div>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">{cta}</div>
          {!user && <p className="mt-3 text-sm text-white/60">{t("الدخول بالإيميل وكلمة السر المسجلين لك. الرابط للتوجيه فقط ولا يمنح صلاحية.", "Sign in with your assigned email and password. This link only points to the course; it does not grant access.")}</p>}
        </div>

        {(goals.length > 0 || audience.length > 0) && (
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {goals.length > 0 && <Panel title={t("هتخرج من الكورس بإيه", "What you will be able to do")} items={goals} />}
            {audience.length > 0 && <Panel title={t("الكورس مناسب لـ", "Who it is for")} items={audience} />}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/50">© 2027 {t("إسلام سلمي", "Eslam Selmi")}</footer>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.045] p-6">
      <h2 className="mb-4 text-xl font-bold text-white" style={{ fontFamily: '"Thmanyah Serif Display", "IBM Plex Sans Arabic", serif' }}>{title}</h2>
      <ul className="space-y-3">
        {items.map((x, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-7 text-white/85">
            <span className="mt-2 inline-block size-2 shrink-0 rounded-full" style={{ background: "oklch(0.78 0.12 195)" }} />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
