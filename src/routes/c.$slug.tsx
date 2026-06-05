import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { useEffect, useState } from "react";

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

export const Route = createFileRoute("/c/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Course` },
      { name: "description", content: `Dedicated learning page for ${params.slug}` },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-muted-foreground">Course not found</p>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
  component: WhiteLabelCoursePage,
});

function WhiteLabelCoursePage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [lang, setLang] = useState<"ar" | "en">("ar");

  const { data: course, isLoading } = useQuery({
    queryKey: ["wl-course", slug],
    queryFn: async (): Promise<Course | null> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, title, description, price, currency, cover_emoji, total_hours, logo_url, brand_name, brand_primary_color, brand_tagline_ar, brand_tagline_en, course_goals, target_audience, starts_at, ends_at")
        .eq("slug", slug)
        .eq("active", true)
        .eq("is_archived", false)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Course | null;
    },
  });

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const accent = course?.brand_primary_color || "#0b1736";

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

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: `radial-gradient(circle at top, ${accent}15, transparent 60%), hsl(var(--background))`,
      }}
    >
      {/* Minimal branded header (no global navbar) */}
      <header className="w-full px-6 py-5 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-3">
          {course.logo_url ? (
            <img src={course.logo_url} alt={brandName} className="h-12 w-12 object-contain rounded" />
          ) : (
            <div className="text-3xl">{course.cover_emoji || "🎓"}</div>
          )}
          <div className="leading-tight">
            <div className="font-bold text-foreground" style={{ color: accent }}>{brandName}</div>
            {tagline && <div className="text-xs text-muted-foreground">{tagline}</div>}
          </div>
        </div>
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition"
        >
          {lang === "ar" ? "EN" : "عربي"}
        </button>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div
          className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: `${accent}20`, color: accent }}
        >
          {t("برنامج تدريبي معتمد", "Certified Training Program")}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          {course.title}
        </h1>
        {course.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {course.description}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
          <Stat label={t("الساعات التدريبية", "Training Hours")} value={`${course.total_hours}`} accent={accent} />
          <Stat
            label={t("السعر", "Price")}
            value={course.price ? `${course.price} ${course.currency}` : t("مجاني", "Free")}
            accent={accent}
          />
          {course.starts_at && (
            <Stat
              label={t("البداية", "Starts")}
              value={new Date(course.starts_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
              accent={accent}
            />
          )}
        </div>

        {(course.course_goals || course.target_audience) && (
          <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto mb-10 text-start">
            {course.course_goals && <InfoBox title={t("مخرجات الكورس", "Course outcomes")} body={course.course_goals} accent={accent} />}
            {course.target_audience && <InfoBox title={t("هذا الكورس مناسب لـ", "Best for")} body={course.target_audience} accent={accent} />}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {user ? (
            <Link
              to="/portal"
              className="px-8 py-3 rounded-lg font-semibold text-white transition hover:opacity-90"
              style={{ background: accent }}
            >
              {t("اذهب إلى البوابة", "Go to Portal")}
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="px-8 py-3 rounded-lg font-semibold text-white transition hover:opacity-90"
                style={{ background: accent }}
              >
                {t("سجّل الآن", "Enroll Now")}
              </Link>
              <Link
                to="/auth"
                className="px-8 py-3 rounded-lg font-semibold border border-border hover:bg-muted transition"
              >
                {t("تسجيل الدخول", "Sign In")}
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/30">
        © {new Date().getFullYear()} {brandName}
      </footer>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/50">
      <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function InfoBox({ title, body, accent }: { title: string; body: string; accent: string }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card/50">
      <div className="text-sm font-bold" style={{ color: accent }}>{title}</div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{body}</p>
    </div>
  );
}
