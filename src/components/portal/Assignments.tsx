/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/PortalShell";
import { useI18n } from "@/lib/i18n";
import { useTranslatedTexts } from "@/lib/useTranslatedTexts";
import { toast } from "sonner";
import { findCountry } from "@/lib/countries";
import { safeHref } from "@/lib/safe-url";
import { Clock, CheckCircle2, XCircle, Download, Upload, BookOpen, Wallet, Loader2,
  ExternalLink, Sparkles, ArrowRight, Calendar, Layers, StickyNote, Link as LinkIcon,
  Paperclip, Check, ChevronLeft, PlayCircle, PhoneOutgoing, Award, GraduationCap, Hourglass,
  FileText, Send, AlertCircle, X, Star, UserCog, Camera, Save } from "lucide-react";
import { MediaViewerModal, type MediaItem } from "@/components/MediaViewerModal";
import { TraineeSupportButton } from "@/components/SupportTickets";
import { TraineePackagesSection } from "@/components/TraineePackagesSection";
import { AccountSettingsModal } from "@/components/AccountSettingsModal";
import type { Course, Enrollment, Profile, ModuleRow } from "./types";


export type Assignment = {
  id: string; module_id: string; course_id: string;
  title: string; instructions: string | null;
  due_date: string | null; max_score: number;
  is_graduation_project?: boolean;
  is_visible?: boolean;
  reference_url?: string | null;
};
export type Submission = {
  id: string; assignment_id: string; user_id: string;
  content: string | null; link: string | null;
  file_path?: string | null;
  score: number | null; feedback: string | null;
  submitted_at: string; graded_at: string | null;
};

