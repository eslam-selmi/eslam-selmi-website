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
import { CouponRow, Course } from "@/components/admin/panels/types";

export function CouponsPanel({ courses }: { courses: Course[] }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [rows, setRows] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as CouponRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function toggleActive(c: CouponRow) {
    const { error } = await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  }
  async function remove(id: string) {
    if (
      !confirm(
        t("هل أنت متأكد من حذف هذا الكوبون؟", "Are you sure you want to delete this coupon?"),
      )
    )
      return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحذف", "Deleted"));
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[var(--gold)]" />
          <h2 className="text-lg font-bold">{t("كوبونات الخصم", "Discount coupons")}</h2>
          <span className="text-xs text-white/50">({rows.length})</span>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> {t("كوبون جديد", "New coupon")}
        </button>
      </div>

      {loading ? (
        <p className="text-white/50 text-sm">{t("جاري التحميل...", "Loading...")}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">
          {t(
            "لا توجد كوبونات بعد. أنشئ كوبوناً جديداً للبدء.",
            "No coupons yet. Create a new one to get started.",
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/60 text-xs">
              <tr>
                <th className="text-right p-3 font-medium">{t("الكود", "Code")}</th>
                <th className="text-right p-3 font-medium">{t("الخصم", "Discount")}</th>
                <th className="text-right p-3 font-medium">{t("الكورس", "Course")}</th>
                <th className="text-right p-3 font-medium">{t("الاستخدام", "Usage")}</th>
                <th className="text-right p-3 font-medium">{t("انتهاء", "Expires")}</th>
                <th className="text-right p-3 font-medium">{t("الحالة", "Status")}</th>
                <th className="text-right p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const course = courses.find((x) => x.id === c.course_id);
                const exhausted = c.max_uses !== null && c.used_count >= c.max_uses;
                const expired = c.expires_at !== null && new Date(c.expires_at) <= new Date();
                return (
                  <tr key={c.id} className="border-t border-white/10">
                    <td className="p-3 font-mono font-bold text-[var(--gold)]">{c.code}</td>
                    <td className="p-3">
                      {c.discount_type === "percent"
                        ? `${c.discount_value}%`
                        : `${c.discount_value} EGP`}
                    </td>
                    <td className="p-3 text-xs text-white/70">
                      {course?.title ?? t("جميع الكورسات", "All courses")}
                    </td>
                    <td className="p-3 text-xs">
                      {c.used_count} / {c.max_uses ?? "∞"}
                    </td>
                    <td className="p-3 text-xs text-white/60">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString("ar-EG") : "—"}
                    </td>
                    <td className="p-3">
                      {!c.active ? (
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60">
                          {t("معطّل", "Disabled")}
                        </span>
                      ) : expired ? (
                        <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300">
                          {t("منتهي", "Expired")}
                        </span>
                      ) : exhausted ? (
                        <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300">
                          {t("مستنفد", "Exhausted")}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">
                          {t("نشط", "Active")}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => toggleActive(c)}
                          className="p-2 rounded hover:bg-white/10"
                          title={c.active ? t("إيقاف", "Disable") : t("تفعيل", "Enable")}
                        >
                          {c.active ? (
                            <ToggleRight className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          className="p-2 rounded hover:bg-red-500/20 text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewCouponModal
          courses={courses}
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export function NewCouponModal({
  courses,
  onClose,
  onSaved,
}: {
  courses: Course[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [courseId, setCourseId] = useState<string>("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return toast.error(t("أدخل كود الكوبون", "Enter coupon code"));
    const val = Number(discountValue);
    if (isNaN(val) || val <= 0)
      return toast.error(t("قيمة خصم غير صحيحة", "Invalid discount value"));
    if (discountType === "percent" && val > 100)
      return toast.error(t("النسبة يجب ألا تتجاوز 100%", "Percentage must not exceed 100%"));
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      code: trimmed,
      discount_type: discountType,
      discount_value: val,
      course_id: courseId || null,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      note: note || null,
    });
    setSaving(false);
    if (error)
      return toast.error(
        error.message.includes("duplicate")
          ? t("هذا الكود مستخدم بالفعل", "This code is already in use")
          : error.message,
      );
    toast.success(t("تم إنشاء الكوبون", "Coupon created"));
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0b1736] border border-white/15 rounded-2xl w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[var(--gold)]" />{" "}
            {t("كوبون خصم جديد", "New discount coupon")}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs text-white/60 block mb-1">{t("الكود", "Code")}</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SUMMER25"
            className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 font-mono uppercase tracking-wider"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/60 block mb-1">
              {t("نوع الخصم", "Discount type")}
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15"
            >
              <option value="percent">{t("نسبة مئوية %", "Percentage %")}</option>
              <option value="fixed">{t("مبلغ ثابت EGP", "Fixed amount EGP")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">{t("القيمة", "Value")}</label>
            <div className="relative">
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full h-10 px-3 pr-9 rounded-lg bg-white/5 border border-white/15"
              />
              <Percent className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-white/60 block mb-1">
            {t("الكورس (اختياري)", "Course (optional)")}
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15"
          >
            <option value="">{t("جميع الكورسات", "All courses")}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/60 block mb-1">
              {t("حد الاستخدام (اختياري)", "Usage limit (optional)")}
            </label>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder={t("غير محدود", "Unlimited")}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">
              {t("تاريخ الانتهاء (اختياري)", "End date (optional)")}
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/60 block mb-1">
            {t("ملاحظة داخلية (اختياري)", "Internal note (optional)")}
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("مثال: حملة الصيف", "e.g. Summer campaign")}
            className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-lg bg-white/5 border border-white/15 text-sm"
          >
            {t("إلغاء", "Cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 h-11 rounded-lg bg-[var(--gold)] text-[#0b1736] text-sm font-semibold disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              t("إنشاء الكوبون", "Create coupon")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
