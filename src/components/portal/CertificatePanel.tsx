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


export function CertificatePanel({
  enrollment, course, allModulesDone, totalModules, completedModules, onDownloadCert, onRefresh,
}: {
  enrollment: Enrollment; course: Course;
  allModulesDone: boolean; totalModules: number; completedModules: number;
  onDownloadCert: (url: string) => void; onRefresh: () => void;
}) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [nameAr, setNameAr] = useState(enrollment.name_ar ?? "");
  const [nameEn, setNameEn] = useState(enrollment.name_en ?? "");
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [gradState, setGradState] = useState<{ required: boolean; submitted: boolean; approved: boolean; loading: boolean }>({ required: false, submitted: false, approved: false, loading: true });
  const namesSaved = !!(enrollment.name_ar && enrollment.name_en);
  const issued = enrollment.certificate_issued && (enrollment.certificate_url_ar || enrollment.certificate_url_en || enrollment.certificate_url);
  const requested = !!enrollment.certificate_requested_at && !issued;

  useEffect(() => {
    (async () => {
      const { data: assignments } = await supabase.from("assignments")
        .select("id,max_score,is_graduation_project")
        .eq("course_id", course.id)
        .eq("is_graduation_project", true);
      const gradAssignments = assignments ?? [];
      if (gradAssignments.length === 0) {
        setGradState({ required: false, submitted: false, approved: false, loading: false });
        return;
      }
      const ids = gradAssignments.map((a: any) => a.id);
      const { data: subs } = await supabase.from("assignment_submissions")
        .select("assignment_id,score,graded_at")
        .eq("user_id", enrollment.user_id!)
        .in("assignment_id", ids);
      const submitted = (subs ?? []).length > 0;
      const approved = gradAssignments.some((a: any) => {
        const s = (subs ?? []).find((x: any) => x.assignment_id === a.id);
        if (!s || s.score == null || !s.graded_at) return false;
        const pass = Number(a.max_score) * 0.6;
        return Number(s.score) >= pass;
      });
      setGradState({ required: true, submitted, approved, loading: false });
    })();
  }, [course.id, enrollment.user_id]);

  async function saveNames() {
    if (!nameAr.trim() || !nameEn.trim()) return toast.error(isAr ? "اكتب الاسم بالعربي والإنجليزي" : "Enter your name in both Arabic and English");
    setSaving(true);
    const { error } = await supabase.from("enrollments")
      .update({ name_ar: nameAr.trim(), name_en: nameEn.trim() })
      .eq("id", enrollment.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isAr ? "تم حفظ الاسم" : "Name saved");
    onRefresh();
  }

  async function requestCertificate() {
    if (!allModulesDone) return toast.error(isAr ? "لازم تكمل كل الدروس الأول" : "Finish all modules first");
    if (gradState.required && !gradState.approved) return toast.error(isAr ? "لازم يتم اعتماد مشروع التخرّج الأول" : "Your graduation project must be approved first");
    if (!namesSaved) return toast.error(isAr ? "اكتب اسمك بالعربي والإنجليزي الأول" : "Save your name in Arabic and English first");
    setRequesting(true);
    const { error } = await supabase.from("enrollments")
      .update({ certificate_requested_at: new Date().toISOString() })
      .eq("id", enrollment.id);
    setRequesting(false);
    if (error) return toast.error(error.message);
    toast.success(isAr ? "تم إرسال طلب الشهادة للأدمن ✅" : "Certificate request sent to admin ✅");
    onRefresh();
  }

  const canRequest = allModulesDone && namesSaved && (!gradState.required || gradState.approved);

  return (
    <div className="dash-card dash-card-hover p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-[var(--gold)]" /> {isAr ? "الشهادة" : "Certificate"}</h3>

      {issued ? (
        <div className="space-y-2.5">
          <p className="text-xs text-emerald-300 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> {isAr ? "شهادتك جاهزة — اختر اللغة للتحميل" : "Your certificate is ready — pick a language to download"}
          </p>
          {enrollment.certificate_url_ar && (
            <button onClick={() => onDownloadCert(enrollment.certificate_url_ar!)}
              className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
              <Download className="w-4 h-4" /> {isAr ? "تحميل النسخة العربية" : "Download Arabic version"}
            </button>
          )}
          {enrollment.certificate_url_en && (
            <button onClick={() => onDownloadCert(enrollment.certificate_url_en!)}
              className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 bg-white/10 border border-[var(--gold)]/40 text-[var(--gold)] hover:bg-white/15">
              <Download className="w-4 h-4" /> Download English version
            </button>
          )}
          {!enrollment.certificate_url_ar && !enrollment.certificate_url_en && enrollment.certificate_url && (
            <button onClick={() => onDownloadCert(enrollment.certificate_url!)}
              className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
              <Download className="w-4 h-4" /> {isAr ? "تحميل الشهادة" : "Download certificate"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {!namesSaved && (
            <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 space-y-2">
              <p className="text-xs text-[var(--gold)] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {isAr ? "اكتب اسمك بالضبط زي ما تحبه يظهر على الشهادة" : "Write your name exactly as you want it on the certificate"}
              </p>
              <input value={nameAr} onChange={(e) => setNameAr(e.target.value)}
                placeholder={isAr ? "الاسم بالعربي" : "Name in Arabic"} dir="rtl"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                placeholder="Full name in English" dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
              <button onClick={saveNames} disabled={saving}
                className="w-full h-10 rounded-lg text-xs font-semibold bg-[var(--gold)] text-[#0b1736] disabled:opacity-50">
                {saving ? "..." : (isAr ? "حفظ الاسم" : "Save name")}
              </button>
            </div>
          )}

          {namesSaved && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/70 space-y-1">
              <p>{isAr ? "الاسم على الشهادة:" : "Name on certificate:"}</p>
              <p className="text-white font-semibold">{enrollment.name_ar}</p>
              <p className="text-white font-semibold" dir="ltr">{enrollment.name_en}</p>
            </div>
          )}

          {requested ? (
            <div className="rounded-xl bg-amber-300/10 border border-amber-300/30 p-3 text-xs text-amber-200 flex items-center gap-2">
              <Hourglass className="w-3.5 h-3.5" /> {isAr ? "طلبك مُرسل للأدمن، هتوصلك الشهادة قريب" : "Request sent — admin will issue your certificate soon"}
            </div>
          ) : (
            <>
              {!allModulesDone && totalModules > 0 && (
                <p className="text-[11px] text-white/55 text-center">
                  {isAr ? `متبقى ${totalModules - completedModules} محاضرة قبل ما تقدر تطلب الشهادة` : `${totalModules - completedModules} lecture(s) remaining before you can request the certificate`}
                </p>
              )}
              {gradState.required && (
                <div className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${gradState.approved ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" : gradState.submitted ? "bg-amber-300/10 border-amber-300/30 text-amber-200" : "bg-rose-500/10 border-rose-500/30 text-rose-200"}`}>
                  {gradState.approved ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <p>
                    🎓 {isAr ? "مشروع التخرّج: " : "Graduation project: "}
                    {gradState.approved
                      ? (isAr ? "تم الاعتماد ✅" : "Approved ✅")
                      : gradState.submitted
                      ? (isAr ? "بانتظار تقييم الأدمن" : "Awaiting admin review")
                      : (isAr ? "لازم تسلّم مشروع التخرّج وتاخد درجة نجاح قبل ما تطلب الشهادة" : "Submit your graduation project and earn a passing grade before requesting the certificate")}
                  </p>
                </div>
              )}
              <button onClick={requestCertificate} disabled={!canRequest || requesting}
                className="w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canRequest ? "linear-gradient(135deg, var(--gold), #b8923f)" : "rgba(255,255,255,0.05)", color: canRequest ? "#0b1736" : "rgba(255,255,255,0.5)" }}>
                <Send className="w-4 h-4" /> {requesting ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "طلب إصدار الشهادة" : "Request certificate")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}