export function AssignmentsSection({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subs, setSubs] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [aRes, sRes] = await Promise.all([
      supabase.from("assignments").select("*").eq("course_id", courseId).order("created_at"),
      supabase.from("assignment_submissions").select("*").eq("user_id", user.id),
    ]);
    setAssignments((aRes.data as Assignment[]) ?? []);
    const map: Record<string, Submission> = {};
    ((sRes.data as Submission[]) ?? []).forEach((s) => { map[s.assignment_id] = s; });
    setSubs(map);
    setLoading(false);
  }
  useEffect(() => { load(); }, [courseId, user?.id]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`assignments-${courseId}-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: `course_id=eq.${courseId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignment_submissions", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [courseId, user?.id]);

  if (loading) return null;
  // Hide invisible assignments from trainees
  const visible = assignments.filter((a) => a.is_visible !== false);
  const regular = visible.filter((a) => !a.is_graduation_project);
  const grad = visible.filter((a) => !!a.is_graduation_project);
  if (visible.length === 0) return null;

  return (
    <section className="space-y-6">
      {regular.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-[var(--gold)]" /> {isAr ? "التكليفات" : "Assignments"}</h2>
          <div className="space-y-3">
            {regular.map((a) => (
              <AssignmentCard key={a.id} a={a} sub={subs[a.id]} userId={user!.id} onChange={load} />
            ))}
          </div>
        </div>
      )}
      {grad.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--gold)]" /> {isAr ? "مشروع التخرّج (Capstone)" : "Capstone Graduation Project"}
          </h2>
          <div className="space-y-3">
            {grad.map((a) => (
              <AssignmentCard key={a.id} a={a} sub={subs[a.id]} userId={user!.id} onChange={load} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export const GRAD_ALLOWED_EXT = ["pdf", "zip", "rar", "pptx"];
export const GRAD_MAX_BYTES = 20 * 1024 * 1024;

export function AssignmentCard({ a, sub, userId, onChange }: { a: Assignment; sub: Submission | undefined; userId: string; onChange: () => void }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [content, setContent] = useState(sub?.content ?? "");
  const [link, setLink] = useState(sub?.link ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const overdue = a.due_date && new Date(a.due_date) < new Date() && !sub;
  const graded = sub && sub.score !== null;
  const isGrad = !!a.is_graduation_project;

  async function submit() {
    if (!isGrad) {
      if (!content.trim() && !link.trim()) return toast.error(isAr ? "اكتب إجابة أو ضع رابط" : "Write an answer or paste a link");
    }
    setSaving(true);
    let uploadedPath: string | null = sub?.file_path ?? null;
    try {
      if (isGrad && file) {
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        if (!GRAD_ALLOWED_EXT.includes(ext)) {
          setSaving(false);
          return toast.error(isAr ? "الامتدادات المسموح بها: pdf, zip, rar, pptx" : "Allowed extensions: pdf, zip, rar, pptx");
        }
        if (file.size > GRAD_MAX_BYTES) {
          setSaving(false);
          return toast.error(isAr ? "الحد الأقصى لحجم الملف 20 ميجابايت" : "Max file size is 20MB");
        }
        const path = `${a.course_id}/${userId}/${a.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("assignment-files").upload(path, file, { upsert: true });
        if (upErr) { setSaving(false); return toast.error(upErr.message); }
        uploadedPath = path;
      }

      if (sub) {
        const { error } = await supabase.from("assignment_submissions")
          .update({ content: content || null, link: link || null, file_path: uploadedPath, submitted_at: new Date().toISOString() } as any)
          .eq("id", sub.id);
        if (error) { setSaving(false); return toast.error(error.message); }
      } else {
        const { error } = await supabase.from("assignment_submissions")
          .insert({ assignment_id: a.id, user_id: userId, content: content || null, link: link || null, file_path: uploadedPath } as any);
        if (error) { setSaving(false); return toast.error(error.message); }
      }
      toast.success(isAr ? "تم إرسال التسليم" : "Submission sent");
      setFile(null);
      onChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-2xl border p-5 ${graded ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--gold)]" /> {a.title}</h4>
          {a.instructions && <p className="text-sm text-white/65 mt-2 whitespace-pre-wrap">{a.instructions}</p>}
          {safeHref(a.reference_url) && (
            <a href={safeHref(a.reference_url)!} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300 hover:underline">
              <LinkIcon className="w-3 h-3" /> {isAr ? "مرجع خارجي" : "External reference"} <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-white/55">
            {a.due_date && <span className={overdue ? "text-rose-300" : ""}><Calendar className="inline w-3 h-3 me-1" />{new Date(a.due_date).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}</span>}
            <span>{isAr ? "درجة قصوى" : "Max score"}: <span className="text-[var(--gold)]">{a.max_score}</span></span>
          </div>
        </div>
        {graded && (
          <div className="text-center px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
            <p className="text-2xl font-bold text-emerald-300">{sub.score}<span className="text-xs text-white/50">/{a.max_score}</span></p>
            <p className="text-[10px] text-emerald-300/70 mt-1">{isAr ? "تم التقييم" : "Graded"}</p>
          </div>
        )}
      </div>

      {graded && sub.feedback && (
        <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
          <p className="text-white/50 mb-1">{isAr ? "ملاحظات المدرّب:" : "Trainer feedback:"}</p>
          <p className="text-white/85 whitespace-pre-wrap">{sub.feedback}</p>
        </div>
      )}

      {!graded && (
        <div className="mt-4 space-y-2">
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder={isAr ? "اكتب إجابتك أو وصف تسليمك..." : "Write your answer or describe your submission..."}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />

          {isGrad ? (
            <>
              <div>
                <label className="text-[11px] text-white/60 block mb-1">
                  {isAr ? "ملف المشروع (pdf / zip / rar / pptx — حد أقصى 20MB)" : "Project file (pdf / zip / rar / pptx — max 20MB)"}
                </label>
                <input
                  type="file"
                  accept=".pdf,.zip,.rar,.pptx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs file:me-2 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-white/10 file:text-white"
                />
                {sub?.file_path && !file && (
                  <p className="text-[11px] text-emerald-300 mt-1">
                    ✓ {isAr ? "تم رفع ملف سابق — يمكنك استبداله بملف جديد" : "Previous file uploaded — you can replace it"}
                  </p>
                )}
              </div>
              <input value={link} onChange={(e) => setLink(e.target.value)}
                placeholder={isAr ? "رابط إضافي اختياري (Google Drive / OneDrive / ...)" : "Optional extra link (Google Drive / OneDrive / ...)"} dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
            </>
          ) : (
            <>
              <input value={link} onChange={(e) => setLink(e.target.value)}
                placeholder={isAr ? "رابط التسليم (Google Drive / OneDrive)" : "Submission link (Google Drive / OneDrive)"} dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
              <p className="text-[11px] leading-relaxed flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? "⚡ برجاء التأكد من ضبط إعدادات مشاركة الرابط ليكون 'عام / لأي شخص يمتلك الرابط' قبل إرفاقه، لضمان مراجعته واعتماده بنجاح."
                    : "⚡ Make sure the link sharing is set to 'Public / Anyone with the link' before submitting — otherwise the trainer won't be able to open it."}
                </span>
              </p>
            </>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[11px] text-white/50">
              {sub ? (isAr ? `آخر تسليم: ${new Date(sub.submitted_at).toLocaleString("ar-EG")} — يمكنك تعديله حتى يتم التقييم`
                          : `Last submitted: ${new Date(sub.submitted_at).toLocaleString("en-GB")} — editable until graded`)
                   : (isAr ? "لم تسلّم بعد" : "Not submitted yet")}
            </p>
            <button onClick={submit} disabled={saving}
              className="px-4 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50">
              <Send className="w-3.5 h-3.5" /> {sub ? (isAr ? "تحديث" : "Update") : (isAr ? "إرسال" : "Submit")}
            </button>
          </div>
        </div>

      )}
    </div>
  );
}


// ============================================================
// Enroll Modal — handles optional coupon code with live preview
// ============================================================
