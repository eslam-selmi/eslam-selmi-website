import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";
import { generateCertificatePdf } from "@/lib/certificate";
import { useI18n } from "@/lib/i18n";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Wallet,
  Loader2,
  Users,
  BookOpen,
  Award,
  FileText,
  X,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Layers,
  Link as LinkIcon,
  StickyNote,
  Paperclip,
  Pencil,
  Check,
  Clock,
  Settings2,
  Sparkles,
  Ticket,
  Percent,
  Archive,
  Camera,
  LifeBuoy,
  Star,
  CreditCard,
  Trophy,
  Video,
  ShieldCheck,
  LayoutDashboard,
  MoreHorizontal,
} from "lucide-react";
import { findCountry } from "@/lib/countries";
import { safeHref } from "@/lib/safe-url";
import { AdminSupportPanel } from "@/components/SupportTickets";
import { assertAdmin } from "@/lib/admin-guard.functions";
import { SiteManagementPanel } from "@/components/admin/SiteManagementPanel";
import { SuccessCasesPanel } from "@/components/admin/SuccessCasesPanel";
import { PartnersPanel } from "@/components/admin/PartnersPanel";
import { ContractsPanel } from "@/components/admin/ContractsPanel";
import { BookingsPanel } from "@/components/admin/BookingsPanel";
import { PackagesPanel } from "@/components/admin/PackagesPanel";
import { InterviewsPanel } from "@/components/admin/InterviewsPanel";
import { TrainingsPanel } from "@/components/admin/TrainingsPanel";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { TraineeDrawer } from "@/components/admin/TraineeDrawer";
import { ExecutiveOverview } from "@/components/admin/ExecutiveOverview";
import { CourseFeedbackPanel } from "@/components/admin/CourseFeedbackPanel";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/admin/panels/ui";

