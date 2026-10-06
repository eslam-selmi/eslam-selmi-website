import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Star, ThumbsUp, MessageSquare, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["course_feedback"]["Row"];
type CourseLite = { id: string; title: string };

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function CourseFeedbackPanel({ courses }: { courses: CourseLite[] }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [courseId, setCourseId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    })();
  }, []);

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? "—";
  const filtered = courseId === "all" ? rows : rows.filter((r) => r.course_id === courseId);

  const perCourse = useMemo(() => {
    const m = new Map<string, Row[]>();
    rows.forEach((r) => m.set(r.course_id, [...(m.get(r.course_id) ?? []), r]));
    return [...m.entries()].map(([id, rs]) => ({
      id, count: rs.length,
      content: avg(rs.map((r) => r.content_rating)),
      trainer: avg(rs.map((r) => r.trainer_rating)),
      satisfaction: Math.round((rs.filter((r) => (r.content_rating + r.trainer_rating + r.expectations_rating) / 3 >= 4).length / rs.length) * 100),
      recommend: Math.round((rs.filter((r) => r.would_recommend).length / rs.length) * 100),
    }));
  }, [rows]);

  const kpi = {
    count: filtered.length,
    content: avg(filtered.map((r) => r.content_rating)),
    trainer: avg(filtered.map((r) => r.trainer_rating)),
    satisfaction: filtered.length ? Math.round((filtered.filter((r) => (r.content_rating + r.trainer_rating + r.expectations_rating) / 3 >= 4).length / filtered.length) * 100) : 0,
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t("جاري التحميل...", "Loading...")}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
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
              <span>{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-secondary">{t("المحتوى", "Content")} {r.content_rating}★</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary">{t("المدرب", "Trainer")} {r.trainer_rating}★</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary">{t("التوقعات", "Expectations")} {r.expectations_rating}★</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary">{t("السرعة", "Pace")}: {r.pace === "slow" ? t("بطيئة", "Slow") : r.pace === "fast" ? t("سريعة", "Fast") : t("مناسبة", "Right")}</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary">{r.would_recommend ? t("يرشّح ✓", "Recommends ✓") : t("لا يرشّح", "Doesn't recommend")}</span>
            </div>
            {r.comments && <p className="text-sm text-foreground whitespace-pre-wrap">{r.comments}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
