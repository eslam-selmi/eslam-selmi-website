import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/PortalShell";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Loader2, BookOpen, Users, FileText, Check, Calendar, GraduationCap } from "lucide-react";
import { ForcePasswordResetGate } from "@/components/ForcePasswordResetGate";


export const Route = createFileRoute("/trainer")({
  head: () => ({
    meta: [
      { title: "لوحة المدرّب · أكاديمية إسلام سلمي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrainerPage,
});

type Course = {
  id: string; title: string; cover_emoji: string | null;
  starts_at: string | null; ends_at: string | null;
  description: string | null;
};
type Enrollment = {
  id: string; user_id: string; course_id: string; status: string; blocked: boolean;
  profiles?: { full_name: string | null; email: string | null } | null;
};
type Assignment = { id: string; title: string; course_id: string; max_score: number; due_date: string | null };
type Submission = {
  id: string; assignment_id: string; user_id: string;
  content: string | null; link: string | null;
  score: number | null; feedback: string | null;
  submitted_at: string; graded_at: string | null;
};

function TrainerPage() {
  const { user, role, loading, forcePasswordReset } = useAuth();
  const nav = useNavigate();
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [resetDone, setResetDone] = useState(false);
  const mustReset = forcePasswordReset && !resetDone;


  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeCourse, setActiveCourse] = useState<string | null>(null);
  const [tab, setTab] = useState<"trainees" | "submissions">("trainees");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && role && role !== "trainer" && role !== "admin") {
      nav({ to: "/portal" });
    }
  }, [user, role, loading, nav]);

  async function refresh() {
    if (!user) return;
    setBusy(true);
    const { data: cts } = await supabase
      .from("course_trainers")
      .select("course_id")
      .eq("user_id", user.id);
    const ids = (cts ?? []).map((c: any) => c.course_id);
    if (ids.length === 0) {
      setCourses([]); setEnrollments([]); setAssignments([]); setSubmissions([]);
      setBusy(false); return;
    }
    const [cRes, eRes, aRes] = await Promise.all([
      supabase.from("courses").select("id,title,cover_emoji,starts_at,ends_at,description").in("id", ids),
      supabase.from("enrollments").select("id,user_id,course_id,status,blocked").in("course_id", ids),
      supabase.from("assignments").select("id,title,course_id,max_score,due_date").in("course_id", ids),
    ]);
    const cList = (cRes.data as Course[]) ?? [];
    setCourses(cList);
    const enrollList = (eRes.data as any[]) ?? [];
    const userIds = Array.from(new Set(enrollList.map((x) => x.user_id)));
    let profMap: Record<string, any> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles").select("id, full_name, email").in("id", userIds);
      profMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    }
    setEnrollments(enrollList.map((r) => ({ ...r, profiles: profMap[r.user_id] ?? null })));
    const aList = (aRes.data as Assignment[]) ?? [];
    setAssignments(aList);
    if (aList.length > 0) {
      const aIds = aList.map((a) => a.id);
      const { data: subs } = await supabase
        .from("assignment_submissions")
        .select("*").in("assignment_id", aIds);
      setSubmissions((subs as Submission[]) ?? []);
    } else {
      setSubmissions([]);
    }
    if (!activeCourse && cList[0]) setActiveCourse(cList[0].id);
    setBusy(false);
  }
  useEffect(() => { if (role === "trainer" || role === "admin") refresh(); /* eslint-disable-next-line */ }, [role, user?.id]);

  if (loading || !user || (role !== "trainer" && role !== "admin")) {
    return <div className="min-h-screen bg-[#0b1736] flex items-center justify-center text-white">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div>;
  }

  const courseEnrollees = enrollments.filter((e) => e.course_id === activeCourse && e.status === "approved");
  const courseAssignments = assignments.filter((a) => a.course_id === activeCourse);
  const courseSubmissions = submissions.filter((s) => courseAssignments.some((a) => a.id === s.assignment_id));

  return (
    <PortalShell userId={user.id} role="trainer" userLabel={user.email}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--gold)]/15 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-[var(--gold)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("لوحة المدرّب", "Trainer Dashboard")}</h1>
            <p className="text-sm text-white/60">{t("الكورسات والمتدرّبون المُسنَدون إليك.", "Courses and trainees assigned to you.")}</p>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-white/40" />
            {t("لم يتمّ تعيينك على أي كورس بعد.", "You have not been assigned to any course yet.")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {courses.map((c) => {
                const cnt = enrollments.filter((e) => e.course_id === c.id && e.status === "approved").length;
                return (
                  <button key={c.id} onClick={() => setActiveCourse(c.id)}
                    className={`text-start rounded-2xl border p-4 transition ${activeCourse === c.id ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                    <div className="text-2xl mb-1">{c.cover_emoji || "🎓"}</div>
                    <p className="font-bold text-sm line-clamp-2">{c.title}</p>
                    <p className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {cnt} {t("متدرب", "trainee")}{cnt !== 1 ? (lang === "en" ? "s" : "") : ""}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 border-b border-white/10">
              {[
                { id: "trainees", label: `${t("المتدرّبون", "Trainees")} (${courseEnrollees.length})` },
                { id: "submissions", label: `${t("التسليمات", "Submissions")} (${courseSubmissions.length})` },
              ].map((x) => (
                <button key={x.id} onClick={() => setTab(x.id as any)}
                  className={`px-4 py-3 text-sm font-semibold transition ${tab === x.id ? "text-[var(--gold)] border-b-2 border-[var(--gold)] -mb-px" : "text-white/60 hover:text-white"}`}>
                  {x.label}
                </button>
              ))}
            </div>

            {tab === "trainees" ? (
              <TraineesList items={courseEnrollees} t={t} />
            ) : (
              <SubmissionsPanel
                submissions={courseSubmissions}
                assignments={courseAssignments}
                enrollments={enrollments}
                refresh={refresh}
                t={t}
              />
            )}
            {busy && <p className="text-xs text-white/40">{t("جارٍ التحميل…", "Loading…")}</p>}
          </>
        )}
      </div>
    </PortalShell>
  );
}

function TraineesList({ items, t }: { items: Enrollment[]; t: (a: string, b: string) => string }) {
  if (items.length === 0) return <p className="text-white/60 text-sm">{t("لا يوجد متدرّبون مقبولون بعد.", "No approved trainees yet.")}</p>;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr><th className="text-start p-3">{t("الاسم", "Name")}</th><th className="text-start p-3">{t("البريد", "Email")}</th><th className="text-start p-3">{t("الحالة", "Status")}</th></tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id} className="border-t border-white/5">
              <td className="p-3 font-medium">{e.profiles?.full_name || "—"}</td>
              <td className="p-3 text-white/70">{e.profiles?.email || "—"}</td>
              <td className="p-3">{e.blocked ? <span className="text-rose-300 text-xs">{t("معلَّق", "Blocked")}</span> : <span className="text-emerald-300 text-xs">{t("نشط", "Active")}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubmissionsPanel({ submissions, assignments, enrollments, refresh, t }: {
  submissions: Submission[]; assignments: Assignment[]; enrollments: Enrollment[];
  refresh: () => void; t: (a: string, b: string) => string;
}) {
  const aMap = useMemo(() => Object.fromEntries(assignments.map((a) => [a.id, a])), [assignments]);
  const pMap = useMemo(() => Object.fromEntries(enrollments.map((e) => [e.user_id, e.profiles])), [enrollments]);

  if (submissions.length === 0) return <p className="text-white/60 text-sm">{t("لا توجد تسليمات بعد.", "No submissions yet.")}</p>;

  return (
    <div className="space-y-3">
      {submissions.map((s) => {
        const a = aMap[s.assignment_id];
        const p = pMap[s.user_id];
        return <SubmissionCard key={s.id} sub={s} assignment={a} profile={p} refresh={refresh} t={t} />;
      })}
    </div>
  );
}

function SubmissionCard({ sub, assignment, profile, refresh, t }: {
  sub: Submission; assignment: Assignment | undefined; profile: any;
  refresh: () => void; t: (a: string, b: string) => string;
}) {
  const [score, setScore] = useState<string>(sub.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(sub.feedback ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const num = Number(score);
    if (isNaN(num) || num < 0 || (assignment && num > assignment.max_score)) {
      toast.error(t("الدرجة غير صالحة", "Invalid score"));
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("assignment_submissions")
      .update({ score: num, feedback, graded_at: new Date().toISOString() })
      .eq("id", sub.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success(t("تم حفظ التقييم", "Grade saved")); refresh(); }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-sm">{assignment?.title || "—"}</p>
          <p className="text-xs text-white/60">{profile?.full_name || profile?.email || sub.user_id}</p>
        </div>
        <div className="text-xs text-white/50 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(sub.submitted_at).toLocaleString()}</div>
      </div>
      {sub.content && <div className="text-sm bg-white/5 rounded-lg p-3 whitespace-pre-wrap">{sub.content}</div>}
      {sub.link && <a href={sub.link} target="_blank" rel="noreferrer" className="text-xs text-[var(--gold)] underline">{sub.link}</a>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input type="number" value={score} onChange={(e) => setScore(e.target.value)}
          placeholder={`${t("الدرجة", "Score")} / ${assignment?.max_score ?? 100}`}
          className="bg-white/5 border border-white/10 rounded-lg px-3 h-10 text-sm" />
        <input value={feedback} onChange={(e) => setFeedback(e.target.value)}
          placeholder={t("ملاحظة (اختياري)", "Feedback (optional)")}
          className="md:col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 h-10 text-sm" />
      </div>
      <button onClick={save} disabled={saving}
        className="inline-flex items-center gap-2 bg-[var(--gold)] text-[#0b1736] font-bold text-xs px-4 h-9 rounded-lg disabled:opacity-50">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        {t("حفظ التقييم", "Save grade")}
      </button>
      {sub.graded_at && <p className="text-[11px] text-emerald-300/70 flex items-center gap-1"><FileText className="w-3 h-3" /> {t("تم التقييم في", "Graded on")} {new Date(sub.graded_at).toLocaleString()}</p>}
    </div>
  );
}
