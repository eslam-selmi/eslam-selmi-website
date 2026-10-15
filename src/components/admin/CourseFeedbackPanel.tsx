import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Star, ThumbsUp, MessageSquare, Users, Sparkles, Home } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FeedbackQuestionsManager } from "./FeedbackQuestionsManager";
import { invalidateSiteContent } from "@/lib/site-content";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["course_feedback"]["Row"];
type CourseLite = { id: string; title: string };

const nums = (rs: Row[], k: "content_rating" | "trainer_rating" | "expectations_rating") => rs.map((r) => r[k]).filter((x): x is number => x != null);
const sat = (r: Row) => { const xs = [r.content_rating, r.trainer_rating, r.expectations_rating].filter((x): x is number => x != null); return xs.length > 0 && xs.reduce((a, b) => a + b, 0) / xs.length >= 4; };
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function CourseFeedbackPanel({ courses }: { courses: CourseLite[] }) {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const [rows, setRows] = useState<Row[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [courseId, setCourseId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"results" | "questions">("results");
  const [homeRow, setHomeRow] = useState<{ id: string; is_visible: boolean } | null>(null);
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_feedback").select("*").order("created_at", { ascending: false });
      const list = data ?? [];
      setRows(list);
      const ids = [...new Set(list.map((r) => r.user_id))];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        setNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name || p.email || "—"])));
      }
      const { data: hr } = await supabase.from("site_content").select("id,is_visible").eq("section_key", "home.trainee_reviews").maybeSingle();
      setHomeRow(hr ?? null);
      setLoading(false);
    })();
  }, []);

  async function toggleHome() {
    const next = !(homeRow?.is_visible ?? false);
    const res = homeRow
      ? await supabase.from("site_content").update({ is_visible: next }).eq("id", homeRow.id).select("id,is_visible").single()
      : await supabase.from("site_content").insert({ section_key: "home.trainee_reviews", label: "آراء المتدربين", content: {}, is_visible: next }).select("id,is_visible").single();
    if (res.error) return toast.error(res.error.message);
    setHomeRow(res.data); invalidateSiteContent();
    toast.success(next ? t("القسم ظاهر الآن في الصفحة الرئيسية", "Section is now on the homepage") : t("تم إخفاء القسم", "Section hidden"));
  }

  async function toggleFeatured(r: Row) {
    const { error } = await supabase.from("course_feedback").update({ is_featured: !r.is_featured }).eq("id", r.id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, is_featured: !r.is_featured } : x)));
  }

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? "—";
  const filtered = (courseId === "all" ? rows : rows.filter((r) => r.course_id === courseId)).filter((r) => !onlyFeatured || r.is_featured);
  const featuredCount = rows.filter((r) => r.is_featured).length;

  const perCourse = useMemo(() => {
    const m = new Map<string, Row[]>();
    rows.forEach((r) => m.set(r.course_id, [...(m.get(r.course_id) ?? []), r]));
    return [...m.entries()].map(([id, rs]) => ({
      id, count: rs.length,
      content: avg(nums(rs, "content_rating")),
      trainer: avg(nums(rs, "trainer_rating")),
      satisfaction: Math.round((rs.filter(sat).length / rs.length) * 100),
      recommend: Math.round((rs.filter((r) => r.would_recommend).length / rs.length) * 100),
    }));
  }, [rows]);

  const kpi = {
    count: filtered.length,
    content: avg(nums(filtered, "content_rating")),
    trainer: avg(nums(filtered, "trainer_rating")),
    satisfaction: filtered.length ? Math.round((filtered.filter(sat).length / filtered.length) * 100) : 0,
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t("جاري التحميل...", "Loading...")}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Home className="size-5 text-accent" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t("عرض آراء المتدربين في الصفحة الرئيسية", "Show trainee reviews on the homepage")}</p>
            <p className="text-xs text-muted-foreground">{t(`يظهر فقط التعليقات المميزة (${featuredCount})`, `Only featured comments are shown (${featuredCount})`)}</p>
          </div>
        </div>
        <Button size="sm" variant={homeRow?.is_visible ? "default" : "outline"} onClick={toggleHome}>
          {homeRow?.is_visible ? t("ظاهر ✓", "Shown ✓") : t("مخفي — اضغط للإظهار", "Hidden — click to show")}
        </Button>
      </div>

      <div className="flex gap-2 border-b border-border">
        {([["results", t("النتائج والتعليقات", "Results & comments")], ["questions", t("أسئلة التقييم", "Questions")]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${view === k ? "border-accent text-foreground" : "border-transparent text-muted-foreground"}`}>{l}</button>
        ))}
      </div>

      {view === "questions" ? <FeedbackQuestionsManager /> : <>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={onlyFeatured} onChange={(e) => setOnlyFeatured(e.target.checked)} /> {t("المميزة فقط", "Featured only")}</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
          className="h-10 px-3 rounded-lg bg-card border border-border text-sm text-foreground">
          <option value="all">{t("كل الكورسات", "All courses")}</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: t("عدد التقييمات", "Responses"), value: String(kpi.count) },
          { icon: Star, label: t("متوسط المحتوى", "Content avg"), value: kpi.content.toFixed(1) + " / 5" },
          { icon: Star, label: t("متوسط المدرب", "Trainer avg"), value: kpi.trainer.toFixed(1) + " / 5" },
          { icon: ThumbsUp, label: t("نسبة الرضا", "Satisfaction"), value: kpi.satisfaction + "%" },
        ].map((k) => (
          <div key={k.label} className="dash-card p-4">
            <k.icon className="w-4 h-4 text-accent mb-2" />
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {courseId === "all" && perCourse.length > 0 && (
        <div className="dash-card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr>{[t("الكورس", "Course"), t("التقييمات", "Responses"), t("المحتوى", "Content"), t("المدرب", "Trainer"), t("الرضا", "Satisfaction"), t("يرشّحون", "Recommend")].map((h) => <th key={h} className="p-3 text-start font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {perCourse.map((c) => (
                <tr key={c.id} className="border-b border-border/50 cursor-pointer hover:bg-secondary/40" onClick={() => setCourseId(c.id)}>
                  <td className="p-3 font-semibold text-foreground">{courseTitle(c.id)}</td>
                  <td className="p-3">{c.count}</td>
                  <td className="p-3">{c.content.toFixed(1)}</td>
                  <td className="p-3">{c.trainer.toFixed(1)}</td>
                  <td className="p-3">{c.satisfaction}%</td>
                  <td className="p-3">{c.recommend}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-bold flex items-center gap-2 text-foreground"><MessageSquare className="w-4 h-4 text-accent" /> {t("تعليقات المتدربين", "Trainee comments")}</h3>
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">{t("لا توجد تقييمات بعد", "No feedback yet")}</p>}
        {filtered.map((r) => (
          <div key={r.id} className="dash-card p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{names[r.user_id] ?? "—"} · {courseTitle(r.course_id)}</span>
              <span className="flex items-center gap-2">{new Date(r.created_at).toLocaleDateString()}
                <Button size="sm" variant={r.is_featured ? "default" : "outline"} onClick={() => toggleFeatured(r)}>
                  <Sparkles className="size-3.5" /> {r.is_featured ? t("معروض في الرئيسية", "On homepage") : t("اعرض في الرئيسية", "Feature")}
                </Button>
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-secondary">{t("المحتوى", "Content")} {r.content_rating ?? "—"}★</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary">{t("المدرب", "Trainer")} {r.trainer_rating ?? "—"}★</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary">{t("التوقعات", "Expectations")} {r.expectations_rating ?? "—"}★</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary">{t("السرعة", "Pace")}: {r.pace === "slow" ? t("بطيئة", "Slow") : r.pace === "fast" ? t("سريعة", "Fast") : t("مناسبة", "Right")}</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary">{r.would_recommend ? t("يرشّح ✓", "Recommends ✓") : t("لا يرشّح", "Doesn't recommend")}</span>
            </div>
            <CustomAnswers answers={r.answers} />
            {r.comments && <p className="text-sm text-foreground whitespace-pre-wrap">{r.comments}</p>}
          </div>
        ))}
      </div>
      </>}
    </div>
  );
}

function CustomAnswers({ answers }: { answers: unknown }) {
  const { lang } = useI18n();
  const [qs, setQs] = useState<{ id: string; label_ar: string; label_en: string; options: unknown }[]>([]);
  const a = (answers && typeof answers === "object" ? answers : {}) as Record<string, unknown>;
  const keys = Object.keys(a);
  useEffect(() => {
    if (!keys.length) return;
    supabase.from("feedback_questions").select("id,label_ar,label_en,options").in("id", keys).then(({ data }) => setQs(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join()]);
  if (!keys.length) return null;
  return <div className="flex flex-wrap gap-2 text-xs">{qs.map((q) => {
    const v = a[q.id];
    const opt = Array.isArray(q.options) ? (q.options as { value: string; ar: string; en: string }[]).find((o) => o.value === v) : undefined;
    const shown = opt ? (lang === "ar" ? opt.ar : opt.en) : typeof v === "boolean" ? (v ? "✓" : "✗") : typeof v === "number" ? `${v}★` : String(v);
    return <span key={q.id} className="px-2 py-0.5 rounded-full border border-border">{lang === "ar" ? q.label_ar : q.label_en}: {shown}</span>;
  })}</div>;
}
