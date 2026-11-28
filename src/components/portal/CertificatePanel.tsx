import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { CheckCircle2, Download, Award, Hourglass, Send, AlertCircle, Save } from "lucide-react";
import type { Course, Enrollment } from "./types";
import { LEARNER_PROGRESS_ENABLED, issueMyCertificateFull } from "@/lib/learner-progress";
import { DebtGateDialog } from "./DebtGateDialog";
import { renderOwnCertificates, resolveIssueDate } from "@/lib/self-certificate";


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
  const [debtOpen, setDebtOpen] = useState(false);
  const [gradState, setGradState] = useState<{ required: boolean; submitted: boolean; approved: boolean; loading: boolean }>({ required: false, submitted: false, approved: false, loading: true });
  const namesSaved = !!(enrollment.name_ar && enrollment.name_en);
  const issued = enrollment.certificate_issued && (enrollment.certificate_url_ar || enrollment.certificate_url_en || enrollment.certificate_url);
  const requested = !!enrollment.certificate_requested_at && !issued;
  // Auto-issued by the server: certificate_issued is true but no stored file exists. The learner renders it locally from the server timestamp.
  const autoIssued = LEARNER_PROGRESS_ENABLED && !!enrollment.certificate_issued && !issued;

  async function downloadOwn() {
    const date = resolveIssueDate((enrollment as any).certificate_issued_at);
    if (!date) return toast.error(isAr ? "تاريخ الإصدار غير متاح للتحميل الذاتي، تواصل مع الإدارة" : "The issue date is not available for self-download, please contact us.");
    try {
      setRequesting(true);
      const { ar, en } = await renderOwnCertificates({ id: enrollment.id, course_id: course.id, name_ar: enrollment.name_ar, name_en: enrollment.name_en, courses: course as any }, date);
      for (const [b, n] of [[ar, "ar"], [en, "en"]] as const) { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `certificate-${n}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 10000); }
    } catch (e) { console.error("self-certificate render failed:", e instanceof Error ? e.message : String(e)); toast.error(isAr ? "تعذّر إنشاء الملف، جرّب مرة أخرى" : "The file could not be created. Try again."); }
    finally { setRequesting(false); }
  }

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
      // Approval is the ADMIN's explicit approval record (user 2026-11-27). A score or a trainer's grade does not count.
      // The record only exists once the prepared SQL is applied; before that, or on any read error, this stays "not approved" (fail closed).
      const { data: appr, error: apprErr } = await (supabase as any).from("graduation_approvals").select("assignment_id").eq("user_id", enrollment.user_id!).in("assignment_id", ids);
      const approved = !apprErr && (appr ?? []).length > 0 && submitted;
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
    if (LEARNER_PROGRESS_ENABLED) {
      // Prepared, default off: unpaid-due installments block before anything else.
      const { status: st, issuedAt, blockers } = await issueMyCertificateFull(enrollment.id);
      if (st === "debt") { setDebtOpen(true); return; }
      if (st === "unknown") return toast.error(isAr ? "تعذّر التحقق، جرّب مرة أخرى" : "Could not check, please try again");
      if (st === "finance_unknown") return toast.error(isAr ? "جاري مراجعة بيانات السداد، تواصل مع الإدارة لو استمرت الرسالة" : "We are checking your payment records. Contact us if this stays.");
      if (st === "issued") {
        // Server has set certificate_issued. Render locally from the learner's own row; QR -> /verify/<id>.
        const date = resolveIssueDate(issuedAt, (enrollment as any).certificate_issued_at);
        onRefresh();
        if (!date) return toast.success(isAr ? "شهادتك صادرة. تاريخ الإصدار الدقيق غير متاح للتحميل الذاتي، تواصل مع الإدارة" : "Your certificate is issued. The exact issue date is not available for self-download, please contact us.");
        try {
          setRequesting(true);
          const { ar, en } = await renderOwnCertificates({ id: enrollment.id, course_id: course.id, name_ar: enrollment.name_ar, name_en: enrollment.name_en, courses: course as any }, date);
          for (const [b, n] of [[ar, "ar"], [en, "en"]] as const) { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `certificate-${n}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 10000); }
          toast.success(isAr ? "تم إصدار شهادتك ✅" : "Certificate issued ✅");
        } catch (e) { console.error("self-certificate render failed:", e instanceof Error ? e.message : String(e)); toast.error(isAr ? "صدرت الشهادة لكن تعذّر إنشاء الملف، جرّب مرة أخرى" : "Issued, but the file could not be created. Try again."); }
        finally { setRequesting(false); }
        return;
      }
      if (st === "ok") { toast.success(isAr ? "تم تسجيل طلب الشهادة ✅" : "Certificate request recorded ✅"); onRefresh(); return; }
      if (st === "graduation") return toast.error(isAr ? "لازم يتم اعتماد مشروع التخرّج الأول" : "Your graduation project must be approved first");
      if (st === "names") return toast.error(isAr ? "اكتب اسمك بالعربي والإنجليزي الأول" : "Save your name in Arabic and English first");
      return;
    }
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

  const canRequest = namesSaved && (!gradState.required || gradState.approved);

  return (
    <div className="dash-card dash-card-hover p-5">
      {LEARNER_PROGRESS_ENABLED && <DebtGateDialog open={debtOpen} onClose={() => setDebtOpen(false)} isAr={isAr} />}
      <h3 className="font-bold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-[var(--gold)]" /> {isAr ? "الشهادة" : "Certificate"}</h3>

      {issued ? (
        <div className="space-y-2.5">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-2">
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
      ) : autoIssued ? (
        <div className="space-y-2.5">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> {isAr ? "شهادتك جاهزة" : "Your certificate is ready"}
          </p>
          <button onClick={downloadOwn} disabled={requesting}
            className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
            <Download className="w-4 h-4" /> {isAr ? "تحميل الشهادة (عربي وإنجليزي)" : "Download certificate (Arabic and English)"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {!namesSaved && (
            <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 space-y-2">
              <p className="text-xs text-amber-800 dark:text-[var(--gold)] flex items-center gap-1.5">
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

          {LEARNER_PROGRESS_ENABLED && !issued ? (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/75 flex items-start gap-2">
              <Hourglass className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {(course as any).delivery_mode === "recorded"
                ? (isAr ? "الشهادة بتصدر تلقائيًا بعد مشاهدة كل الفيديوهات المسجلة كاملة وسداد المستحق." : "Your certificate is issued automatically once all recorded videos are fully watched and nothing is owed.")
                : (isAr ? "الشهادة في الكورسات المباشرة بيصدرها المدرّب." : "Certificates for live courses are issued by your trainer.")}
            </div>
          ) : requested ? (
            <div className="rounded-xl bg-amber-300/10 border border-amber-300/30 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Hourglass className="w-3.5 h-3.5" /> {isAr ? "طلبك مُرسل للأدمن، هتوصلك الشهادة قريب" : "Request sent — admin will issue your certificate soon"}
            </div>
          ) : (
            <>
              {gradState.required && (
                <div className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${gradState.approved ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200" : gradState.submitted ? "bg-amber-300/10 border-amber-300/30 text-amber-800 dark:text-amber-200" : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200"}`}>
                  {gradState.approved ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <p>
                    🎓 {isAr ? "مشروع التخرّج: " : "Graduation project: "}
                    {gradState.approved
                      ? (isAr ? "تم الاعتماد ✅" : "Approved ✅")
                      : gradState.submitted
                      ? (isAr ? "بانتظار اعتماد الأدمن" : "Awaiting admin approval")
                      : (isAr ? "لازم تسلّم مشروع التخرّج ويعتمده الأدمن قبل ما تطلب الشهادة" : "Submit your graduation project and get it approved by the admin before requesting the certificate")}
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


