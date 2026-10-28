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
import { CourseCertificateSettings } from "./CourseCertificateSettings";
import { CourseAssignmentsAdmin } from "@/components/admin/panels/CourseAssignments";
import { CourseContent, CourseSessions, CourseSettings } from "@/components/admin/panels/CourseContent";
import { Course, EnrollmentRow } from "@/components/admin/panels/types";
import { Input, Select, TextArea } from "@/components/admin/panels/ui";
import { courseDeliveryMode } from "@/lib/course-delivery";

export function CoursesPanel({
  courses,
  enrollments,
  refresh,
  onEdit,
}: {
  courses: Course[];
  enrollments: EnrollmentRow[];
  refresh: () => void;
  onEdit: (c: Course) => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "EGP",
    starts_at: "",
    ends_at: "",
    installments_count: "1",
    online_url: "",
    cover_emoji: "🎓",
    total_hours: "",
    course_goals: "",
    target_audience: "",
    delivery_mode: "live",
  });
  const [busy, setBusy] = useState(false);

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("courses").insert({
      title: form.title,
      description: form.description || null,
      price: form.price ? Number(form.price) : 0,
      currency: form.currency,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      installments_count: Number(form.installments_count) || 1,
      online_url: form.online_url || null,
      cover_emoji: form.cover_emoji || "🎓",
      total_hours: form.total_hours ? Number(form.total_hours) : 0,
      course_goals: form.course_goals || null,
      target_audience: form.target_audience || null,
      active: true,
      delivery_mode: courseDeliveryMode(form.delivery_mode),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("تمت إضافة الكورس", "Course added"));
    setForm({
      title: "",
      description: "",
      price: "",
      currency: "EGP",
      starts_at: "",
      ends_at: "",
      installments_count: "1",
      online_url: "",
      cover_emoji: "🎓",
      total_hours: "",
      course_goals: "",
      target_audience: "",
      delivery_mode: "live",
    });
    refresh();
  }

  async function toggleActive(c: Course) {
    const { error } = await supabase.from("courses").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function del(id: string, archived: boolean) {
    const msg = archived
      ? t("استعادة الكورس من الأرشيف؟", "Restore course from archive?")
      : t(
          "أرشفة الكورس؟ سيختفي من الكتالوج العام مع الاحتفاظ بكل البيانات (Soft Delete).",
          "Archive course? It will disappear from the public catalog while all data is preserved (Soft Delete).",
        );
    if (!confirm(msg)) return;
    const { error } = await supabase
      .from("courses")
      .update({ is_archived: !archived })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(archived ? t("تمت الاستعادة", "Restored") : t("تمت الأرشفة", "Archived"));
    refresh();
  }

  async function deleteCourseForever(id: string, title: string) {
    if (
      !confirm(
        t(
          `حذف الكورس "${title}" نهائياً؟ سيتم حذف المحتوى والطلبات والمدفوعات المرتبطة ولا يمكن التراجع.`,
          `Permanently delete "${title}"? Related content, enrollments, and payments will be removed and this cannot be undone.`,
        ),
      )
    )
      return;
    const { data: mods } = await supabase.from("course_modules").select("id").eq("course_id", id);
    const moduleIds = (mods ?? []).map((m: any) => m.id);
    const { data: assigns } = await supabase.from("assignments").select("id").eq("course_id", id);
    const assignmentIds = (assigns ?? []).map((a: any) => a.id);
    const { data: enrolls } = await supabase.from("enrollments").select("id").eq("course_id", id);
    const enrollmentIds = (enrolls ?? []).map((e: any) => e.id);
    if (assignmentIds.length)
      await supabase.from("assignment_submissions").delete().in("assignment_id", assignmentIds);
    if (moduleIds.length) await supabase.from("module_items").delete().in("module_id", moduleIds);
    if (enrollmentIds.length) {
      await supabase.from("payments").delete().in("enrollment_id", enrollmentIds);
      await supabase.from("installments").delete().in("enrollment_id", enrollmentIds);
      await supabase.from("coupon_redemptions").delete().in("enrollment_id", enrollmentIds);
    }
    await supabase.from("assignments").delete().eq("course_id", id);
    await supabase.from("course_sessions").delete().eq("course_id", id);
    await supabase.from("course_trainers").delete().eq("course_id", id);
    await supabase.from("course_interests").delete().eq("course_id", id);
    await supabase.from("course_modules").delete().eq("course_id", id);
    await supabase.from("enrollments").delete().eq("course_id", id);
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("تم حذف الكورس نهائياً", "Course permanently deleted"));
    refresh();
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-3">
        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50 text-sm">
            {t("لا توجد كورسات. أضف أول كورس →", "No courses yet. Add your first course →")}
          </div>
        ) : (
          courses.map((c) => {
            const courseEnrollments = enrollments.filter((e) => e.course_id === c.id);
            const activeCount = courseEnrollments.filter(
              (e) => e.status === "approved" && !e.profiles?.account_blocked,
            ).length;
            const pendingCount = courseEnrollments.filter((e) => e.status === "pending").length;
            return (
              <div
                key={c.id}
                className="dash-card dash-card-hover p-5 hover:border-[var(--gold)]/30 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-2xl shrink-0">
                    {c.cover_emoji || "🎓"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-lg">{c.title}</h4>
                      {!c.active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                          {t("متوقف", "Inactive")}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">
                        {c.installments_count === 1
                          ? t("دفعة كاملة", "Full payment")
                          : `${c.installments_count} ${t(`أقساط`, `installments`)}`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                        <Users className="w-3 h-3" /> {activeCount} {t("ملتحق", "enrolled")}
                      </span>
                      {pendingCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-300/15 text-amber-200 border border-amber-300/30 font-semibold">
                          +{pendingCount} {t("بانتظار", "pending")}
                        </span>
                      )}
                    </div>
                    {c.description && (
                      <p className="text-xs text-white/55 mt-1.5 line-clamp-2">{c.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-white/60 flex-wrap">
                      <span className="text-[var(--gold)] font-semibold">
                        {Number(c.price) > 0
                          ? `${Number(c.price).toLocaleString()} ${c.currency}`
                          : t("مجاني", "Free")}
                      </span>
                      {c.starts_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {c.starts_at} → {c.ends_at || "—"}
                        </span>
                      )}
                    </div>
                  </div>
                   <div className="flex shrink-0 items-center gap-1">
                     <Button size="sm" variant="outline"
                      onClick={() => onEdit(c)}
                    >
                       <Pencil className="w-3.5 h-3.5" /> {t("تعديل", "Edit")}
                     </Button>
                     <div className="flex gap-1 justify-end">
                       <Button size="icon" variant="ghost"
                        onClick={() => toggleActive(c)}
                        aria-label={c.active ? t("إيقاف", "Disable") : t("تفعيل", "Enable")}
                        title={c.active ? t("إيقاف", "Disable") : t("تفعيل", "Enable")}
                      >
                        {c.active ? (
                          <ToggleRight className="w-5 h-5 text-emerald-300" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-white/40" />
                        )}
                       </Button>
                       <details className="relative group"><summary aria-label={t("مزيد من الإجراءات", "More actions")} title={t("مزيد من الإجراءات", "More actions")} className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md text-muted-foreground hover:bg-secondary [&::-webkit-details-marker]:hidden"><MoreHorizontal className="size-4" /></summary><div className="absolute end-0 top-full z-20 min-w-36 rounded-md border border-border bg-popover p-1 shadow-lg"><Button size="sm" variant="ghost" className="w-full justify-start" 
                        onClick={() => del(c.id, Boolean((c as any).is_archived))}
                        title={
                          (c as any).is_archived ? t("استعادة", "Restore") : t("أرشفة", "Archive")
                        }
                      >
                         <Archive className="w-4 h-4" /> {(c as any).is_archived ? t("استعادة", "Restore") : t("أرشفة", "Archive")}
                       </Button>
                       <Button size="sm" variant="ghost" className="w-full justify-start text-destructive"
                        onClick={() => deleteCourseForever(c.id, c.title)}
                        title={t("حذف نهائي", "Delete forever")}
                      >
                         <Trash2 className="w-4 h-4" /> {t("حذف نهائي", "Delete forever")}
                       </Button></div></details>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={addCourse}
        className="dash-card dash-card-hover p-5 space-y-3 h-fit sticky top-24"
      >
        <h4 className="font-bold flex items-center gap-2">
          <Plus className="w-4 h-4 text-[var(--gold)]" /> {t("إضافة كورس", "Add course")}
        </h4>
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <Input
            label={t("إيموجي", "Emoji")}
            value={form.cover_emoji}
            onChange={(v) => setForm({ ...form, cover_emoji: v })}
          />
          <Input
            label={t("اسم الكورس", "Course name")}
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            required
          />
        </div>
        <TextArea
          label={t("الوصف", "Description")}
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <Select
          label={t("نوع الكورس", "Course format")}
          value={form.delivery_mode}
          onChange={(v) => setForm({ ...form, delivery_mode: v })}
          options={[
            { v: "live", l: t("مباشر", "Live") },
            { v: "recorded", l: t("مسجل", "Recorded") },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("السعر", "Price")}
            type="number"
            value={form.price}
            onChange={(v) => setForm({ ...form, price: v })}
          />
          <Select
            label={t("العملة", "Currency")}
            value={form.currency}
            onChange={(v) => setForm({ ...form, currency: v })}
            options={[
              { v: "EGP", l: t("جنيه", "EGP") },
              { v: "SAR", l: t("ريال", "SAR") },
              { v: "USD", l: t("دولار", "USD") },
              { v: "AED", l: t("درهم", "AED") },
            ]}
          />
        </div>
        <Select
          label={t("نظام الدفع", "Payment plan")}
          value={form.installments_count}
          onChange={(v) => setForm({ ...form, installments_count: v })}
          options={[
            { v: "1", l: t("دفعة كاملة", "Full payment") },
            { v: "2", l: t("دفعتين", "2 installments") },
            { v: "3", l: t("ثلاث دفعات", "3 installments") },
            { v: "4", l: t("أربع دفعات", "4 installments") },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("تاريخ البدء", "Start date")}
            type="date"
            value={form.starts_at}
            onChange={(v) => setForm({ ...form, starts_at: v })}
          />
          <Input
            label={t("تاريخ الانتهاء", "End date")}
            type="date"
            value={form.ends_at}
            onChange={(v) => setForm({ ...form, ends_at: v })}
          />
        </div>
        <Input
          label={t("رابط الكورس", "Course link")}
          value={form.online_url}
          onChange={(v) => setForm({ ...form, online_url: v })}
        />
        <Input
          label={t("عدد ساعات الكورس", "Total hours")}
          type="number"
          value={form.total_hours}
          onChange={(v) => setForm({ ...form, total_hours: v })}
        />
        <TextArea
          label={t("مخرجات الكورس", "Course outcomes")}
          value={form.course_goals}
          onChange={(v) => setForm({ ...form, course_goals: v })}
        />
        <TextArea
          label={t("هذا الكورس مناسب لـ", "This course is best for")}
          value={form.target_audience}
          onChange={(v) => setForm({ ...form, target_audience: v })}
        />
        <button
          disabled={busy}
          type="submit"
          className="w-full h-11 rounded-xl font-semibold disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}
        >
          {busy ? "..." : t("إضافة الكورس", "Add course")}
        </button>
      </form>
    </div>
  );
}

// ============= COURSE EDITOR (chapters/items/sessions/settings) =============

export function CourseEditor({
  course,
  onClose,
  refresh,
}: {
  course: Course;
  onClose: () => void;
  refresh: () => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [section, setSection] = useState<"content" | "assignments" | "sessions" | "settings" | "certificate">(
    "content",
  );
  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ms-auto w-full max-w-3xl h-full bg-[#0b1736] border-s border-white/10 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[rgba(11,23,54,0.95)] backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{course.cover_emoji || "🎓"}</span>
            <div>
              <p className="text-xs text-white/50">{t("إدارة الكورس", "Manage course")}</p>
              <h3 className="text-lg font-bold">{course.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2 flex gap-1 overflow-x-auto">
          {[
            { id: "content", label: t("المحتوى والأبواب", "Content & modules"), icon: Layers },
            { id: "assignments", label: t("التكليفات", "Assignments"), icon: Layers },
            {
              id: "sessions",
              label: t("المحاضرات والمواعيد", "Sessions & schedule"),
              icon: Calendar,
            },
            { id: "settings", label: t("إعدادات", "Settings"), icon: Settings2 },
            { id: "certificate", label: t("إعدادات الشهادة", "Certificate"), icon: Settings2 },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setSection(tb.id as any)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 h-10 rounded-xl text-xs font-semibold transition ${
                section === tb.id
                  ? "bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] shadow-[0_6px_18px_-8px_rgba(212,175,55,0.6)]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <tb.icon className="w-3.5 h-3.5" /> {tb.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {section === "content" && <CourseContent courseId={course.id} />}
          {section === "assignments" && <CourseAssignmentsAdmin courseId={course.id} />}
          {section === "sessions" && <CourseSessions courseId={course.id} />}
          {section === "certificate" && <CourseCertificateSettings course={course} />}
          {section === "settings" && (
            <CourseSettings
              course={course}
              onSaved={() => {
                refresh();
              }}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
