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
import { Input, Select, StatCard, TextArea } from "@/components/admin/panels/ui";

export function PaymentMethodsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState({
    name_ar: "",
    name_en: "",
    details_ar: "",
    details_en: "",
    order_index: "0",
  });

  async function load() {
    const { data } = await supabase
      .from("payment_methods" as any)
      .select("*")
      .order("order_index");
    setRows((data as any[]) ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!f.name_ar.trim() || !f.name_en.trim())
      return toast.error(t("أدخل الاسم بالعربي والإنجليزي", "Enter Arabic and English name"));
    const { error } = await supabase.from("payment_methods" as any).insert({
      name_ar: f.name_ar,
      name_en: f.name_en,
      details_ar: f.details_ar || null,
      details_en: f.details_en || null,
      order_index: Number(f.order_index) || 0,
    } as any);
    if (error) return toast.error(error.message);
    setF({ name_ar: "", name_en: "", details_ar: "", details_en: "", order_index: "0" });
    toast.success(t("تمت الإضافة", "Added"));
    load();
  }
  async function patch(id: string, p: any) {
    const { error } = await supabase
      .from("payment_methods" as any)
      .update(p)
      .eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }
  async function del(id: string) {
    if (!confirm(t("حذف طريقة الدفع؟", "Delete payment method?"))) return;
    await supabase
      .from("payment_methods" as any)
      .delete()
      .eq("id", id);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="dash-card dash-card-hover p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[var(--gold)]" />{" "}
          {t("إضافة طريقة دفع جديدة", "Add new payment method")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={t("الاسم (عربي)", "Name (Arabic)")}
            value={f.name_ar}
            onChange={(v) => setF({ ...f, name_ar: v })}
          />
          <Input
            label={t("الاسم (إنجليزي)", "Name (English)")}
            value={f.name_en}
            onChange={(v) => setF({ ...f, name_en: v })}
          />
          <TextArea
            label={t("تفاصيل / تعليمات (عربي)", "Details / instructions (Arabic)")}
            value={f.details_ar}
            onChange={(v) => setF({ ...f, details_ar: v })}
          />
          <TextArea
            label={t("تفاصيل / تعليمات (إنجليزي)", "Details / instructions (English)")}
            value={f.details_en}
            onChange={(v) => setF({ ...f, details_en: v })}
          />
          <Input
            label={t("ترتيب العرض", "Display order")}
            type="number"
            value={f.order_index}
            onChange={(v) => setF({ ...f, order_index: v })}
          />
        </div>
        <button
          onClick={add}
          className="px-5 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm"
        >
          <Plus className="w-4 h-4 inline" /> {t("إضافة", "Add")}
        </button>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-white/40">
            {t("لا توجد طرق دفع بعد", "No payment methods yet")}
          </p>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className={`rounded-2xl border p-4 ${r.active ? "border-white/10 bg-white/5" : "border-rose-500/30 bg-rose-500/5 opacity-70"}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-bold">
                  {r.name_ar}{" "}
                  <span className="text-white/40 font-normal text-xs" dir="ltr">
                    — {r.name_en}
                  </span>
                </p>
                <p className="text-[11px] text-white/40">#{r.order_index}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => patch(r.id, { active: !r.active })}
                  className="text-xs px-2.5 h-8 rounded bg-white/10 border border-white/15"
                >
                  {r.active ? t("تعطيل", "Disable") : t("تفعيل", "Enable")}
                </button>
                <button
                  onClick={() => del(r.id)}
                  className="text-xs px-2.5 h-8 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/40 mb-1">
                  {t("التفاصيل (عربي)", "Details (Arabic)")}
                </p>
                <textarea
                  defaultValue={r.details_ar || ""}
                  onBlur={(e) =>
                    e.target.value !== (r.details_ar || "") &&
                    patch(r.id, { details_ar: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-xs"
                />
              </div>
              <div>
                <p className="text-[10px] text-white/40 mb-1">
                  {t("التفاصيل (إنجليزي)", "Details (English)")}
                </p>
                <textarea
                  defaultValue={r.details_en || ""}
                  onBlur={(e) =>
                    e.target.value !== (r.details_en || "") &&
                    patch(r.id, { details_en: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-xs"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= FINANCE / TRANSACTION LOGS PANEL =============

export function FinancePanel({
  courses,
  enrollments,
}: {
  courses: Course[];
  enrollments: EnrollmentRow[];
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [payments, setPayments] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [methodFilter, setMethodFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showExport, setShowExport] = useState(false);

  async function load() {
    const [p, m] = await Promise.all([
      supabase.from("payments").select("*").order("paid_at", { ascending: false }).limit(1000),
      supabase
        .from("payment_methods" as any)
        .select("*")
        .order("order_index"),
    ]);
    setPayments((p.data as any[]) ?? []);
    setMethods((m.data as any[]) ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  const enrMap = Object.fromEntries(enrollments.map((e) => [e.id, e]));
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  const filtered = payments.filter((p) => {
    if (
      methodFilter &&
      p.payment_method_id !== methodFilter &&
      p.payment_method_name !== methodFilter
    )
      return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (courseFilter) {
      const en = enrMap[p.enrollment_id];
      if (!en || en.course_id !== courseFilter) return false;
    }
    return true;
  });

  const totalApproved = filtered
    .filter((p) => p.status === "approved")
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={Wallet}
          label={t("إجمالي المعتمد", "Approved total")}
          value={Math.round(totalApproved)}
          color="emerald"
        />
        <StatCard
          icon={FileText}
          label={t("عدد المعاملات", "Transactions")}
          value={filtered.length}
          color="gold"
        />
        <StatCard
          icon={Clock}
          label={t("بانتظار المراجعة", "Pending review")}
          value={filtered.filter((p) => p.status === "pending").length}
          color="amber"
        />
      </div>

      <div className="dash-card dash-card-hover p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Select
          label={t("طريقة الدفع", "Payment method")}
          value={methodFilter}
          onChange={setMethodFilter}
          options={[
            { v: "", l: t("كل الطرق", "All methods") },
            ...methods.map((m) => ({ v: m.id, l: lang === "ar" ? m.name_ar : m.name_en })),
          ]}
        />
        <Select
          label={t("الكورس", "Course")}
          value={courseFilter}
          onChange={setCourseFilter}
          options={[
            { v: "", l: t("كل الكورسات", "All courses") },
            ...courses.map((c) => ({ v: c.id, l: c.title })),
          ]}
        />
        <Select
          label={t("الحالة", "Status")}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { v: "", l: t("كل الحالات", "All") },
            { v: "approved", l: t("معتمد", "Approved") },
            { v: "pending", l: t("قيد المراجعة", "Pending") },
            { v: "rejected", l: t("مرفوض", "Rejected") },
          ]}
        />
        <button
          onClick={() => setShowExport(true)}
          className="h-11 self-end px-4 rounded-xl bg-[var(--gold)] text-[#0b1736] font-semibold text-sm"
        >
          {t("📤 تصدير وتحليل", "📤 Export & analyze")}
        </button>
      </div>

      <BulkReceiptsTool />

      <div className="dash-card dash-card-hover overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs text-white/60">
            <tr>
              <th className="text-start p-3">{t("التاريخ", "Date")}</th>
              <th className="text-start p-3">{t("المتدرب", "Trainee")}</th>
              <th className="text-start p-3">{t("الكورس", "Course")}</th>
              <th className="text-start p-3">{t("المبلغ", "Amount")}</th>
              <th className="text-start p-3">{t("الطريقة", "Method")}</th>
              <th className="text-start p-3">{t("الحالة", "Status")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((p) => {
              const en = enrMap[p.enrollment_id];
              const co = en ? courseMap[en.course_id] : null;
              return (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="p-3 text-xs text-white/60">
                    {new Date(p.paid_at).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="p-3 text-xs">
                    {en?.profiles?.full_name || en?.profiles?.email || "—"}
                  </td>
                  <td className="p-3 text-xs text-white/70">{co?.title || "—"}</td>
                  <td className="p-3 font-semibold">
                    {Number(p.amount).toLocaleString()} {p.currency}
                  </td>
                  <td className="p-3 text-xs">{p.payment_method_name || "—"}</td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${p.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : p.status === "pending" ? "bg-amber-300/20 text-amber-200" : "bg-rose-500/20 text-rose-300"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-white/40 text-sm">
                  {t("لا توجد معاملات", "No transactions")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showExport && (
        <ExportDebtsModal
          courses={courses}
          enrollments={enrollments}
          payments={payments}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

export function ExportDebtsModal({
  courses,
  enrollments,
  payments,
  onClose,
}: {
  courses: Course[];
  enrollments: EnrollmentRow[];
  payments: any[];
  onClose: () => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [courseFilter, setCourseFilter] = useState("");
  const [onlyDebts, setOnlyDebts] = useState(true);
  const [minRemaining, setMinRemaining] = useState("0");

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const paidByEnr: Record<string, number> = {};
  payments.forEach((p) => {
    if (p.status === "approved")
      paidByEnr[p.enrollment_id] = (paidByEnr[p.enrollment_id] || 0) + Number(p.amount || 0);
  });

  const rows = enrollments
    .filter((e) => e.status === "approved")
    .filter((e) => !courseFilter || e.course_id === courseFilter)
    .map((e) => {
      const co = courseMap[e.course_id];
      const price = Math.max(0, Number(co?.price || 0) - Number((e as any).discount_amount || 0));
      const paid = paidByEnr[e.id] || 0;
      const remaining = Math.max(0, price - paid);
      return { e, co, price, paid, remaining };
    })
    .filter((r) => !onlyDebts || r.remaining > Number(minRemaining || 0));

  function download() {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Country",
      "Course",
      "Price",
      "Paid",
      "Remaining",
      "Currency",
    ];
    const csv = [headers.join(",")]
      .concat(
        rows.map((r) =>
          [
            r.e.profiles?.full_name || "",
            r.e.profiles?.email || "",
            r.e.profiles?.phone || "",
            r.e.profiles?.country || "",
            r.co?.title || "",
            r.price,
            r.paid,
            r.remaining,
            r.co?.currency || "",
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        ),
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trainees-debts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("تم تصدير الملف", "File exported"));
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0b1736] border border-white/15 rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="flex items-start justify-between">
          <h3 className="font-bold">{t("تصدير تقارير المتدربين", "Export trainee reports")}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label={t("الكورس", "Course")}
            value={courseFilter}
            onChange={setCourseFilter}
            options={[
              { v: "", l: t("كل الكورسات", "All courses") },
              ...courses.map((c) => ({ v: c.id, l: c.title })),
            ]}
          />
          <Input
            label={t("الحد الأدنى للمتأخرات", "Minimum remaining debt")}
            type="number"
            value={minRemaining}
            onChange={setMinRemaining}
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={onlyDebts}
            onChange={(e) => setOnlyDebts(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          {t("عرض المتدربين المتأخرين عن السداد فقط", "Only show trainees with outstanding debts")}
        </label>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
          <p className="text-white/60 mb-2">
            {t("معاينة", "Preview")}:{" "}
            <span className="text-[var(--gold)] font-bold">{rows.length}</span> {t("سجل", "rows")}
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {rows.slice(0, 20).map((r) => (
              <div key={r.e.id} className="flex justify-between gap-2 py-1 border-b border-white/5">
                <span className="truncate">{r.e.profiles?.full_name || r.e.profiles?.email}</span>
                <span className="text-rose-300 font-semibold whitespace-nowrap">
                  {r.remaining.toLocaleString()} {r.co?.currency}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-lg bg-white/5 border border-white/15 text-sm"
          >
            {t("إلغاء", "Cancel")}
          </button>
          <button
            onClick={download}
            disabled={rows.length === 0}
            className="flex-1 h-11 rounded-lg bg-[var(--gold)] text-[#0b1736] text-sm font-semibold disabled:opacity-50"
          >
            {t("📥 تنزيل CSV", "📥 Download CSV")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BulkReceiptsTool() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");

  async function listPayments() {
    let q = supabase.from("payments").select("id,proof_url,paid_at").not("proof_url", "is", null);
    if (from) q = q.gte("paid_at", new Date(from).toISOString());
    if (to) q = q.lte("paid_at", new Date(to + "T23:59:59").toISOString());
    const { data, error } = await q.order("paid_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return [];
    }
    return (data ?? []).filter((p: any) => p.proof_url) as any[];
  }

  async function bulkDownload() {
    setBusy(true);
    setProgress(t("جاري التحميل...", "Preparing..."));
    try {
      const items = await listPayments();
      if (items.length === 0) {
        toast.error(t("لا توجد إيصالات", "No receipts found"));
        return;
      }
      const JSZip = (await import("jszip")).default;
      const { saveAs } = await import("file-saver");
      const zip = new JSZip();
      const CHUNK = 45;
      for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK);
        setProgress(`${i + chunk.length} / ${items.length}`);
        await Promise.all(
          chunk.map(async (p: any) => {
            const { data } = await supabase.storage
              .from("payment-proofs")
              .createSignedUrl(p.proof_url, 300);
            if (!data?.signedUrl) return;
            const res = await fetch(data.signedUrl);
            if (!res.ok) return;
            const blob = await res.blob();
            const name = p.proof_url.split("/").pop() || `${p.id}`;
            zip.file(`${p.paid_at?.slice(0, 10) ?? "unknown"}_${name}`, blob);
          }),
        );
      }
      setProgress(t("ضغط الملفات...", "Compressing..."));
      const out = await zip.generateAsync({ type: "blob" });
      saveAs(out, `receipts-${Date.now()}.zip`);
      toast.success(t("تم التحميل", "Download ready"));
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function purge() {
    if (
      !confirm(
        t(
          "هل أنت متأكد من حذف الإيصالات في النطاق المحدد؟",
          "Are you sure you want to delete receipts in this range?",
        ),
      )
    )
      return;
    if (
      !confirm(
        t(
          "تأكيد نهائي: هذا الإجراء لا يمكن التراجع عنه.",
          "Final confirmation: this cannot be undone.",
        ),
      )
    )
      return;
    setBusy(true);
    setProgress(t("جاري الحذف...", "Deleting..."));
    try {
      const items = await listPayments();
      if (items.length === 0) {
        toast.error(t("لا توجد إيصالات", "No receipts found"));
        return;
      }
      const paths = items.map((p: any) => p.proof_url as string);
      const CHUNK = 50;
      for (let i = 0; i < paths.length; i += CHUNK) {
        const slice = paths.slice(i, i + CHUNK);
        await supabase.storage.from("payment-proofs").remove(slice);
        setProgress(`${i + slice.length} / ${paths.length}`);
      }
      await supabase
        .from("payments")
        .update({ proof_url: null } as any)
        .in(
          "id",
          items.map((p: any) => p.id),
        );
      toast.success(`${t("تم حذف", "Deleted")} ${paths.length}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <div className="dash-card dash-card-hover p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--gold)]">
        {t("🗂️ أداة الإيصالات (تحميل / حذف جماعي)", "🗂️ Receipts tool (bulk download / purge)")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Input label={t("من تاريخ", "From")} type="date" value={from} onChange={setFrom} />
        <Input label={t("إلى تاريخ", "To")} type="date" value={to} onChange={setTo} />
        <button
          onClick={bulkDownload}
          disabled={busy}
          className="h-11 self-end px-4 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-200 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? progress || "..." : t("📦 تحميل مضغوط", "📦 Bulk download")}
        </button>
        <button
          onClick={purge}
          disabled={busy}
          className="h-11 self-end px-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm font-semibold disabled:opacity-50"
        >
          {t("🗑️ حذف من السيرفر", "🗑️ Purge storage")}
        </button>
      </div>
      <p className="text-[10px] text-white/40">
        {t(
          "الحذف نهائي ولا يمكن التراجع عنه. يرجى التحميل أولاً.",
          "Purge is permanent. Download first if needed.",
        )}
      </p>
    </div>
  );
}

/* ---------- COURSE LEADS PANEL ---------- */
