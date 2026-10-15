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
import { Course, CourseLead, LeadStatus } from "@/components/admin/panels/types";

export function CourseLeadsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [leads, setLeads] = useState<CourseLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_interests" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLeads(((data as any[]) ?? []) as CourseLead[]);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function updateStatus(id: string, status: LeadStatus) {
    const { error } = await supabase
      .from("course_interests" as any)
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("تم التحديث", "Updated"));
    refresh();
  }

  async function saveNote(id: string) {
    const { error } = await supabase
      .from("course_interests" as any)
      .update({ admin_notes: noteDraft.trim() || null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("تم حفظ الملاحظة", "Note saved"));
    setEditingNote(null);
    setNoteDraft("");
    refresh();
  }

  async function remove(id: string) {
    if (!confirm(t("هل تريد حذف هذا الاهتمام؟", "Delete this lead?"))) return;
    const { error } = await supabase
      .from("course_interests" as any)
      .delete()
      .eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  const uniqueCourses = useMemo(() => {
    const map = new Map<string, string>();
    leads.forEach((l) => {
      if (l.course_title) map.set(l.course_title, l.course_title);
    });
    return Array.from(map.keys()).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter !== "all" && l.status !== filter) return false;
      if (courseFilter !== "all" && l.course_title !== courseFilter) return false;
      if (!q) return true;
      return (
        l.full_name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.course_title?.toLowerCase().includes(q) ||
        l.notes?.toLowerCase().includes(q) ||
        l.admin_notes?.toLowerCase().includes(q)
      );
    });
  }, [leads, filter, search, courseFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      total: leads.length,
      today: leads.filter((l) => new Date(l.created_at) >= today).length,
      week: leads.filter((l) => new Date(l.created_at) >= weekAgo).length,
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      converted: leads.filter((l) => l.status === "converted").length,
      conversionRate:
        leads.length > 0
          ? Math.round(
              (leads.filter((l) => l.status === "converted").length / leads.length) * 100,
            )
          : 0,
    };
  }, [leads]);

  function exportCsv() {
    const headers = [
      "created_at",
      "full_name",
      "email",
      "phone",
      "country_code",
      "language",
      "course_title",
      "status",
      "notes",
      "admin_notes",
    ];
    const escape = (v: any) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = filtered.map((l) => headers.map((h) => escape((l as any)[h])).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `course-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t(`تم تصدير ${filtered.length} ليد`, `Exported ${filtered.length} leads`));
  }

  const statCards: Array<{ label: string; value: string | number; hint?: string }> = [
    { label: t("الإجمالي", "Total"), value: stats.total },
    { label: t("اليوم", "Today"), value: stats.today },
    { label: t("آخر 7 أيام", "Last 7 days"), value: stats.week },
    { label: t("معدل التحوّل", "Conversion"), value: `${stats.conversionRate}%`, hint: `${stats.converted}/${stats.total}` },
  ];

  return (
    <div className="dash-card p-5 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold">
            {t("CRM · اهتمامات الكورسات", "CRM · Course leads")}
          </h3>
          <p className="text-xs text-white/55 mt-1">
            {t(
              "قاعدة بيانات الليدز مع فلاتر وحالات وملاحظات وتصدير CSV.",
              "Leads database with filters, statuses, notes and CSV export.",
            )}
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="px-4 h-9 rounded-xl text-xs font-bold bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] disabled:opacity-50 inline-flex items-center gap-2"
        >
          <FileText className="w-3.5 h-3.5" />
          {t(`تصدير CSV (${filtered.length})`, `Export CSV (${filtered.length})`)}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{s.label}</div>
            <div className="text-xl font-extrabold text-white mt-1">{s.value}</div>
            {s.hint && <div className="text-[10px] text-white/40 mt-0.5">{s.hint}</div>}
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("بحث بالاسم أو البريد أو الهاتف…", "Search name, email, phone…")}
          className="w-full rounded-xl px-3 h-10 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50"
        />
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="rounded-xl px-3 h-10 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50"
        >
          <option value="all">{t("كل الكورسات", "All courses")}</option>
          {uniqueCourses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {(["all", "new", "contacted", "converted", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 h-8 rounded-lg text-xs font-semibold transition ${
              filter === f
                ? "bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/30"
                : "text-white/55 hover:text-white border border-transparent"
            }`}
          >
            {f === "all"
              ? t("الكل", "All")
              : f === "new"
                ? t("جديد", "New")
                : f === "contacted"
                  ? t("تم التواصل", "Contacted")
                  : f === "converted"
                    ? t("تحوّل لمتدرب", "Converted")
                    : t("مؤرشف", "Archived")}
            <span className="opacity-60 ms-1">
              ({f === "all" ? leads.length : leads.filter((l) => l.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-white/50 text-sm">
          {t("جارٍ التحميل…", "Loading…")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-white/15 text-white/50 text-sm">
          {t("لا توجد نتائج مطابقة.", "No matching results.")}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <div key={l.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-sm">{l.full_name}</div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        l.status === "new"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : l.status === "contacted"
                            ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                            : l.status === "converted"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-white/5 text-white/50 border border-white/10"
                      }`}
                    >
                      {l.status === "new"
                        ? t("جديد", "New")
                        : l.status === "contacted"
                          ? t("تم التواصل", "Contacted")
                          : l.status === "converted"
                            ? t("تحول لمتدرب", "Converted to trainee")
                            : t("مؤرشف", "Archived")}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-white/40">
                      {l.language}
                    </span>
                  </div>
                  <div className="mt-1.5 grid sm:grid-cols-2 gap-1 text-xs text-white/70">
                    <a href={`mailto:${l.email}`} className="hover:text-[var(--gold)] truncate">
                      ✉ {l.email}
                    </a>
                    {l.phone && (
                      <a
                        href={`https://wa.me/${(l.phone || "").replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-emerald-300 truncate"
                      >
                        💬 {l.phone}
                      </a>
                    )}
                  </div>
                  {l.course_title && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 px-2.5 py-1 font-semibold">
                      <BookOpen className="w-3 h-3" /> {l.course_title}
                    </div>
                  )}
                  {l.notes && (
                    <div className="mt-2 text-xs text-white/60 bg-white/[0.02] border border-white/10 rounded-lg p-2">
                      <span className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">
                        {t("رسالة الليد", "Lead message")}
                      </span>
                      {l.notes}
                    </div>
                  )}
                  {editingNote === l.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        rows={3}
                        placeholder={t("ملاحظة داخلية…", "Internal note…")}
                        className="w-full rounded-lg px-3 py-2 text-xs bg-white/5 text-white border border-[var(--gold)]/40 outline-none resize-none"
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => saveNote(l.id)}
                          className="text-[11px] px-3 h-7 rounded-lg bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/30 font-semibold"
                        >
                          {t("حفظ", "Save")}
                        </button>
                        <button
                          onClick={() => { setEditingNote(null); setNoteDraft(""); }}
                          className="text-[11px] px-3 h-7 rounded-lg bg-white/5 text-white/60 border border-white/10 font-semibold"
                        >
                          {t("إلغاء", "Cancel")}
                        </button>
                      </div>
                    </div>
                  ) : l.admin_notes ? (
                    <div
                      className="mt-2 text-xs text-amber-100 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2 cursor-pointer hover:bg-amber-500/10"
                      onClick={() => { setEditingNote(l.id); setNoteDraft(l.admin_notes || ""); }}
                    >
                      <span className="text-amber-300/70 text-[10px] uppercase tracking-wider block mb-1 font-bold">
                        📝 {t("ملاحظة الأدمن", "Admin note")}
                      </span>
                      {l.admin_notes}
                    </div>
                  ) : null}
                </div>
                <div className="text-[10px] text-white/40 shrink-0 text-end">
                  {new Date(l.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {l.status !== "contacted" && (
                  <button
                    onClick={() => updateStatus(l.id, "contacted")}
                    className="text-[11px] px-3 h-7 rounded-lg bg-sky-500/15 text-sky-200 border border-sky-500/30 hover:bg-sky-500/25 font-semibold"
                  >
                    {t("تم التواصل", "Mark contacted")}
                  </button>
                )}
                {l.status !== "converted" && (
                  <button
                    onClick={() => updateStatus(l.id, "converted")}
                    className="text-[11px] px-3 h-7 rounded-lg bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/25 font-semibold"
                  >
                    {t("تحول لمتدرب", "Converted to trainee")}
                  </button>
                )}
                {l.status !== "archived" && (
                  <button
                    onClick={() => updateStatus(l.id, "archived")}
                    className="text-[11px] px-3 h-7 rounded-lg bg-white/5 text-white/55 border border-white/10 hover:bg-white/10 font-semibold"
                  >
                    {t("أرشفة", "Archive")}
                  </button>
                )}
                {l.status !== "new" && (
                  <button
                    onClick={() => updateStatus(l.id, "new")}
                    className="text-[11px] px-3 h-7 rounded-lg bg-amber-500/15 text-amber-200 border border-amber-500/30 hover:bg-amber-500/25 font-semibold"
                  >
                    {t("إرجاع لجديد", "Reset to new")}
                  </button>
                )}
                {editingNote !== l.id && (
                  <button
                    onClick={() => { setEditingNote(l.id); setNoteDraft(l.admin_notes || ""); }}
                    className="text-[11px] px-3 h-7 rounded-lg bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 font-semibold inline-flex items-center gap-1"
                  >
                    <StickyNote className="w-3 h-3" />
                    {l.admin_notes ? t("تعديل الملاحظة", "Edit note") : t("إضافة ملاحظة", "Add note")}
                  </button>
                )}
                <button
                  onClick={() => remove(l.id)}
                  className="text-[11px] px-3 h-7 rounded-lg bg-rose-500/15 text-rose-200 border border-rose-500/30 hover:bg-rose-500/25 font-semibold inline-flex items-center gap-1 ms-auto"
                >
                  <Trash2 className="w-3 h-3" /> {t("حذف", "Delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
