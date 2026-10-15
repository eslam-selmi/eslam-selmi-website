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
import { Course, EnrollmentRow } from "@/components/admin/panels/types";
import { Input, ProofLink, Select, StatusPill } from "@/components/admin/panels/ui";

export function EnrollmentDrawer({
  enrollment,
  onClose,
  refresh,
}: {
  enrollment: EnrollmentRow;
  onClose: () => void;
  refresh: () => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [payments, setPayments] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [issued, setIssued] = useState(enrollment.certificate_issued);

  const courseCur = enrollment.courses?.currency ?? "EGP";
  const [payAmount, setPayAmount] = useState("");
  const [payCurr, setPayCurr] = useState(courseCur);
  const [payNote, setPayNote] = useState("");
  const [payMethodId, setPayMethodId] = useState("");

  const [insAmount, setInsAmount] = useState("");
  const [insCurr, setInsCurr] = useState(courseCur);
  const [insDate, setInsDate] = useState("");

  async function refreshLists() {
    const [p, i, m] = await Promise.all([
      supabase
        .from("payments")
        .select("*")
        .eq("enrollment_id", enrollment.id)
        .order("paid_at", { ascending: false }),
      supabase
        .from("installments")
        .select("*")
        .eq("enrollment_id", enrollment.id)
        .order("due_date"),
      supabase
        .from("payment_methods" as any)
        .select("*")
        .eq("active", true)
        .order("order_index"),
    ]);
    setPayments(p.data ?? []);
    setInstallments(i.data ?? []);
    setMethods((m.data as any[]) ?? []);
  }
  useEffect(() => {
    refreshLists();
  }, [enrollment.id]);

  const totalPaid = payments
    .filter((p) => p.status !== "rejected" && p.status !== "pending")
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const rawPrice = Number(enrollment.courses?.price ?? 0);
  const discount = Number((enrollment as any).discount_amount ?? 0);
  const coursePrice = Math.max(0, rawPrice - discount);
  const fullyPaid = coursePrice > 0 && totalPaid >= coursePrice;
  const couponCode = (enrollment as any).coupon_code as string | null;

  async function uploadCert(file: File) {
    setUploading(true);
    const path = `${enrollment.user_id}/${enrollment.id}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("certificates").upload(path, file);
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { error } = await supabase
      .from("enrollments")
      .update({ certificate_url: path, certificate_issued: true })
      .eq("id", enrollment.id);
    setUploading(false);
    if (error) return toast.error(error.message);
    setIssued(true);
    toast.success(t("تم رفع الشهادة وإشعار المتدرب", "Certificate uploaded and trainee notified"));
    refresh();
  }

  async function toggleIssued() {
    const next = !issued;
    const { error } = await supabase
      .from("enrollments")
      .update({ certificate_issued: next })
      .eq("id", enrollment.id);
    if (error) return toast.error(error.message);
    setIssued(next);
    refresh();
  }

  const [autoIssuing, setAutoIssuing] = useState(false);
  async function autoIssueCertificate() {
    const nameAr = enrollment.name_ar;
    const nameEn = enrollment.name_en;
    if (!nameAr || !nameEn)
      return toast.error(
        t(
          "المتدرب لم يدخل اسمه بالعربي والإنجليزي بعد",
          "Trainee hasn't entered their name in Arabic and English yet",
        ),
      );
    const course = enrollment.courses;
    if (!course) return toast.error(t("بيانات الكورس غير متاحة", "Course data not available"));
    setAutoIssuing(true);
    try {
      const issueDate = new Date();
      const common = {
        courseTitle: course.title,
        courseDescription: course.description,
        totalHours: Number(course.total_hours ?? 0),
        issueDate,
        certificateId: enrollment.id,
        courseLogoUrl: (course as any).logo_url ?? null,
        courseBrandName: (course as any).brand_name ?? null,
      };
      // Sequential to avoid concurrent DOM/font contention (was causing EN failures)
      const pdfAr = await generateCertificatePdf({ ...common, lang: "ar", studentName: nameAr });
      const pdfEn = await generateCertificatePdf({ ...common, lang: "en", studentName: nameEn });
      const ts = Date.now();
      const pathAr = `${enrollment.user_id}/${enrollment.id}-${ts}-ar.pdf`;
      const pathEn = `${enrollment.user_id}/${enrollment.id}-${ts}-en.pdf`;
      const [up1, up2] = await Promise.all([
        supabase.storage
          .from("certificates")
          .upload(pathAr, pdfAr, { contentType: "application/pdf", upsert: true }),
        supabase.storage
          .from("certificates")
          .upload(pathEn, pdfEn, { contentType: "application/pdf", upsert: true }),
      ]);
      if (up1.error) throw up1.error;
      if (up2.error) throw up2.error;
      const { error } = await supabase
        .from("enrollments")
        .update({
          certificate_url_ar: pathAr,
          certificate_url_en: pathEn,
          certificate_url: pathAr,
          certificate_issued: true,
        })
        .eq("id", enrollment.id);
      if (error) throw error;
      setIssued(true);
      toast.success(
        t(
          "تم إصدار الشهادة (عربي + إنجليزي) وإشعار المتدرب 🎉",
          "Certificate issued (Arabic + English) and trainee notified 🎉",
        ),
      );
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? t("تعذّر توليد الشهادة", "Failed to generate certificate"));
    } finally {
      setAutoIssuing(false);
    }
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payAmount) return;
    const m = methods.find((x) => x.id === payMethodId);
    const { error } = await supabase.from("payments").insert({
      enrollment_id: enrollment.id,
      amount: Number(payAmount),
      currency: payCurr,
      note: payNote || null,
      payment_method_id: payMethodId || null,
      payment_method_name: m ? m.name_ar || m.name_en : null,
    } as any);
    if (error) return toast.error(error.message);
    setPayAmount("");
    setPayNote("");
    setPayMethodId("");
    refreshLists();
  }
  async function autoSplitInstallments() {
    const n = enrollment.courses?.installments_count ?? 1;
    if (n <= 1 || coursePrice <= 0) return;
    const each = Math.ceil(coursePrice / n);
    const rows = Array.from({ length: n }, (_, idx) => ({
      enrollment_id: enrollment.id,
      amount: idx === n - 1 ? coursePrice - each * (n - 1) : each,
      currency: courseCur,
      due_date: null,
      paid: false,
    }));
    await supabase.from("installments").insert(rows);
    toast.success(t("تم إنشاء جدول الأقساط", "Installment schedule created"));
    refreshLists();
  }
  async function addInstallment(e: React.FormEvent) {
    e.preventDefault();
    if (!insAmount) return;
    const { error } = await supabase.from("installments").insert({
      enrollment_id: enrollment.id,
      amount: Number(insAmount),
      currency: insCurr,
      due_date: insDate || null,
    });
    if (error) return toast.error(error.message);
    setInsAmount("");
    setInsDate("");
    refreshLists();
  }
  async function togglePaid(id: string, paid: boolean) {
    await supabase
      .from("installments")
      .update({ paid: !paid, paid_at: !paid ? new Date().toISOString() : null })
      .eq("id", id);
    refreshLists();
  }
  async function delInst(id: string) {
    await supabase.from("installments").delete().eq("id", id);
    refreshLists();
  }
  async function delPay(id: string) {
    await supabase.from("payments").delete().eq("id", id);
    refreshLists();
  }

  const [blocked, setBlocked] = useState(enrollment.blocked);
  async function toggleBlocked() {
    const next = !blocked;
    const { error } = await supabase
      .from("enrollments")
      .update({ blocked: next })
      .eq("id", enrollment.id);
    if (error) return toast.error(error.message);
    setBlocked(next);
    toast.success(
      next
        ? t("تم قفل وصول المتدرب للكورس", "Trainee access locked")
        : t("تم استعادة وصول المتدرب للكورس", "Trainee access restored"),
    );
    refresh();
  }

  // Grace period / manual bypass — temporarily unlocks access regardless of payment status
  const [graceUntil, setGraceUntil] = useState<string | null>(
    (enrollment as any).grace_until ?? null,
  );
  const graceActive = !!graceUntil && new Date(graceUntil) > new Date();
  async function toggleGrace() {
    const next = graceActive ? null : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    const patch: any = { grace_until: next };
    if (next) patch.blocked = false; // ensure access is open during grace
    const { error } = await supabase.from("enrollments").update(patch).eq("id", enrollment.id);
    if (error) return toast.error(error.message);
    setGraceUntil(next);
    if (next) setBlocked(false);
    toast.success(
      next
        ? t(
            "تم تفعيل فترة سماح 30 يوم — يمكن للمتدرب الوصول للمحتوى",
            "Grace period enabled (30 days) — trainee can access content",
          )
        : t("تم إلغاء فترة السماح", "Grace period revoked"),
    );
    refresh();
  }

  const [accountBlocked, setAccountBlocked] = useState(false);
  useEffect(() => {
    supabase
      .from("profiles")
      .select("account_blocked")
      .eq("id", enrollment.user_id)
      .maybeSingle()
      .then(({ data }) => setAccountBlocked(Boolean(data?.account_blocked)));
  }, [enrollment.user_id]);
  async function toggleAccountBlocked() {
    const next = !accountBlocked;
    const msg = next
      ? t(
          "إيقاف حساب المتدرب من الدخول للمنصة بالكامل؟ سيتم إنهاء جلسته فوراً.",
          "Suspend this trainee's access to the entire platform? Their session will end immediately.",
        )
      : t("إعادة تفعيل حساب المتدرب؟", "Reactivate trainee account?");
    if (!confirm(msg)) return;
    const { error } = await supabase
      .from("profiles")
      .update({ account_blocked: next })
      .eq("id", enrollment.user_id);
    if (error) return toast.error(error.message);
    setAccountBlocked(next);
    toast.success(
      next
        ? t("تم إيقاف حساب المتدرب", "Trainee account suspended")
        : t("تم إعادة تفعيل الحساب", "Account reactivated"),
    );
  }

  async function removeEnrollment() {
    if (
      !confirm(
        t(
          "حذف هذا المتدرب من الكورس نهائياً؟ سيتم حذف كل بيانات الالتحاق والمدفوعات.",
          "Permanently remove this trainee from the course? All enrollment and payment data will be deleted.",
        ),
      )
    )
      return;
    const { error } = await supabase.from("enrollments").delete().eq("id", enrollment.id);
    if (error) return toast.error(error.message);
    toast.success(t("تم حذف المتدرب من الكورس", "Trainee removed from course"));
    refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ms-auto w-full max-w-2xl h-full bg-[#0b1736] border-s border-white/10 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[rgba(11,23,54,0.95)] backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50">{enrollment.courses?.title}</p>
            <h3 className="text-lg font-bold">
              {enrollment.profiles?.full_name || enrollment.profiles?.email}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-7">
          <section className="dash-card dash-card-hover p-4 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-white/50">{t("البريد", "Email")}</span>
              <span dir="ltr">{enrollment.profiles?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">{t("الهاتف", "Phone")}</span>
              <span dir="ltr">{enrollment.profiles?.phone || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">{t("الدولة", "Country")}</span>
              <span>
                {(() => {
                  const c = findCountry(enrollment.profiles?.country);
                  return c ? `${c.flag} ${lang === "ar" ? c.name_ar : c.name_en}` : "—";
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50">{t("الحالة", "Status")}</span>
              <StatusPill status={enrollment.status} />
            </div>
            {blocked && (
              <div className="flex justify-between items-center">
                <span className="text-white/50">{t("الوصول", "Access")}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {t("محظور مؤقتاً", "Temporarily blocked")}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/50">{t("سعر الكورس", "Course price")}</span>
              <span className="text-[var(--gold)] font-semibold">
                {discount > 0 && (
                  <span className="text-white/40 line-through me-2 text-xs">
                    {rawPrice.toLocaleString()}
                  </span>
                )}
                {coursePrice.toLocaleString()} {courseCur}
              </span>
            </div>
            {couponCode && (
              <div className="flex justify-between">
                <span className="text-white/50">{t("كوبون مطبّق", "Coupon applied")}</span>
                <span className="text-emerald-300 font-mono text-xs">
                  {couponCode} (−{discount.toLocaleString()} {courseCur})
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/50">{t("المدفوع", "Paid")}</span>
              <span className={fullyPaid ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                {totalPaid.toLocaleString()} {courseCur}{" "}
                {fullyPaid && t("✓ مكتمل الدفع", "✓ Fully paid")}
              </span>
            </div>
            {!fullyPaid && coursePrice > 0 && (
              <div className="flex justify-between">
                <span className="text-white/50">{t("المتبقي", "Remaining")}</span>
                <span className="text-rose-300 font-semibold">
                  {Math.max(0, coursePrice - totalPaid).toLocaleString()} {courseCur}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/50">{t("نظام الدفع", "Payment plan")}</span>
              <span>
                {enrollment.courses?.installments_count === 1
                  ? t("دفعة كاملة", "Full payment")
                  : `${enrollment.courses?.installments_count} ${t(`أقساط`, `installments`)}`}
              </span>
            </div>
            {accountBlocked && (
              <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-rose-500/20">
                <span className="text-rose-300">{t("حالة الحساب", "Account status")}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {t("⛔ موقوف من المنصة", "⛔ Suspended from platform")}
                </span>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-rose-300/20 bg-rose-300/5 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={toggleBlocked}
              className={`h-10 rounded-lg text-xs font-semibold ${blocked ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"}`}
            >
              {blocked
                ? t("↩ إلغاء قفل الكورس", "↩ Unlock course")
                : t("⏸ قفل الوصول لهذا الكورس", "⏸ Lock access to this course")}
            </button>
            <button
              onClick={toggleGrace}
              className={`h-10 rounded-lg text-xs font-semibold ${graceActive ? "bg-emerald-500/25 text-emerald-200 border border-emerald-500/40" : "bg-sky-500/20 text-sky-300 border border-sky-500/30"}`}
            >
              {graceActive
                ? t(
                    `✓ فترة سماح فعّالة حتى ${new Date(graceUntil!).toLocaleDateString("ar-EG")}`,
                    `✓ Grace until ${new Date(graceUntil!).toLocaleDateString("en-GB")}`,
                  )
                : t(
                    "🔓 تفعيل فترة سماح (تخطّي يدوي للقفل)",
                    "🔓 Enable grace period (manual bypass)",
                  )}
            </button>
            <button
              onClick={toggleAccountBlocked}
              className={`h-10 rounded-lg text-xs font-semibold ${accountBlocked ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}
            >
              {accountBlocked
                ? t("✓ إعادة تفعيل الحساب", "✓ Reactivate account")
                : t("⛔ إيقاف الحساب من المنصة", "⛔ Suspend account from platform")}
            </button>
            <button
              onClick={removeEnrollment}
              className="h-10 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30"
            >
              {t(
                "🗑 حذف المتدرب من هذا الكورس نهائياً",
                "🗑 Permanently remove trainee from this course",
              )}
            </button>
          </section>

          <section>
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-[var(--gold)]" /> {t("الشهادة", "Certificate")}
            </h4>
            {!fullyPaid && coursePrice > 0 && (
              <div className="text-xs text-amber-200/80 bg-amber-300/5 border border-amber-300/15 rounded-lg p-3 mb-3">
                {t(
                  "💡 يفضّل اكتمال الدفع قبل إصدار الشهادة. المتبقي:",
                  "💡 Payment should be completed before issuing certificate. Remaining:",
                )}{" "}
                {(coursePrice - totalPaid).toLocaleString()} {courseCur}
              </div>
            )}
            <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4 space-y-3 mb-3">
              {enrollment.certificate_requested_at && !issued && (
                <p className="text-xs text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />{" "}
                  {t("المتدرب طلب الشهادة في", "Trainee requested certificate on")}{" "}
                  {new Date(enrollment.certificate_requested_at).toLocaleString("ar-EG")}
                </p>
              )}
              <div className="text-xs space-y-1 text-white/80">
                <div className="flex justify-between">
                  <span className="text-white/50">{t("الاسم (عربي):", "Name (Arabic):")}</span>
                  <span className="font-semibold">
                    {enrollment.name_ar || t("— لم يُدخل بعد", "— not set")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">{t("الاسم (إنجليزي):", "Name (English):")}</span>
                  <span className="font-semibold" dir="ltr">
                    {enrollment.name_en || "— not set"}
                  </span>
                </div>
              </div>
              <button
                onClick={autoIssueCertificate}
                disabled={autoIssuing || !enrollment.name_ar || !enrollment.name_en}
                className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, var(--gold), #b8923f)",
                  color: "#0b1736",
                }}
              >
                {autoIssuing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    {t("جاري التوليد...", "Generating...")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />{" "}
                    {t(
                      "إصدار الشهادة تلقائياً (عربي + إنجليزي)",
                      "Issue certificate automatically (Arabic + English)",
                    )}
                  </>
                )}
              </button>
              {(enrollment.certificate_url_ar || enrollment.certificate_url_en) && (
                <p className="text-xs text-emerald-300 text-center">
                  {t("✓ تم إصدار الشهادة بنجاح", "✓ Certificate issued successfully")}
                </p>
              )}
            </div>
            <details className="dash-card dash-card-hover p-4 space-y-3">
              <summary className="text-xs text-white/50 cursor-pointer">
                {t("رفع ملف يدوي (اختياري)", "Upload file manually (optional)")}
              </summary>
              <label className="block mt-3">
                <span className="text-xs text-white/60 mb-2 block">
                  {t("رفع ملف الشهادة (PDF / صورة)", "Upload certificate file (PDF / image)")}
                </span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => e.target.files?.[0] && uploadCert(e.target.files[0])}
                  className="block w-full text-xs file:me-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-[var(--gold)] file:text-[#0b1736] file:font-semibold file:cursor-pointer cursor-pointer"
                />
              </label>
              {uploading && (
                <p className="text-xs text-amber-300 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> {t("جاري الرفع...", "Uploading...")}
                </p>
              )}
              <button
                onClick={toggleIssued}
                disabled={!enrollment.certificate_url}
                className={`w-full h-10 rounded-lg text-xs font-semibold transition ${
                  issued
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-white/5 border border-white/15 text-white/70"
                } disabled:opacity-50`}
              >
                {issued
                  ? t("✓ الشهادة مُصدرة للمتدرب", "✓ Certificate issued to trainee")
                  : t("تفعيل إصدار الشهادة", "Enable certificate issuance")}
              </button>
            </details>
          </section>

          <section>
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[var(--gold)]" /> {t("المدفوعات", "Payments")}
            </h4>
            <form
              onSubmit={addPayment}
              className="dash-card dash-card-hover p-4 grid grid-cols-[1fr_110px_auto] gap-2 items-end mb-3"
            >
              <Input
                label={t("المبلغ", "Amount")}
                type="number"
                value={payAmount}
                onChange={setPayAmount}
              />
              <Select
                label={t("العملة", "Currency")}
                value={payCurr}
                onChange={setPayCurr}
                options={[
                  { v: "EGP", l: t("جنيه", "EGP") },
                  { v: "SAR", l: t("ريال", "SAR") },
                  { v: "USD", l: t("دولار", "USD") },
                  { v: "AED", l: t("درهم", "AED") },
                ]}
              />
              <button
                type="submit"
                className="h-11 px-4 rounded-xl font-semibold"
                style={{ background: "var(--gold)", color: "#0b1736" }}
              >
                {t("إضافة", "Add")}
              </button>
              <div className="col-span-3">
                <Select
                  label={t("طريقة الدفع", "Payment method")}
                  value={payMethodId}
                  onChange={setPayMethodId}
                  options={[
                    { v: "", l: t("— اختر طريقة دفع —", "— Select method —") },
                    ...methods.map((m) => ({ v: m.id, l: lang === "ar" ? m.name_ar : m.name_en })),
                  ]}
                />
              </div>
              <div className="col-span-3">
                <Input
                  label={t("ملاحظة (اختياري)", "Note (optional)")}
                  value={payNote}
                  onChange={setPayNote}
                />
              </div>
            </form>
            <ul className="space-y-1.5">
              {payments.length === 0 ? (
                <li className="text-xs text-white/40">{t("لا توجد مدفوعات", "No payments")}</li>
              ) : (
                payments.map((p) => (
                  <li
                    key={p.id}
                    className={`text-sm rounded-lg px-3 py-2 border gap-3 ${p.status === "pending" ? "bg-amber-300/10 border-amber-300/30" : p.status === "rejected" ? "bg-rose-500/10 border-rose-500/30 opacity-70" : "bg-white/5 border-white/10"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">
                        {Number(p.amount).toLocaleString()} {p.currency}
                      </span>
                      {p.payment_method_name && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-500/30">
                          {p.payment_method_name}
                        </span>
                      )}
                      <span className="text-xs text-white/50 flex-1 truncate">{p.note}</span>
                      <span className="text-xs text-white/40">
                        {new Date(p.paid_at).toLocaleDateString("ar-EG")}
                      </span>
                      <button
                        onClick={() => delPay(p.id)}
                        className="text-rose-300/70 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {p.status === "pending" && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-300/20 text-amber-200 border border-amber-300/30">
                          {t("بانتظار المراجعة", "Pending review")}
                        </span>
                        {p.proof_url && (
                          <ProofLink path={p.proof_url} label={t("عرض الإيصال", "View proof")} />
                        )}
                        <button
                          onClick={async () => {
                            await supabase
                              .from("payments")
                              .update({ status: "approved" } as any)
                              .eq("id", p.id);
                            toast.success(t("تم اعتماد الدفعة", "Payment approved"));
                            refreshLists();
                          }}
                          className="text-[11px] px-2.5 h-7 rounded bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 font-semibold"
                        >
                          {t("اعتماد", "Approve")}
                        </button>
                        <button
                          onClick={async () => {
                            await supabase
                              .from("payments")
                              .update({ status: "rejected" } as any)
                              .eq("id", p.id);
                            toast.success(t("تم رفض الدفعة", "Payment rejected"));
                            refreshLists();
                          }}
                          className="text-[11px] px-2.5 h-7 rounded bg-rose-500/25 text-rose-200 border border-rose-500/40 font-semibold"
                        >
                          {t("رفض", "Reject")}
                        </button>
                      </div>
                    )}
                    {p.status === "rejected" && (
                      <div className="mt-1 text-[11px] text-rose-300">
                        {t("مرفوضة — لا تُحتسب", "Rejected — not counted")}
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
            {!fullyPaid && coursePrice > 0 && (
              <button
                onClick={async () => {
                  await supabase
                    .from("enrollments")
                    .update({ payment_reminder_dismissed_at: new Date().toISOString() } as any)
                    .eq("id", enrollment.id);
                  toast.success(
                    t("تم إخفاء تذكير الدفع للمتدرب", "Trainee payment reminder cleared"),
                  );
                  refresh();
                }}
                className="mt-3 w-full h-10 rounded-lg text-xs font-semibold bg-white/5 border border-white/15 text-white/70 hover:bg-white/10"
              >
                {t(
                  "✓ تأكيد استلام الدفعة وإيقاف تذكير المتدرب",
                  "✓ Confirm receipt & dismiss trainee reminder",
                )}
              </button>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--gold)]" /> {t("الأقساط", "Installments")}
              </h4>
              {installments.length === 0 &&
                (enrollment.courses?.installments_count ?? 1) > 1 &&
                coursePrice > 0 && (
                  <button
                    onClick={autoSplitInstallments}
                    className="text-[11px] px-3 h-8 rounded-lg bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30"
                  >
                    {t("⚡ توليد جدول تلقائي", "⚡ Auto-generate schedule")} (
                    {enrollment.courses?.installments_count} {t("أقساط", "installments")})
                  </button>
                )}
            </div>
            <form
              onSubmit={addInstallment}
              className="dash-card dash-card-hover p-4 grid grid-cols-[1fr_110px_140px_auto] gap-2 items-end mb-3"
            >
              <Input
                label={t("المبلغ", "Amount")}
                type="number"
                value={insAmount}
                onChange={setInsAmount}
              />
              <Select
                label={t("العملة", "Currency")}
                value={insCurr}
                onChange={setInsCurr}
                options={[
                  { v: "EGP", l: t("جنيه", "EGP") },
                  { v: "SAR", l: t("ريال", "SAR") },
                  { v: "USD", l: t("دولار", "USD") },
                  { v: "AED", l: t("درهم", "AED") },
                ]}
              />
              <Input
                label={t("تاريخ الاستحقاق", "Due date")}
                type="date"
                value={insDate}
                onChange={setInsDate}
              />
              <button
                type="submit"
                className="h-11 px-4 rounded-xl font-semibold"
                style={{ background: "var(--gold)", color: "#0b1736" }}
              >
                {t("إضافة", "Add")}
              </button>
            </form>
            <ul className="space-y-1.5">
              {installments.length === 0 ? (
                <li className="text-xs text-white/40">{t("لا توجد أقساط", "No installments")}</li>
              ) : (
                installments.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/10 gap-3"
                  >
                    <span className="font-semibold">
                      {Number(i.amount).toLocaleString()} {i.currency}
                    </span>
                    <span className="text-xs text-white/50">{i.due_date || "—"}</span>
                    <button
                      onClick={() => togglePaid(i.id, i.paid)}
                      className={`text-xs px-2 py-1 rounded-md ${i.paid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}
                    >
                      {i.paid ? t("مدفوع", "Paid") : t("مستحق", "Due")}
                    </button>
                    <button
                      onClick={() => delInst(i.id)}
                      className="text-rose-300/70 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
