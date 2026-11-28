import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type T = (a: string, b: string) => string;
const db = supabase as any;

/** Live sessions and grading for the trainer's own courses. The database refuses anything outside his tenant. */
export function TrainerClassroom({ courses, t }: { courses: { id: string; title: string }[]; t: T }) {
  const qc = useQueryClient();
  const ids = courses.map((c) => c.id);
  const key = ["trainer-classroom", ids.join(",")];
  const q = useQuery({
    queryKey: key, enabled: ids.length > 0,
    queryFn: async () => {
      const [s, a] = await Promise.all([
        db.from("course_sessions").select("id,course_id,title,starts_at,duration_minutes,online_url").in("course_id", ids).order("starts_at"),
        db.from("assignments").select("id,course_id,title,max_score").in("course_id", ids),
      ]);
      if (s.error) throw s.error;
      const aids = (a.data ?? []).map((x: any) => x.id);
      const sub = aids.length ? await db.from("assignment_submissions").select("id,assignment_id,user_id,content,link,score,feedback").in("assignment_id", aids) : { data: [] };
      return { sessions: (s.data ?? []) as any[], assignments: (a.data ?? []) as any[], subs: (sub.data ?? []) as any[] };
    },
  });
  const [err, setErr] = useState<string | null>(null);
  if (ids.length === 0) return null;
  if (q.error) return <p className="text-sm text-destructive">{(q.error as Error).message}</p>;
  const d = q.data;
  const refresh = () => qc.invalidateQueries({ queryKey: ["trainer-classroom"] });

  async function addSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(null);
    const form = e.currentTarget;
    const f = new FormData(form);
    const starts = String(f.get("starts") ?? "");
    if (!starts) return setErr(t("حدد الموعد", "Pick a start time"));
    const { error } = await db.from("course_sessions").insert({
      course_id: String(f.get("course")), title: String(f.get("title") ?? "").trim() || t("جلسة", "Session"),
      starts_at: new Date(starts).toISOString(), duration_minutes: Math.max(1, Number(f.get("mins")) || 60), online_url: String(f.get("url") ?? "") || null,
    });
    if (error) return setErr(error.message);
    form.reset(); refresh();
  }
  async function grade(e: React.FormEvent<HTMLFormElement>, id: string, max: number) {
    e.preventDefault(); setErr(null);
    const form = e.currentTarget;
    const f = new FormData(form); const score = Number(f.get("score"));
    if (!(score >= 0 && score <= max)) return setErr(t(`الدرجة من 0 إلى ${max}`, `Score must be 0 to ${max}`));
    const { error } = await db.from("assignment_submissions").update({ score, feedback: String(f.get("feedback") ?? "") || null, graded_at: new Date().toISOString() }).eq("id", id);
    if (error) return setErr(error.message);
    toast.success(t("تم التقييم", "Graded")); refresh();
  }
  async function delSession(id: string) {
    const { error } = await db.from("course_sessions").delete().eq("id", id);
    if (error) return setErr(error.message);
    refresh();
  }
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">{t("الجلسات والتقييم", "Sessions and grading")}</h2>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <form onSubmit={addSession} className="flex flex-wrap gap-2 items-end text-sm">
        <label className="flex flex-col gap-1">{t("الكورس", "Course")}<select name="course" className="border rounded px-2 py-1 bg-background">{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label className="flex flex-col gap-1">{t("عنوان الجلسة", "Session title")}<input name="title" className="border rounded px-2 py-1 bg-background" /></label>
        <label className="flex flex-col gap-1">{t("الموعد", "Starts")}<input name="starts" type="datetime-local" dir="ltr" className="border rounded px-2 py-1 bg-background" /></label>
        <label className="flex flex-col gap-1">{t("المدة (دقيقة)", "Minutes")}<input name="mins" type="number" min={1} defaultValue={60} dir="ltr" className="w-20 border rounded px-2 py-1 bg-background" /></label>
        <label className="flex flex-col gap-1">{t("رابط الجلسة", "Session link")}<input name="url" type="url" dir="ltr" className="border rounded px-2 py-1 bg-background" /></label>
        <button className="px-3 py-1.5 rounded border">{t("إضافة جلسة", "Add session")}</button>
      </form>
      <ul className="rounded-xl border divide-y text-sm">
        {(d?.sessions ?? []).length === 0 && <li className="p-3 text-muted-foreground">{t("لا جلسات.", "No sessions.")}</li>}
        {(d?.sessions ?? []).map((s) => (
          <li key={s.id} className="p-3 flex justify-between gap-2"><span>{s.title} · <bdi dir="ltr">{new Date(s.starts_at).toLocaleString()}</bdi></span>
            <button className="underline" onClick={() => delSession(s.id)}>{t("حذف", "Delete")}</button></li>
        ))}
      </ul>
      <h3 className="text-sm font-medium">{t("تسليمات المتدربين", "Learner submissions")}</h3>
      <ul className="rounded-xl border divide-y text-sm">
        {(d?.subs ?? []).length === 0 && <li className="p-3 text-muted-foreground">{t("لا تسليمات.", "No submissions.")}</li>}
        {(d?.subs ?? []).map((s) => {
          const a = d!.assignments.find((x) => x.id === s.assignment_id); const max = Number(a?.max_score ?? 100);
          return (
            <li key={s.id} className="p-3 space-y-2">
              <div><b>{a?.title}</b> · <bdi>{s.content}</bdi> {s.link && <bdi dir="ltr" className="text-xs">{s.link}</bdi>}</div>
              <form onSubmit={(e) => grade(e, s.id, max)} className="flex flex-wrap gap-2 items-end">
                <label className="flex flex-col gap-1 text-xs">{t(`الدرجة (من ${max})`, `Score (of ${max})`)}<input name="score" type="number" min={0} max={max} defaultValue={s.score ?? ""} dir="ltr" className="w-24 border rounded px-2 py-1 bg-background" /></label>
                <label className="flex flex-col gap-1 text-xs flex-1">{t("ملاحظات", "Feedback")}<input name="feedback" defaultValue={s.feedback ?? ""} className="border rounded px-2 py-1 bg-background" /></label>
                <button className="px-3 py-1.5 rounded border">{t("حفظ التقييم", "Save grade")}</button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
