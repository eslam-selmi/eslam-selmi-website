import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
// notifications surfaced via PortalShell
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
} from "lucide-react";
import { findCountry } from "@/lib/countries";
import { safeHref } from "@/lib/safe-url";
import { AdminSupportPanel } from "@/components/SupportTickets";
import { assertAdmin } from "@/lib/admin-guard.functions";
import { SiteManagementPanel } from "@/components/admin/SiteManagementPanel";

type AdminSearch = {
  tab?:
    | "enrollments"
    | "courses"
    | "coupons"
    | "banned"
    | "additions"
    | "activations"
    | "finance"
    | "methods"
    | "tickets"
    | "site"
    | "leads"
    | "testimonials";
  drawer?: string;
  editCourse?: string;
};

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): AdminSearch => ({
    tab: search.tab as AdminSearch["tab"],
    drawer: search.drawer as string | undefined,
    editCourse: search.editCourse as string | undefined,
  }),
  loader: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      throw redirect({ to: "/auth" });
    }
    // Server-side admin role enforcement (defence-in-depth alongside RLS).
    try {
      await assertAdmin();
    } catch {
      throw redirect({ to: "/portal" });
    }
    return {};
  },
  head: () => ({
    meta: [{ title: "لوحة الإدارة · أكاديمية إسلام سلمي" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

type Course = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  installments_count: number;
  online_url: string | null;
  cover_emoji: string | null;
  total_hours: number | null;
  course_goals?: string | null;
  target_audience?: string | null;
};
type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: "pending" | "approved" | "rejected";
  certificate_url: string | null;
  certificate_issued: boolean;
  notes: string | null;
  created_at: string;
  blocked: boolean;
  name_ar: string | null;
  name_en: string | null;
  certificate_url_ar: string | null;
  certificate_url_en: string | null;
  certificate_requested_at: string | null;
  courses: Course | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    country_code: string | null;
    account_blocked: boolean | null;
  } | null;
};

function AdminPage() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const search = Route.useSearch();
  const [tabState, setTabState] = useState<
    | "enrollments"
    | "courses"
    | "coupons"
    | "banned"
    | "additions"
    | "activations"
    | "finance"
    | "methods"
    | "tickets"
    | "site"
    | "leads"
    | "testimonials"
  >(search.tab || "enrollments");
  const tab = tabState;
  const setTab = setTabState;

  const [pendingActivations, setPendingActivations] = useState<number>(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);

  const [drawerId, setDrawerId] = useState<string | null>(search.drawer || null);
  const drawer = useMemo(
    () => enrollments.find((e) => e.id === drawerId) || null,
    [drawerId, enrollments],
  );
  const setDrawer = (v: EnrollmentRow | null) => setDrawerId(v ? v.id : null);

  const [editingCourseId, setEditingCourseId] = useState<string | null>(search.editCourse || null);
  const editingCourse = useMemo(
    () => courses.find((c) => c.id === editingCourseId) || null,
    [editingCourseId, courses],
  );
  const setEditingCourse = (v: Course | null) => setEditingCourseId(v ? v.id : null);

  useEffect(() => {
    nav({
      to: "/admin",
      search: {
        tab: tabState,
        drawer: drawerId || undefined,
        editCourse: editingCourseId || undefined,
      },
      replace: true,
    });
  }, [tabState, drawerId, editingCourseId, nav]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && role && role !== "admin") nav({ to: "/portal" });
  }, [user, role, loading, nav]);

  async function refresh() {
    const [c, e] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase
        .from("enrollments")
        .select("*, courses(*)")
        .order("created_at", { ascending: false }),
    ]);
    const enrollList = (e.data as any[]) ?? [];
    // Fetch profiles separately to avoid PostgREST embed issues (no direct FK previously)
    const userIds = Array.from(new Set(enrollList.map((x) => x.user_id)));
    let profileMap: Record<string, any> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, country, country_code, account_blocked")
        .in("id", userIds);
      profileMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    }
    setCourses((c.data as Course[]) ?? []);
    setEnrollments(enrollList.map((r) => ({ ...r, profiles: profileMap[r.user_id] ?? null })));
  }
  useEffect(() => {
    if (role === "admin") refresh();
  }, [role]);

  // Pending activations badge count
  useEffect(() => {
    if (role !== "admin") return;
    async function load() {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("activation_status", "pending");
      setPendingActivations(count ?? 0);
    }
    load();
    const ch = supabase
      .channel("admin-activations")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [role]);

  // Realtime refresh on new enrollments / payments
  useEffect(() => {
    if (role !== "admin") return;
    const ch = supabase
      .channel("admin-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [role]);

  // (Notifications are surfaced through the PortalShell bell — no duplicate subscription here.)

  if (loading || !user || role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0b1736] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  const pending = enrollments.filter((e) => e.status === "pending").length;
  const approved = enrollments.filter((e) => e.status === "approved").length;
  const issued = enrollments.filter((e) => e.certificate_issued).length;

  return (
    <PortalShell userId={user.id} role="admin" userLabel={user.email}>
      <div className="space-y-7">
        {pending > 0 && (
          <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-300/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-100">
                {pending} {t("طلب", "request")}
                {pending > 2 ? t("ات", "s") : ""}{" "}
                {t("انضمام بانتظار مراجعتك", "enrollment(s) awaiting your review")}
              </p>
              <p className="text-xs text-amber-200/70">
                {t(
                  "راجع الطلبات الجديدة في تبويب طلبات الانضمام بالأسفل.",
                  "Review new requests in the enrollments tab below.",
                )}
              </p>
            </div>
            <button
              onClick={() => setTab("enrollments")}
              className="text-xs px-3 h-9 rounded-lg bg-amber-300 text-amber-950 font-semibold"
            >
              {t("عرض", "View")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Users}
            label={t("طلبات قيد المراجعة", "Pending requests")}
            value={pending}
            color="amber"
          />
          <StatCard
            icon={CheckCircle2}
            label={t("متدربون مقبولون", "Approved trainees")}
            value={approved}
            color="emerald"
          />
          <StatCard
            icon={Award}
            label={t("شهادات صادرة", "Certificates issued")}
            value={issued}
            color="gold"
          />
          <StatCard
            icon={BookOpen}
            label={t("إجمالي الكورسات", "Total courses")}
            value={courses.length}
            color="lavender"
          />
        </div>

        <div className="dash-card p-1.5 flex gap-1 overflow-x-auto flex-nowrap sm:flex-wrap">
          {[
            {
              id: "activations",
              label: `${t("تفعيل الحسابات", "Activations")}${pendingActivations > 0 ? ` (${pendingActivations})` : ""}`,
            },
            {
              id: "enrollments",
              label: `${t("طلبات وانضمامات", "Requests & enrollments")} (${enrollments.length})`,
            },
            { id: "courses", label: `${t("الكورسات", "Courses")} (${courses.length})` },
            { id: "coupons", label: t("كوبونات الخصم", "Discount coupons") },
            { id: "additions", label: t("أحدث الإضافات", "Latest additions") },
            { id: "testimonials", label: t("شهادات العملاء", "Testimonials") },
            { id: "site", label: t("إدارة الموقع", "Site management") },
            { id: "leads", label: t("اهتمامات الكورسات", "Course leads") },
            { id: "tickets", label: t("تذاكر الدعم", "Support tickets") },
            { id: "finance", label: t("المعاملات المالية", "Financial logs") },
            { id: "methods", label: t("طرق الدفع", "Payment methods") },

            {
              id: "banned",
              label: `${t("الموقوفون", "Banned")} (${enrollments.filter((e) => e.profiles?.account_blocked).length})`,
            },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id as any)}
              className={`whitespace-nowrap px-3.5 h-10 rounded-xl text-xs sm:text-sm font-semibold transition ${
                tab === tb.id
                  ? "bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] shadow-[0_8px_24px_-10px_rgba(212,175,55,0.6)]"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {tab === "activations" ? (
          <ActivationsPanel />
        ) : tab === "enrollments" ? (
          <EnrollmentsTable
            enrollments={enrollments}
            courses={courses}
            onOpen={setDrawer}
            refresh={refresh}
          />
        ) : tab === "courses" ? (
          <CoursesPanel
            courses={courses}
            enrollments={enrollments}
            refresh={refresh}
            onEdit={setEditingCourse}
          />
        ) : tab === "coupons" ? (
          <CouponsPanel courses={courses} />
        ) : tab === "additions" ? (
          <LatestAdditionsPanel />
        ) : tab === "testimonials" ? (
          <TestimonialsPanel />
        ) : tab === "site" ? (
          <SiteManagementPanel />
        ) : tab === "leads" ? (
          <CourseLeadsPanel />
        ) : tab === "tickets" ? (
          user ? (
            <AdminSupportPanel adminUserId={user.id} />
          ) : null
        ) : tab === "finance" ? (
          <FinancePanel courses={courses} enrollments={enrollments} />
        ) : tab === "methods" ? (
          <PaymentMethodsPanel />
        ) : (
          <BannedPanel enrollments={enrollments} refresh={refresh} />
        )}
      </div>

      {drawer && (
        <EnrollmentDrawer enrollment={drawer} onClose={() => setDrawer(null)} refresh={refresh} />
      )}
      {editingCourse && (
        <CourseEditor
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          refresh={refresh}
        />
      )}
    </PortalShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  const tone: Record<string, { text: string; ring: string; glow: string }> = {
    amber: {
      text: "text-amber-300",
      ring: "bg-amber-300/10 border-amber-300/30",
      glow: "from-amber-400/20",
    },
    emerald: {
      text: "text-emerald-300",
      ring: "bg-emerald-300/10 border-emerald-300/30",
      glow: "from-emerald-400/20",
    },
    gold: {
      text: "text-[var(--gold)]",
      ring: "bg-[var(--gold)]/10 border-[var(--gold)]/30",
      glow: "from-[var(--gold)]/25",
    },
    lavender: {
      text: "text-[var(--lavender)]",
      ring: "bg-[var(--lavender)]/10 border-[var(--lavender)]/30",
      glow: "from-[var(--lavender)]/20",
    },
  };
  const c = tone[color] ?? tone.gold;
  return (
    <div className="dash-card dash-card-hover relative overflow-hidden p-5">
      <div
        className={`pointer-events-none absolute -top-12 -end-12 w-32 h-32 rounded-full bg-gradient-to-br ${c.glow} to-transparent blur-2xl`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/55 font-semibold">
            {label}
          </p>
          <p className="text-3xl font-bold mt-2 leading-none">{value}</p>
        </div>
        <div
          className={`w-11 h-11 rounded-2xl border ${c.ring} flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
    </div>
  );
}

function EnrollmentsTable({
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
                            <div className="flex gap-1.5 flex-wrap">
                              {en.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => setStatus(en.id, "approved")}
                                    className="text-xs px-2.5 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                                  >
                                    {t("قبول", "Approve")}
                                  </button>
                                  <button
                                    onClick={() => setStatus(en.id, "rejected")}
                                    className="text-xs px-2.5 h-8 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                                  >
                                    {t("رفض", "Reject")}
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => onOpen(en)}
                                className="text-xs px-2.5 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold"
                              >
                                {t("إدارة", "Manage")}
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
          </div>
        );
      })}
    </div>
  );
}

function BannedPanel({
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
      .update({ account_blocked: false } as any)
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

function StatusPill({ status }: { status: string }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const map: Record<string, { label: string; cls: string }> = {
    pending: {
      label: t("قيد المراجعة", "Pending"),
      cls: "text-amber-300 bg-amber-300/10 border-amber-300/30",
    },
    approved: {
      label: t("مقبول", "Approved"),
      cls: "text-emerald-300 bg-emerald-300/10 border-emerald-300/30",
    },
    rejected: {
      label: t("مرفوض", "Rejected"),
      cls: "text-rose-300 bg-rose-300/10 border-rose-300/30",
    },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ============= COURSES PANEL =============
function CoursesPanel({
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
    } as any);
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
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onEdit(c)}
                      className="flex items-center gap-1.5 text-xs px-3 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold"
                    >
                      <Settings2 className="w-3.5 h-3.5" /> {t("إدارة المحتوى", "Manage content")}
                    </button>
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => toggleActive(c)}
                        className="p-2 rounded-lg hover:bg-white/5"
                        title={c.active ? t("إيقاف", "Disable") : t("تفعيل", "Enable")}
                      >
                        {c.active ? (
                          <ToggleRight className="w-5 h-5 text-emerald-300" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-white/40" />
                        )}
                      </button>
                      <button
                        onClick={() => del(c.id, Boolean((c as any).is_archived))}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-300"
                        title={
                          (c as any).is_archived ? t("استعادة", "Restore") : t("أرشفة", "Archive")
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCourseForever(c.id, c.title)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-300"
                        title={t("حذف نهائي", "Delete forever")}
                      >
                        <X className="w-4 h-4" />
                      </button>
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
function CourseEditor({
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

  const [section, setSection] = useState<"content" | "assignments" | "sessions" | "settings">(
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

function CourseContent({ courseId }: { courseId: string }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [modules, setModules] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [newTitle, setNewTitle] = useState("");

  async function loadModules() {
    const { data } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");
    const mods = data ?? [];
    setModules(mods);
    if (mods.length) {
      const ids = mods.map((m: any) => m.id);
      const { data: its } = await supabase
        .from("module_items")
        .select("*")
        .in("module_id", ids)
        .order("order_index");
      const grouped: Record<string, any[]> = {};
      (its ?? []).forEach((it: any) => {
        (grouped[it.module_id] ||= []).push(it);
      });
      setItems(grouped);
    } else {
      setItems({});
    }
  }
  useEffect(() => {
    loadModules();
  }, [courseId]);

  async function addModule() {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from("course_modules").insert({
      course_id: courseId,
      title: newTitle,
      order_index: modules.length,
    });
    if (error) return toast.error(error.message);
    setNewTitle("");
    loadModules();
  }

  async function toggleComplete(m: any) {
    const { error } = await supabase
      .from("course_modules")
      .update({ completed_by_admin: !m.completed_by_admin })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(
      !m.completed_by_admin
        ? t("تم وضع علامة الإكمال", "Marked as complete")
        : t("تم إلغاء الإكمال", "Marked as incomplete"),
    );
    loadModules();
  }

  async function delModule(id: string) {
    if (!confirm(t("حذف الباب وكل محتوياته؟", "Delete module and all its contents?"))) return;
    await supabase.from("course_modules").delete().eq("id", id);
    loadModules();
  }

  async function updateOnlineUrl(id: string, value: string) {
    await supabase
      .from("course_modules")
      .update({ online_url: value || null })
      .eq("id", id);
    loadModules();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t("عنوان باب جديد...", "New module title...")}
          className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60"
        />
        <button
          onClick={addModule}
          className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> {t("إضافة باب", "Add module")}
        </button>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-8">
          {t("لا توجد أبواب بعد.", "No modules yet.")}
        </p>
      ) : (
        <div className="space-y-3">
          {modules.map((m, i) => (
            <ModuleCard
              key={m.id}
              m={m}
              index={i}
              items={items[m.id] ?? []}
              onToggle={() => toggleComplete(m)}
              onDelete={() => delModule(m.id)}
              onChangeOnlineUrl={(url: string) => updateOnlineUrl(m.id, url)}
              onItemsChanged={loadModules}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleCard({
  m,
  index,
  items,
  onToggle,
  onDelete,
  onChangeOnlineUrl,
  onItemsChanged,
}: any) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [open, setOpen] = useState(true);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlVal, setUrlVal] = useState(m.online_url ?? "");
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemKind, setItemKind] = useState<"note" | "link" | "file">("note");
  const [itemTitle, setItemTitle] = useState("");
  const [itemContent, setItemContent] = useState("");
  const [itemUrl, setItemUrl] = useState("");

  async function addItem() {
    if (!itemTitle.trim()) return;
    let url = itemUrl;
    if (itemKind === "file" && (window as any).__pendingFile) {
      const file: File = (window as any).__pendingFile;
      const path = `${m.course_id}/${m.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("course-files").upload(path, file);
      if (upErr) return toast.error(upErr.message);
      url = path; // store storage path; signed URL generated on access
      (window as any).__pendingFile = null;
    }
    const { error } = await supabase.from("module_items").insert({
      module_id: m.id,
      kind: itemKind,
      title: itemTitle,
      content: itemKind === "note" ? itemContent : null,
      url: itemKind !== "note" ? url : null,
      order_index: items.length,
    });
    if (error) return toast.error(error.message);
    setItemTitle("");
    setItemContent("");
    setItemUrl("");
    setShowAddItem(false);
    onItemsChanged();
  }

  async function delItem(id: string) {
    await supabase.from("module_items").delete().eq("id", id);
    onItemsChanged();
  }

  return (
    <div
      className={`rounded-2xl border ${m.completed_by_admin ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}
    >
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-lg bg-white/5 text-[var(--gold)] font-bold text-sm flex items-center justify-center shrink-0"
        >
          {index + 1}
        </button>
        <div className="flex-1 min-w-0">
          <h5 className="font-bold">{m.title}</h5>
          {m.online_url && (
            <p className="text-[11px] text-[var(--gold)]/80 mt-0.5 truncate" dir="ltr">
              {m.online_url}
            </p>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1 text-xs px-2.5 h-8 rounded-lg ${m.completed_by_admin ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 border border-white/15 text-white/70"}`}
        >
          <Check className="w-3.5 h-3.5" />{" "}
          {m.completed_by_admin ? t("مكتمل", "Complete") : t("وضع علامة الإكمال", "Mark complete")}
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-300">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5">
          <div className="pt-3 flex gap-2 items-center">
            <span className="text-xs text-white/50 shrink-0">
              {t("رابط المحاضرة:", "Session link:")}
            </span>
            {editingUrl ? (
              <>
                <input
                  value={urlVal}
                  onChange={(e) => setUrlVal(e.target.value)}
                  dir="ltr"
                  className="flex-1 h-9 px-2.5 rounded-lg bg-white/5 border border-white/15 text-xs"
                  placeholder="https://meet..."
                />
                <button
                  onClick={() => {
                    onChangeOnlineUrl(urlVal);
                    setEditingUrl(false);
                  }}
                  className="text-xs px-3 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold"
                >
                  {t("حفظ", "Save")}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingUrl(true)}
                className="text-xs text-white/60 hover:text-white flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />{" "}
                {m.online_url ? t("تعديل", "Edit") : t("إضافة رابط", "Add link")}
              </button>
            )}
          </div>

          {items.length > 0 && (
            <ul className="space-y-1.5">
              {items.map((it: any) => (
                <li
                  key={it.id}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm"
                >
                  {it.kind === "note" ? (
                    <StickyNote className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
                  ) : it.kind === "link" ? (
                    <LinkIcon className="w-4 h-4 mt-0.5 text-sky-300 shrink-0" />
                  ) : (
                    <Paperclip className="w-4 h-4 mt-0.5 text-emerald-300 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{it.title}</p>
                    {it.content && (
                      <p className="text-xs text-white/55 whitespace-pre-wrap mt-0.5">
                        {it.content}
                      </p>
                    )}
                    {it.url &&
                      (it.kind === "file" ? (
                        <button
                          onClick={async () => {
                            const { data, error } = await supabase.storage
                              .from("course-files")
                              .createSignedUrl(it.url, 120);
                            if (error) return toast.error(error.message);
                            window.open(data.signedUrl, "_blank", "noopener");
                          }}
                          className="text-xs text-[var(--gold)] truncate block mt-0.5 hover:underline"
                          dir="ltr"
                        >
                          {it.url}
                        </button>
                      ) : (
                        safeHref(it.url) && (
                          <a
                            href={safeHref(it.url)!}
                            target="_blank"
                            rel="noopener"
                            className="text-xs text-[var(--gold)] truncate block mt-0.5"
                            dir="ltr"
                          >
                            {it.url}
                          </a>
                        )
                      ))}
                  </div>
                  <button
                    onClick={() => delItem(it.id)}
                    className="text-rose-300/60 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showAddItem ? (
            <div className="rounded-xl border border-[var(--gold)]/30 bg-white/[0.03] p-3 space-y-2">
              <div className="flex gap-1">
                {(["note", "link", "file"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setItemKind(k)}
                    className={`text-xs px-2.5 h-8 rounded-lg ${itemKind === k ? "bg-[var(--gold)] text-[#0b1736] font-semibold" : "bg-white/5 text-white/60"}`}
                  >
                    {k === "note"
                      ? t("ملاحظة", "Note")
                      : k === "link"
                        ? t("رابط", "Link")
                        : t("ملف", "File")}
                  </button>
                ))}
              </div>
              <input
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                required
                placeholder={t(
                  "العنوان المخصص * (يظهر للمتدرب بدلاً من الرابط)",
                  "Custom title * (shown to trainee instead of URL)",
                )}
                className="w-full h-9 px-2.5 rounded-lg bg-white/5 border border-white/15 text-xs"
              />

              {itemKind === "note" && (
                <textarea
                  value={itemContent}
                  onChange={(e) => setItemContent(e.target.value)}
                  placeholder={t("المحتوى", "Content")}
                  rows={3}
                  className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/15 text-xs"
                />
              )}
              {itemKind === "link" && (
                <input
                  value={itemUrl}
                  onChange={(e) => setItemUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="w-full h-9 px-2.5 rounded-lg bg-white/5 border border-white/15 text-xs"
                />
              )}
              {itemKind === "file" && (
                <input
                  type="file"
                  onChange={(e) => {
                    (window as any).__pendingFile = e.target.files?.[0];
                  }}
                  className="block w-full text-xs file:me-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-[var(--gold)] file:text-[#0b1736] file:font-semibold file:cursor-pointer cursor-pointer"
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={addItem}
                  className="text-xs px-3 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold"
                >
                  {t("حفظ", "Save")}
                </button>
                <button
                  onClick={() => setShowAddItem(false)}
                  className="text-xs px-3 h-8 rounded-lg bg-white/5 text-white/60"
                >
                  {t("إلغاء", "Cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddItem(true)}
              className="text-xs text-[var(--gold)] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />{" "}
              {t("إضافة بند (ملاحظة / رابط / ملف)", "Add item (note / link / file)")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CourseSessions({ courseId }: { courseId: string }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [sessions, setSessions] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", starts_at: "", duration_minutes: "60" });

  async function load() {
    const { data } = await supabase
      .from("course_sessions")
      .select("*")
      .eq("course_id", courseId)
      .order("starts_at");
    setSessions(data ?? []);
  }
  useEffect(() => {
    load();
  }, [courseId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.starts_at)
      return toast.error(t("العنوان والتاريخ مطلوبين", "Title and date are required"));
    const { error } = await supabase.from("course_sessions").insert({
      course_id: courseId,
      title: form.title,
      starts_at: new Date(form.starts_at).toISOString(),
      duration_minutes: Number(form.duration_minutes),
    });
    if (error) return toast.error(error.message);
    toast.success(t("تمت إضافة المحاضرة وإشعار المتدربين", "Session added and trainees notified"));
    setForm({ title: "", starts_at: "", duration_minutes: "60" });
    load();
  }

  async function del(id: string) {
    await supabase.from("course_sessions").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="dash-card dash-card-hover p-4 space-y-3">
        <Input
          label={t("عنوان المحاضرة", "Session title")}
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("التاريخ والوقت", "Date & time")}
            type="datetime-local"
            value={form.starts_at}
            onChange={(v) => setForm({ ...form, starts_at: v })}
            required
          />
          <Input
            label={t("المدة (دقيقة)", "Duration (min)")}
            type="number"
            value={form.duration_minutes}
            onChange={(v) => setForm({ ...form, duration_minutes: v })}
          />
        </div>
        <button
          type="submit"
          className="w-full h-10 rounded-xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}
        >
          {t("إضافة المحاضرة", "Add session")}
        </button>
      </form>

      {sessions.length === 0 ? (
        <p className="text-xs text-white/40 text-center py-6">
          {t("لا توجد محاضرات.", "No sessions.")}
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3"
            >
              <Clock className="w-4 h-4 text-[var(--gold)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-white/55">
                  {new Date(s.starts_at).toLocaleString("ar-EG")} · {s.duration_minutes}
                  {t("د", "m")}
                </p>
              </div>
              <button
                onClick={() => del(s.id)}
                className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CourseSettings({ course, onSaved }: { course: Course; onSaved: () => void }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [f, setF] = useState({
    title: course.title,
    description: course.description ?? "",
    price: String(course.price ?? 0),
    currency: course.currency,
    starts_at: course.starts_at ?? "",
    ends_at: course.ends_at ?? "",
    installments_count: String(course.installments_count),
    online_url: course.online_url ?? "",
    cover_emoji: course.cover_emoji ?? "🎓",
    total_hours: String(course.total_hours ?? 0),
    slug: (course as any).slug ?? "",
    logo_url: (course as any).logo_url ?? "",
    brand_name: (course as any).brand_name ?? "",
    brand_primary_color: (course as any).brand_primary_color ?? "",
    brand_tagline_ar: (course as any).brand_tagline_ar ?? "",
    brand_tagline_en: (course as any).brand_tagline_en ?? "",
    course_goals: (course as any).course_goals ?? "",
    target_audience: (course as any).target_audience ?? "",
    is_upcoming: Boolean((course as any).is_upcoming),
  });

  async function save() {
    const slugClean = f.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const { error } = await supabase
      .from("courses")
      .update({
        title: f.title,
        description: f.description || null,
        price: Number(f.price) || 0,
        currency: f.currency,
        starts_at: f.starts_at || null,
        ends_at: f.ends_at || null,
        installments_count: Number(f.installments_count) || 1,
        online_url: f.online_url || null,
        cover_emoji: f.cover_emoji || "🎓",
        total_hours: Number(f.total_hours) || 0,
        slug: slugClean || null,
        logo_url: f.logo_url.trim() || null,
        brand_name: f.brand_name.trim() || null,
        brand_primary_color: f.brand_primary_color.trim() || null,
        brand_tagline_ar: f.brand_tagline_ar.trim() || null,
        brand_tagline_en: f.brand_tagline_en.trim() || null,
        course_goals: f.course_goals.trim() || null,
        target_audience: f.target_audience.trim() || null,
        is_upcoming: f.is_upcoming,
      } as any)
      .eq("id", course.id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحفظ", "Saved"));
    onSaved();
  }

  const whiteLabelUrl = f.slug
    ? `${window.location.origin}/c/${f.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")}`
    : "";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[80px_1fr] gap-3">
        <Input
          label={t("إيموجي", "Emoji")}
          value={f.cover_emoji}
          onChange={(v) => setF({ ...f, cover_emoji: v })}
        />
        <Input
          label={t("اسم الكورس", "Course name")}
          value={f.title}
          onChange={(v) => setF({ ...f, title: v })}
        />
      </div>
      <TextArea
        label={t("الوصف", "Description")}
        value={f.description}
        onChange={(v) => setF({ ...f, description: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("السعر", "Price")}
          type="number"
          value={f.price}
          onChange={(v) => setF({ ...f, price: v })}
        />
        <Select
          label={t("العملة", "Currency")}
          value={f.currency}
          onChange={(v) => setF({ ...f, currency: v })}
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
        value={f.installments_count}
        onChange={(v) => setF({ ...f, installments_count: v })}
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
          value={f.starts_at}
          onChange={(v) => setF({ ...f, starts_at: v })}
        />
        <Input
          label={t("تاريخ الانتهاء", "End date")}
          type="date"
          value={f.ends_at}
          onChange={(v) => setF({ ...f, ends_at: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("رابط الكورس", "Course link")}
          value={f.online_url}
          onChange={(v) => setF({ ...f, online_url: v })}
        />
        <Input
          label={t("عدد ساعات الكورس", "Total hours")}
          type="number"
          value={f.total_hours}
          onChange={(v) => setF({ ...f, total_hours: v })}
        />
      </div>

      <TextArea
        label={t("مخرجات الكورس", "Course outcomes")}
        value={f.course_goals}
        onChange={(v) => setF({ ...f, course_goals: v })}
      />
      <TextArea
        label={t("هذا الكورس مناسب لـ", "This course is best for")}
        value={f.target_audience}
        onChange={(v) => setF({ ...f, target_audience: v })}
      />

      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={f.is_upcoming}
          onChange={(e) => setF({ ...f, is_upcoming: e.target.checked })}
          className="size-4 accent-[var(--gold)]"
        />
        <div className="min-w-0">
          <div className="font-semibold text-sm">
            {t("كورس قادم (لم يُفتح التسجيل بعد)", "Upcoming course (enrollment not yet open)")}
          </div>
          <div className="text-[11px] text-white/55">
            {t(
              "سيظهر في قسم 'كورسات قادمة' بنموذج تسجيل اهتمام بدل زر الاشتراك.",
              "Shows in the 'Upcoming' section with an interest form instead of an enroll button.",
            )}
          </div>
        </div>
      </label>

      <button
        onClick={save}
        className="w-full h-11 rounded-xl font-semibold"
        style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}
      >
        {t("حفظ التعديلات", "Save changes")}
      </button>
    </div>
  );
}

// ============= ENROLLMENT DRAWER =============
function EnrollmentDrawer({
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
      const [pdfAr, pdfEn] = await Promise.all([
        generateCertificatePdf({ ...common, lang: "ar", studentName: nameAr }),
        generateCertificatePdf({ ...common, lang: "en", studentName: nameEn }),
      ]);
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
      .then(({ data }) => setAccountBlocked(Boolean((data as any)?.account_blocked)));
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
      .update({ account_blocked: next } as any)
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

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-white/60 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/60"
      />
    </label>
  );
}
function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-white/60 mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/60"
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-xs text-white/60 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[var(--gold)]/60"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v} className="bg-[#0b1736]">
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

function CourseAssignmentsAdmin({ courseId }: { courseId: string }) {
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

function SubmissionRow({
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
type CouponRow = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  course_id: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  note: string | null;
  created_at: string;
};

function CouponsPanel({ courses }: { courses: Course[] }) {
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

function NewCouponModal({
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

function ProofLink({ path, label }: { path: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 300)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);
  if (!url) return <span className="text-[11px] text-white/40">…</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-[11px] px-2 h-7 inline-flex items-center gap-1 rounded bg-sky-500/20 text-sky-200 border border-sky-500/40"
    >
      <Paperclip className="w-3 h-3" /> {label}
    </a>
  );
}

type LatestAdditionAdminRow = {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  custom_label: string | null;
  kind: "link" | "file" | "video" | "pdf" | "embed";
  url: string;
  created_at: string;
};

type LatestAdditionsSettingsRow = {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string | null;
  subtitle_en: string | null;
};

function LatestAdditionsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [items, setItems] = useState<LatestAdditionAdminRow[]>([]);
  const [settings, setSettings] = useState<LatestAdditionsSettingsRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title_ar: "",
    title_en: "",
    subtitle_ar: "",
    subtitle_en: "",
    custom_label: "",
    kind: "link" as "link" | "embed",
    url: "",
  });

  async function load() {
    const [{ data: s }, { data: list }] = await Promise.all([
      supabase.from("latest_additions_settings").select("*").limit(1).maybeSingle(),
      supabase.from("latest_additions").select("*").order("created_at", { ascending: false }),
    ]);
    setSettings((s as LatestAdditionsSettingsRow) ?? null);
    setItems((list as LatestAdditionAdminRow[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSettings() {
    if (!settings) return;
    const { error } = await supabase
      .from("latest_additions_settings")
      .update({
        title_ar: settings.title_ar,
        title_en: settings.title_en,
        subtitle_ar: settings.subtitle_ar,
        subtitle_en: settings.subtitle_en,
      })
      .eq("id", settings.id);
    if (error) return toast.error(error.message);
    toast.success(t("تم حفظ الإعدادات", "Settings saved"));
    load();
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_ar.trim() || !form.title_en.trim() || !form.url.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("latest_additions").insert({
      title_ar: form.title_ar.trim(),
      title_en: form.title_en.trim(),
      subtitle_ar: form.subtitle_ar.trim() || null,
      subtitle_en: form.subtitle_en.trim() || null,
      custom_label: form.custom_label.trim() || null,
      kind: form.kind,
      url: form.url.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("تمت إضافة العنصر", "Item added"));
    setForm({
      title_ar: "",
      title_en: "",
      subtitle_ar: "",
      subtitle_en: "",
      custom_label: "",
      kind: "link",
      url: "",
    });
    load();
  }

  async function del(id: string) {
    if (!confirm(t("حذف هذا العنصر؟", "Delete this item?"))) return;
    const { error } = await supabase.from("latest_additions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div className="space-y-6">
      {settings && (
        <div className="dash-card dash-card-hover p-5 space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--gold)]" />{" "}
            {t("إعدادات قسم أحدث الإضافات", "Latest additions settings")}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label={t("العنوان عربي", "Title AR")}
              value={settings.title_ar ?? ""}
              onChange={(v) => setSettings({ ...settings, title_ar: v })}
            />
            <Input
              label={t("العنوان إنجليزي", "Title EN")}
              value={settings.title_en ?? ""}
              onChange={(v) => setSettings({ ...settings, title_en: v })}
            />
            <Input
              label={t("وصف عربي", "Subtitle AR")}
              value={settings.subtitle_ar ?? ""}
              onChange={(v) => setSettings({ ...settings, subtitle_ar: v })}
            />
            <Input
              label={t("وصف إنجليزي", "Subtitle EN")}
              value={settings.subtitle_en ?? ""}
              onChange={(v) => setSettings({ ...settings, subtitle_en: v })}
            />
          </div>
          <button
            onClick={saveSettings}
            className="text-xs px-4 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold"
          >
            {t("حفظ الإعدادات", "Save settings")}
          </button>
        </div>
      )}

      <form onSubmit={addItem} className="dash-card dash-card-hover p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <Plus className="w-4 h-4 text-[var(--gold)]" /> {t("إضافة عنصر جديد", "Add new item")}
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label={t("العنوان عربي", "Title AR")}
            value={form.title_ar}
            onChange={(v) => setForm({ ...form, title_ar: v })}
            required
          />
          <Input
            label={t("العنوان إنجليزي", "Title EN")}
            value={form.title_en}
            onChange={(v) => setForm({ ...form, title_en: v })}
            required
          />
          <Input
            label={t("وصف عربي", "Subtitle AR")}
            value={form.subtitle_ar}
            onChange={(v) => setForm({ ...form, subtitle_ar: v })}
          />
          <Input
            label={t("وصف إنجليزي", "Subtitle EN")}
            value={form.subtitle_en}
            onChange={(v) => setForm({ ...form, subtitle_en: v })}
          />
          <Input
            label={t("شارة", "Badge")}
            value={form.custom_label}
            onChange={(v) => setForm({ ...form, custom_label: v })}
          />
          <Select
            label={t("النوع", "Kind")}
            value={form.kind}
            onChange={(v) => setForm({ ...form, kind: v as "link" | "embed" })}
            options={[
              { v: "link", l: t("رابط", "Link") },
              { v: "embed", l: t("فيديو مضمن", "Embed") },
            ]}
          />
        </div>
        <Input
          label={t("الرابط", "URL")}
          value={form.url}
          onChange={(v) => setForm({ ...form, url: v })}
          required
        />
        <button
          disabled={busy}
          type="submit"
          className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm disabled:opacity-50"
        >
          {busy ? t("جارٍ الإضافة...", "Adding...") : t("إضافة", "Add")}
        </button>
      </form>

      <div className="dash-card dash-card-hover p-5">
        <h3 className="font-bold mb-3">
          {t("العناصر الحالية", "Current items")} ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-white/40">{t("لا توجد عناصر بعد.", "No items yet.")}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <FileText className="w-4 h-4 text-[var(--gold)] mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {it.title_ar} <span className="text-white/40">·</span>{" "}
                    <span className="text-white/60">{it.title_en}</span>
                  </p>
                  <p className="text-[11px] text-white/45 mt-0.5">
                    [{it.kind}] {it.custom_label ? `· ${it.custom_label}` : ""} ·{" "}
                    {new Date(it.created_at).toLocaleString("ar-EG")}
                  </p>
                </div>
                <button
                  onClick={() => del(it.id)}
                  className="p-2 rounded-lg md:hover:bg-rose-500/10 text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Activations Panel — Pending account activation queue + settings
// ============================================================
type PendingProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  country_code: string | null;
  activation_status: "pending" | "active" | "rejected";
  created_at: string;
};

type ActivationSettings = {
  admin_whatsapp_e164: string | null;
  activation_request_template_ar: string;
  activation_request_template_en: string;
  welcome_message_template_ar: string;
  welcome_message_template_en: string;
};

function ActivationsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [list, setList] = useState<PendingProfile[]>([]);
  const [filter, setFilter] = useState<"pending" | "rejected" | "active">("pending");
  const [settings, setSettings] = useState<ActivationSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, country, country_code, activation_status, created_at")
      .eq("activation_status", filter)
      .order("created_at", { ascending: false });
    setList((data as any) ?? []);
  }
  async function loadSettings() {
    const { data } = await supabase.from("platform_settings").select("*").maybeSingle();
    if (data) setSettings(data as any);
  }
  useEffect(() => {
    load();
  }, [filter]);
  useEffect(() => {
    loadSettings();
  }, []);

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from("platform_settings")
      .update({
        admin_whatsapp_e164: settings.admin_whatsapp_e164,
        activation_request_template_ar: settings.activation_request_template_ar,
        activation_request_template_en: settings.activation_request_template_en,
        welcome_message_template_ar: settings.welcome_message_template_ar,
        welcome_message_template_en: settings.welcome_message_template_en,
      } as any)
      .eq("singleton", true);
    setSavingSettings(false);
    if (error) toast.error(error.message);
    else toast.success(t("تم حفظ الإعدادات", "Settings saved"));
  }

  async function approve(p: PendingProfile) {
    setBusyId(p.id);
    const { error } = await supabase
      .from("profiles")
      .update({ activation_status: "active", activated_at: new Date().toISOString() } as any)
      .eq("id", p.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("تم التفعيل", "Activated"));

    // Open WhatsApp with welcome message
    const phoneDigits = (p.phone || "").replace(/\D/g, "");
    if (phoneDigits && settings) {
      const loginUrl = `${window.location.origin}/auth`;
      const name = p.full_name || (lang === "ar" ? "متدرب" : "Trainee");
      const tmpl =
        lang === "ar" ? settings.welcome_message_template_ar : settings.welcome_message_template_en;
      const msg = (tmpl || "")
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{login_url\}\}/g, loginUrl)
        .replace(/\{\{email\}\}/g, p.email || "");
      const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (!phoneDigits) {
      toast.message(
        t("لم يتم العثور على رقم هاتف للمتدرب", "No phone number on file for this trainee"),
      );
    }
    load();
  }

  async function reject(p: PendingProfile) {
    if (!confirm(t("تأكيد رفض التفعيل؟", "Reject activation?"))) return;
    setBusyId(p.id);
    const { error } = await supabase
      .from("profiles")
      .update({ activation_status: "rejected" } as any)
      .eq("id", p.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("تم رفض الطلب", "Request rejected"));
    load();
  }

  async function reinstate(p: PendingProfile) {
    setBusyId(p.id);
    const { error } = await supabase
      .from("profiles")
      .update({ activation_status: "pending" } as any)
      .eq("id", p.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      {/* Settings card */}
      <div className="dash-card dash-card-hover p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-[var(--gold)]" />
          <h3 className="font-bold text-sm">
            {t("إعدادات تفعيل الحساب عبر واتساب", "WhatsApp activation settings")}
          </h3>
        </div>
        {settings ? (
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block md:col-span-2">
              <span className="block text-xs text-white/60 mb-1">
                {t(
                  "رقم واتساب الإدارة (بصيغة دولية بدون +)",
                  "Admin WhatsApp (international, no +)",
                )}
              </span>
              <input
                value={settings.admin_whatsapp_e164 ?? ""}
                onChange={(e) => setSettings({ ...settings, admin_whatsapp_e164: e.target.value })}
                placeholder="201001234567"
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-white/60 mb-1">
                {t("نص طلب التفعيل (عربي)", "Activation request (Arabic)")}
              </span>
              <textarea
                rows={3}
                value={settings.activation_request_template_ar}
                onChange={(e) =>
                  setSettings({ ...settings, activation_request_template_ar: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-white/60 mb-1">
                {t("نص طلب التفعيل (إنجليزي)", "Activation request (English)")}
              </span>
              <textarea
                rows={3}
                dir="ltr"
                value={settings.activation_request_template_en}
                onChange={(e) =>
                  setSettings({ ...settings, activation_request_template_en: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-white/60 mb-1">
                {t("نص الترحيب عند التفعيل (عربي)", "Welcome message (Arabic)")}
              </span>
              <textarea
                rows={3}
                value={settings.welcome_message_template_ar}
                onChange={(e) =>
                  setSettings({ ...settings, welcome_message_template_ar: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-white/60 mb-1">
                {t("نص الترحيب عند التفعيل (إنجليزي)", "Welcome message (English)")}
              </span>
              <textarea
                rows={3}
                dir="ltr"
                value={settings.welcome_message_template_en}
                onChange={(e) =>
                  setSettings({ ...settings, welcome_message_template_en: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <p className="text-[10px] text-white/40 md:col-span-2">
              {t("المتغيرات المتاحة:", "Available variables:")}{" "}
              <code className="text-[var(--gold)]">{`{{name}}`}</code>,{" "}
              <code className="text-[var(--gold)]">{`{{email}}`}</code>,{" "}
              <code className="text-[var(--gold)]">{`{{login_url}}`}</code>
            </p>
            <div className="md:col-span-2">
              <button
                disabled={savingSettings}
                onClick={saveSettings}
                className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm disabled:opacity-50"
              >
                {savingSettings
                  ? t("جارٍ الحفظ...", "Saving...")
                  : t("حفظ الإعدادات", "Save settings")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("جارٍ التحميل...", "Loading...")}
          </div>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {(["pending", "rejected", "active"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 h-9 rounded-full text-xs font-semibold transition ${
              filter === f
                ? "bg-[var(--gold)] text-[#0b1736]"
                : "bg-white/5 text-white/60 hover:text-white border border-white/10"
            }`}
          >
            {f === "pending"
              ? t("بانتظار التفعيل", "Pending")
              : f === "rejected"
                ? t("مرفوضة", "Rejected")
                : t("مُفعّلة", "Active")}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="dash-card dash-card-hover overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-white/50 text-sm">
            {t("لا توجد حسابات في هذه الحالة.", "No accounts in this state.")}
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {list.map((p) => {
              const phoneDigits = (p.phone || "").replace(/\D/g, "");
              const country = findCountry(p.country || "");
              return (
                <li
                  key={p.id}
                  className="p-4 flex flex-wrap items-center gap-3 hover:bg-white/[0.02]"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] font-bold">
                    {(p.full_name || p.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {p.full_name || t("بدون اسم", "No name")}
                    </p>
                    <p className="text-xs text-white/55 truncate" dir="ltr">
                      {p.email}
                    </p>
                    <p className="text-[11px] text-white/45 mt-0.5" dir="ltr">
                      {country?.flag} {p.phone || "—"} ·{" "}
                      {new Date(p.created_at).toLocaleString("ar-EG")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {phoneDigits && (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://wa.me/${phoneDigits}`}
                        className="px-3 h-9 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                    {filter === "pending" && (
                      <>
                        <button
                          disabled={busyId === p.id}
                          onClick={() => approve(p)}
                          className="px-3 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                          {t("تفعيل وإرسال ترحيب", "Approve & welcome")}
                        </button>
                        <button
                          disabled={busyId === p.id}
                          onClick={() => reject(p)}
                          className="px-3 h-9 rounded-lg border border-rose-400/40 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> {t("رفض", "Reject")}
                        </button>
                      </>
                    )}
                    {filter === "rejected" && (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => reinstate(p)}
                        className="px-3 h-9 rounded-lg border border-white/15 text-white/80 hover:bg-white/5 text-xs font-semibold disabled:opacity-50"
                      >
                        {t("إعادة لقائمة الانتظار", "Move back to pending")}
                      </button>
                    )}
                    {filter === "active" && (
                      <span className="px-3 h-9 inline-flex items-center rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 me-1.5" /> {t("مفعّل", "Active")}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============= PAYMENT METHODS PANEL =============
function PaymentMethodsPanel() {
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
function FinancePanel({
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

function ExportDebtsModal({
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

function BulkReceiptsTool() {
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
type CourseLead = {
  id: string;
  course_id: string | null;
  course_title: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  language: string;
  status: string;
  created_at: string;
};

function CourseLeadsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [leads, setLeads] = useState<CourseLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "converted" | "archived">(
    "all",
  );

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

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("course_interests" as any)
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("تم التحديث", "Updated"));
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

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  return (
    <div className="dash-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold">
            {t("اهتمامات الكورسات القادمة", "Upcoming-course interest leads")}
          </h3>
          <p className="text-xs text-white/55 mt-1">
            {t(
              "الأشخاص الذين سجّلوا اهتمامهم بكورس قادم دون إنشاء حساب متدرّب.",
              "People who registered interest in an upcoming course without creating a trainee account.",
            )}
          </p>
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
      </div>

      {loading ? (
        <div className="text-center py-10 text-white/50 text-sm">
          {t("جارٍ التحميل…", "Loading…")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-white/15 text-white/50 text-sm">
          {t("لا توجد اهتمامات بعد.", "No leads yet.")}
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
                      <a href={`tel:${l.phone}`} className="hover:text-[var(--gold)] truncate">
                        📞 {l.phone}
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
                      {l.notes}
                    </div>
                  )}
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
                <button
                  onClick={() => remove(l.id)}
                  className="text-[11px] px-3 h-7 rounded-lg bg-rose-500/15 text-rose-200 border border-rose-500/30 hover:bg-rose-500/25 font-semibold inline-flex items-center gap-1"
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
