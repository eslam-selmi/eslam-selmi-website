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
import { StatusPill } from "@/components/admin/panels/ui";

export function EnrollmentsTable({
  enrollments,
  courses,
  onOpen,
  refresh,
}: {
  enrollments: EnrollmentRow[];
  courses: Course[];
  onOpen: (e: EnrollmentRow) => void;
  refresh: () => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [filter, setFilter] = useState<string>("all");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  async function setStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("enrollments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(
      status === "approved"
        ? t("تم قبول المتدرب", "Trainee approved")
        : t("تم رفض الطلب", "Request rejected"),
    );
    refresh();
  }

  if (enrollments.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/50">
        {t("لا توجد طلبات بعد.", "No requests yet.")}
      </div>
    );

  // Group enrollments by course id
  const filtered =
    filter === "all" ? enrollments : enrollments.filter((e) => e.course_id === filter);
  const groups = new Map<string, EnrollmentRow[]>();
  for (const en of filtered) {
    const key = en.course_id;
    const arr = groups.get(key) ?? [];
    arr.push(en);
    groups.set(key, arr);
  }
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // By default: open groups that have pending requests; collapsed otherwise.
  function isOpen(courseId: string, hasPending: boolean) {
    const override = openGroups[courseId];
    if (override !== undefined) return override;
    return hasPending;
  }

  return (
    <div className="space-y-4">
      {/* Course filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-3 h-9 rounded-lg border ${filter === "all" ? "bg-[var(--gold)] text-[#0b1736] border-[var(--gold)] font-semibold" : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"}`}
        >
          {t("كل الكورسات", "All courses")} ({enrollments.length})
        </button>
        {courses.map((c) => {
          const count = enrollments.filter((e) => e.course_id === c.id).length;
          if (count === 0) return null;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`text-xs px-3 h-9 rounded-lg border ${filter === c.id ? "bg-[var(--gold)] text-[#0b1736] border-[var(--gold)] font-semibold" : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"}`}
            >
              {c.cover_emoji} {c.title} ({count})
            </button>
          );
        })}
      </div>

      {Array.from(groups.entries()).map(([courseId, rows]) => {
        const course = courseMap.get(courseId);
        const approvedCount = rows.filter((r) => r.status === "approved").length;
        const pendingCount = rows.filter((r) => r.status === "pending").length;
        const open = isOpen(courseId, pendingCount > 0);
        return (
          <div key={courseId} className="dash-card dash-card-hover overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenGroups((g) => ({ ...g, [courseId]: !open }))}
              className="w-full px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between flex-wrap gap-2 hover:bg-white/[0.08] transition text-start"
              aria-expanded={open}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md bg-white/10 transition-transform ${open ? "rotate-90" : ""}`}
                >
                  <span className="text-white/70 text-xs">▶</span>
                </span>
                <span className="text-xl">{course?.cover_emoji ?? "🎓"}</span>
                <h4 className="font-bold">{course?.title}</h4>
              </div>
              <div className="flex gap-2 text-xs">
                {pendingCount > 0 && (
                  <span className="px-2 py-1 rounded-md bg-amber-300/15 text-amber-200 border border-amber-300/30 font-semibold">
                    {t("بانتظار:", "Pending:")} {pendingCount}
                  </span>
                )}
                <span className="px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  {t("ملتحقون:", "Enrolled:")} {approvedCount}
                </span>
                <span className="px-2 py-1 rounded-md bg-white/5 text-white/60 border border-white/15">
                  {t("الإجمالي:", "Total:")} {rows.length}
                </span>
              </div>
            </button>
            {open && (
              <div className="overflow-x-auto animate-fade-in">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.02] text-xs text-white/60 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-right font-medium">
                        {t("المتدرب", "Trainee")}
                      </th>
                      <th className="px-4 py-3 text-right font-medium">{t("الدولة", "Country")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("الحالة", "Status")}</th>
                      <th className="px-4 py-3 text-right font-medium">
                        {t("الشهادة", "Certificate")}
                      </th>
                      <th className="px-4 py-3 text-right font-medium">{t("إجراء", "Action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((en) => {
                      const country = findCountry(en.profiles?.country);
                      return (
                        <tr
                          key={en.id}
                          className={`hover:bg-white/[0.02] ${en.status === "pending" ? "bg-amber-300/[0.04]" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium flex items-center gap-2 flex-wrap">
                              {country && (
                                <span
                                  className="text-base"
                                  title={lang === "ar" ? country.name_ar : country.name_en}
                                >
                                  {country.flag}
                                </span>
                              )}
                              <span>{en.profiles?.full_name || "—"}</span>
                              {en.profiles?.account_blocked && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  {t("موقوف", "Banned")}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/50">{en.profiles?.email}</div>
                            <div className="text-xs text-white/40" dir="ltr">
                              {en.profiles?.phone}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {country ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-base">{country.flag}</span>
                                <span className="text-white/80">
                                  {lang === "ar" ? country.name_ar : country.name_en}
                                </span>
                              </span>
                            ) : (
                              <span className="text-white/40">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill status={en.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-white/60">
                            {en.certificate_issued ? (
                              <span className="text-emerald-300">{t("✓ صادرة", "✓ Issued")}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              {en.status === "pending" && (
                                <>
                                  <Button size="sm" variant="secondary" title={t("قبول الطلب", "Approve request")}
                                    onClick={() => setStatus(en.id, "approved")}
                                    className="h-8 px-2.5"
                                  >
                                    <Check className="size-3.5" /> {t("قبول", "Approve")}
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="outline"
                                onClick={() => onOpen(en)}
                                className="h-8 px-2.5"
                              >
                                {t("التفاصيل", "Details")}
                              </Button>
                              {en.status === "pending" && <details className="relative group"><summary aria-label={t("مزيد من الإجراءات", "More actions")} title={t("مزيد من الإجراءات", "More actions")} className="flex size-8 cursor-pointer list-none items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary [&::-webkit-details-marker]:hidden"><MoreHorizontal className="size-4" /></summary><div className="absolute end-0 top-full z-20 mt-1 min-w-28 rounded-md border border-border bg-popover p-1 shadow-lg"><Button size="sm" variant="ghost" className="w-full justify-start text-destructive" onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); void setStatus(en.id, "rejected"); }}>{t("رفض الطلب", "Reject request")}</Button></div></details>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BannedPanel({
  enrollments,
  refresh,
}: {
  enrollments: EnrollmentRow[];
  refresh: () => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  // Unique users that are account_blocked
  const seen = new Set<string>();
  const banned: EnrollmentRow[] = [];
  for (const e of enrollments) {
    if (e.profiles?.account_blocked && !seen.has(e.user_id)) {
      seen.add(e.user_id);
      banned.push(e);
    }
  }

  async function unban(userId: string) {
    if (!confirm(t("إعادة تفعيل حساب هذا المتدرب؟", "Reactivate this trainee's account?"))) return;
    const { error } = await supabase
      .from("profiles")
      .update({ account_blocked: false })
      .eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success(t("تم إلغاء الحظر", "Account unbanned"));
    refresh();
  }

  if (banned.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/50">
        {t("لا يوجد متدربون موقوفون.", "No banned trainees.")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-300/20 bg-rose-300/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-rose-300/10 text-xs text-rose-200/80 uppercase">
            <tr>
              <th className="px-4 py-3 text-right font-medium">{t("المتدرب", "Trainee")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("الدولة", "Country")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("إجراء", "Action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {banned.map((en) => {
              const country = findCountry(en.profiles?.country);
              return (
                <tr key={en.user_id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{en.profiles?.full_name || "—"}</div>
                    <div className="text-xs text-white/50">{en.profiles?.email}</div>
                    <div className="text-xs text-white/40" dir="ltr">
                      {en.profiles?.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {country ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-base">{country.flag}</span>
                        <span className="text-white/80">
                          {lang === "ar" ? country.name_ar : country.name_en}
                        </span>
                      </span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => unban(en.user_id)}
                      className="text-xs px-3 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                    >
                      {t("✓ إلغاء الحظر", "✓ Unban")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