export function CourseAssignmentsAdmin({ courseId }: { courseId: string }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [modules, setModules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [moduleId, setModuleId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [due, setDue] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [isGrad, setIsGrad] = useState(false);

  async function load() {
    const [mRes, aRes] = await Promise.all([
      supabase
        .from("course_modules")
        .select("id,title")
        .eq("course_id", courseId)
        .order("order_index"),
      supabase.from("assignments").select("*").eq("course_id", courseId).order("created_at"),
    ]);
    setModules(mRes.data ?? []);
    const a = aRes.data ?? [];
    setAssignments(a);
    if (a.length) {
      const sRes = await supabase
        .from("assignment_submissions")
        .select("*")
        .in(
          "assignment_id",
          a.map((x: any) => x.id),
        );
      const sList = sRes.data ?? [];
      setSubs(sList);
      const ids = Array.from(new Set(sList.map((s: any) => s.user_id)));
      if (ids.length) {
        const pRes = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        const map: Record<string, any> = {};
        (pRes.data ?? []).forEach((p: any) => {
          map[p.id] = p;
        });
        setProfiles(map);
      }
    } else {
      setSubs([]);
      setProfiles({});
    }
  }
  useEffect(() => {
    load();
  }, [courseId]);

  const [refUrl, setRefUrl] = useState("");

  async function addAssignment() {
    if (!moduleId || !title.trim())
      return toast.error(t("اختر باب وأدخل عنوان", "Select a module and enter a title"));
    const { error } = await supabase.from("assignments").insert({
      course_id: courseId,
      module_id: moduleId,
      title,
      instructions: instructions || null,
      due_date: due ? new Date(due).toISOString() : null,
      max_score: maxScore,
      is_graduation_project: isGrad,
      reference_url: isGrad && refUrl.trim() ? refUrl.trim() : null,
    } as any);
    if (error) return toast.error(error.message);
    toast.success(t("تم إنشاء التكليف", "Assignment created"));
    setTitle("");
    setInstructions("");
    setDue("");
    setMaxScore(100);
    setIsGrad(false);
    setRefUrl("");
    load();
  }

  async function delAssignment(id: string) {
    if (!confirm(t("حذف التكليف وكل تسليماته؟", "Delete assignment and all its submissions?")))
      return;
    await supabase.from("assignments").delete().eq("id", id);
    load();
  }

  async function toggleVisibility(id: string, next: boolean) {
    const { error } = await supabase
      .from("assignments")
      .update({ is_visible: next } as any)
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(
      next
        ? t("ظاهر للمتدربين", "Visible to trainees")
        : t("مخفي عن المتدربين", "Hidden from trainees"),
    );
    load();
  }

  async function gradeSubmission(subId: string, score: number, feedback: string) {
    const { error } = await supabase
      .from("assignment_submissions")
      .update({ score, feedback: feedback || null, graded_at: new Date().toISOString() })
      .eq("id", subId);
    if (error) return toast.error(error.message);
    toast.success(t("تم التقييم", "Graded"));
    load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
        <p className="text-xs text-white/60 font-semibold">
          {t("إنشاء تكليف جديد", "Create new assignment")}
        </p>
        <select
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm"
        >
          <option value="">{t("— اختر الباب —", "— Select module —")}</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("عنوان التكليف", "Assignment title")}
          className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm"
        />
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={t("تعليمات / وصف", "Instructions / description")}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm"
          />
          <input
            type="number"
            value={maxScore}
            onChange={(e) => setMaxScore(Number(e.target.value))}
            placeholder={t("درجة قصوى", "Max score")}
            className="w-28 h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm"
          />
          <button
            onClick={addAssignment}
            className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm"
          >
            <Plus className="w-4 h-4 inline" /> {t("إضافة", "Add")}
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isGrad}
            onChange={(e) => setIsGrad(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          🎓{" "}
          {t(
            "مشروع التخرّج (يُشترط اعتماده قبل إصدار الشهادة)",
            "Graduation project (must be approved before issuing certificate)",
          )}
        </label>
        {isGrad && (
          <input
            value={refUrl}
            onChange={(e) => setRefUrl(e.target.value)}
            placeholder={t("رابط مرجعي خارجي (اختياري)", "External reference link (optional)")}
            className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm"
            dir="ltr"
          />
        )}
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-6">
          {t("لا توجد تكليفات بعد.", "No assignments yet.")}
        </p>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const aSubs = subs.filter((s) => s.assignment_id === a.id);
            const visible = a.is_visible !== false;
            return (
              <div
                key={a.id}
                className={`rounded-2xl border p-4 ${visible ? "border-white/10 bg-white/[0.03]" : "border-amber-300/30 bg-amber-300/[0.04]"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold flex items-center gap-2 flex-wrap">
                      {a.title}
                      {a.is_graduation_project && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/40">
                          🎓 {t("مشروع التخرّج", "Graduation project")}
                        </span>
                      )}
                      {!visible && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-300/20 text-amber-200 border border-amber-300/40">
                          {t("مخفي", "Hidden")}
                        </span>
                      )}
                    </h5>
                    {a.instructions && (
                      <p className="text-xs text-white/55 mt-1 whitespace-pre-wrap">
                        {a.instructions}
                      </p>
                    )}
                    {safeHref(a.reference_url) && (
                      <a
                        href={safeHref(a.reference_url)!}
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-sky-300 hover:underline mt-1 inline-block"
                        dir="ltr"
                      >
                        {a.reference_url}
                      </a>
                    )}
                    <p className="text-[11px] text-white/45 mt-1">
                      {a.due_date
                        ? `${t("تسليم", "Due")}: ${new Date(a.due_date).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}`
                        : t("بدون موعد", "No due date")}{" "}
                      · {t("درجة قصوى", "Max score")} {a.max_score}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleVisibility(a.id, !visible)}
                      className={`text-[11px] px-2 h-7 rounded-lg border ${visible ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200" : "bg-amber-300/15 border-amber-300/40 text-amber-200"}`}
                    >
                      {visible ? t("ظاهر", "Visible") : t("مخفي", "Hidden")}
                    </button>
                    <button
                      onClick={() => delAssignment(a.id)}
                      className="text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 border-t border-white/5 pt-3">
                  <p className="text-[11px] text-white/50 mb-2">
                    {t("التسليمات", "Submissions")} ({aSubs.length})
                  </p>
                  {aSubs.length === 0 ? (
                    <p className="text-[11px] text-white/40">
                      {t("لم يسلّم أي متدرب بعد.", "No trainee has submitted yet.")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {aSubs.map((s) => (
                        <SubmissionRow
                          key={s.id}
                          s={s}
                          maxScore={a.max_score}
                          profile={profiles[s.user_id]}
                          onGrade={gradeSubmission}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SubmissionRow({
  s,
  maxScore,
  profile,
  onGrade,
}: {
  s: any;
  maxScore: number;
  profile: any;
  onGrade: (id: string, score: number, fb: string) => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [score, setScore] = useState<string>(s.score?.toString() ?? "");
  const [fb, setFb] = useState<string>(s.feedback ?? "");
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">
            {profile?.full_name || profile?.email || s.user_id.slice(0, 8)}
          </p>
          <p className="text-[10px] text-white/45 mt-0.5">
            {new Date(s.submitted_at).toLocaleString("ar-EG")}
          </p>
        </div>
        {s.score !== null && (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
            {t("مُقيّم", "Graded")}: {s.score}/{maxScore}
          </span>
        )}
      </div>
      {s.content && (
        <p className="text-xs text-white/75 mt-2 whitespace-pre-wrap p-2 bg-white/5 rounded">
          {s.content}
        </p>
      )}
      {safeHref(s.link) && (
        <a
          href={safeHref(s.link)!}
          target="_blank"
          rel="noopener"
          className="text-xs text-[var(--gold)] hover:underline block mt-1 truncate"
          dir="ltr"
        >
          {s.link}
        </a>
      )}
      <div className="flex gap-2 mt-2">
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder={`/${maxScore}`}
          className="w-20 h-8 px-2 rounded bg-white/5 border border-white/15 text-xs"
        />
        <input
          value={fb}
          onChange={(e) => setFb(e.target.value)}
          placeholder={t("ملاحظات", "Feedback")}
          className="flex-1 h-8 px-2 rounded bg-white/5 border border-white/15 text-xs"
        />
        <button
          onClick={() => {
            const n = Number(score);
            if (!isNaN(n)) onGrade(s.id, n, fb);
          }}
          className="px-3 h-8 rounded bg-[var(--gold)] text-[#0b1736] text-xs font-semibold"
        >
          {t("حفظ", "Save")}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Coupons Panel
// ============================================================
