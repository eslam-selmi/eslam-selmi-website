import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
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
import { ActivationsPanel } from "@/components/admin/panels/ActivationsPanel";
import { LatestAdditionsPanel, SnapshotsPanel, TestimonialsPanel } from "@/components/admin/panels/ContentPanels";
import { CouponsPanel } from "@/components/admin/panels/Coupons";
import { CourseLeadsPanel } from "@/components/admin/panels/CourseLeadsPanel";
import { CourseEditor, CoursesPanel } from "@/components/admin/panels/Courses";
import { EnrollmentDrawer } from "@/components/admin/panels/EnrollmentDrawer";
import { BannedPanel, EnrollmentsTable } from "@/components/admin/panels/Enrollments";
import { FinancePanel, PaymentMethodsPanel } from "@/components/admin/panels/Finance";
import { Course, EnrollmentRow } from "@/components/admin/panels/types";

type AdminSearch = {
  tab?:
    | "overview"
    | "enrollments"
    | "courses"
    | "coupons"
    | "banned"
    | "additions"
    | "activations"
    | "finance"
    | "methods"
    | "feedback"
    | "tickets"
    | "site"
    | "leads"
    | "testimonials"
    | "success_cases"
    | "bookings"
    | "packages"
    | "interviews"
    | "snapshots"
    | "trainings"
    | "partners"
    | "contracts";

  drawer?: string;
  editCourse?: string;
};

export const Route = createFileRoute("/admin")({
  ssr: false,
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
    meta: [{ title: "لوحة الإدارة · إسلام سلمي" }, { name: "description", content: "إدارة التدريب والحجوزات والطلبات والمحتوى من مكان واحد." }, { property: "og:title", content: "لوحة الإدارة · إسلام سلمي" }, { property: "og:description", content: "إدارة التدريب والحجوزات والطلبات والمحتوى من مكان واحد." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const navigation = useRef(nav);
  navigation.current = nav;
  const search = Route.useSearch();
  const [tabState, setTabState] = useState<
    | "overview"
    | "enrollments"
    | "courses"
    | "coupons"
    | "banned"
    | "additions"
    | "activations"
    | "finance"
    | "methods"
    | "feedback"
    | "tickets"
    | "site"
    | "leads"
    | "testimonials"
    | "success_cases"
    | "bookings"
    | "packages"
    | "interviews"
    | "trainings"
    | "snapshots"
    | "partners"
    | "contracts"
  >(search.tab || "overview");

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
  const [traineeId, setTraineeId] = useState<string | null>(null);

  const [editingCourseId, setEditingCourseId] = useState<string | null>(search.editCourse || null);
  const editingCourse = useMemo(
    () => courses.find((c) => c.id === editingCourseId) || null,
    [editingCourseId, courses],
  );
  const setEditingCourse = (v: Course | null) => setEditingCourseId(v ? v.id : null);

  useEffect(() => {
    navigation.current({
      to: "/admin",
      search: {
        tab: tabState,
        drawer: drawerId || undefined,
        editCourse: editingCourseId || undefined,
      },
      replace: true,
    });
  }, [tabState, drawerId, editingCourseId]);

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
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const pending = enrollments.filter((e) => e.status === "pending").length;
  const approved = enrollments.filter((e) => e.status === "approved").length;

  return (
    <PortalShell userId={user.id} role="admin" userLabel={user.email}>
      <div className="admin-workspace">
        {(() => {
          const groups: {
            id: string;
            label: string;
            items: { id: NonNullable<AdminSearch["tab"]>; label: string; icon: typeof Users; badge?: number | string }[];
          }[] = [
            {
              id: "students",
              label: t("العمليات التعليمية والطلاب", "Learning & Students"),
              items: [
                { id: "overview", label: t("نظرة عامة", "Overview"), icon: LayoutDashboard },
                { id: "activations", label: t("تفعيل الحسابات", "Activations"), icon: ShieldCheck, badge: pendingActivations || undefined },
                { id: "enrollments", label: t("طلبات وانضمامات", "Enrollments"), icon: Users, badge: pending || undefined },
                { id: "courses", label: t("الكورسات", "Courses"), icon: BookOpen },
                { id: "trainings", label: t("التدريبات", "Trainings"), icon: Layers },
                { id: "feedback", label: t("تقييمات الكورسات", "Course feedback"), icon: Star },
                { id: "banned", label: t("الموقوفون", "Banned"), icon: Archive, badge: enrollments.filter((e) => e.profiles?.account_blocked).length || undefined },
              ],
            },
            {
              id: "finance",
              label: t("الحجوزات والمالية", "Bookings & Finance"),
              items: [
                { id: "bookings", label: t("حجوزات الاستشارات", "Bookings"), icon: Calendar },
                { id: "finance", label: t("المعاملات المالية", "Transactions"), icon: Wallet },
                { id: "methods", label: t("طرق الدفع", "Payment methods"), icon: CreditCard },
                { id: "coupons", label: t("كوبونات الخصم", "Coupons"), icon: Ticket },
                { id: "leads", label: t("اهتمامات الكورسات", "Course leads"), icon: StickyNote },
                { id: "packages", label: t("باقات الاستشارات", "Packages"), icon: Layers },
              ],
            },
            {
              id: "site",
              label: t("إدارة محتوى الموقع", "Site Content · CMS"),
              items: [
                { id: "additions", label: t("أحدث الإضافات", "Latest additions"), icon: Sparkles },
                { id: "snapshots", label: t("لحظات المسيرة", "Career moments"), icon: Camera },
                { id: "testimonials", label: t("شهادات العملاء", "Testimonials"), icon: Star },
                { id: "success_cases", label: t("حالات النجاح", "Success cases"), icon: Trophy },
                { id: "partners", label: t("الشركاء", "Partners"), icon: Star },
                { id: "contracts", label: t("عقود التميز", "Contracts"), icon: Trophy },
                { id: "interviews", label: t("المقابلات", "Interviews"), icon: Video },
              ],
            },
            {
              id: "settings",
              label: t("الإعدادات والدعم", "Settings & Support"),
              items: [
                { id: "site", label: t("إدارة الموقع", "Site management"), icon: Settings2 },
                { id: "tickets", label: t("تذاكر الدعم", "Support tickets"), icon: LifeBuoy },
              ],
            },
          ];

          return (
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Mobile grouped select */}
              <div className="lg:hidden border border-border bg-card p-2 rounded-md">
                <select
                  value={tab}
                  onChange={(e) => setTab(e.target.value as NonNullable<AdminSearch["tab"]>)}
                  aria-label={t("القسم", "Section")}
                  className="w-full bg-background text-foreground text-sm font-semibold h-11 px-3 rounded-md border border-border focus:border-ring outline-none"
                >
                  {groups.map((g) => (
                    <optgroup key={g.id} label={g.label}>
                      {g.items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.label}
                          {it.badge ? ` (${it.badge})` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Desktop sidebar */}
              <aside className="hidden lg:block w-60 shrink-0">
                <nav aria-label={t("أقسام الإدارة", "Administration sections")} className="admin-side-nav sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto space-y-5 [scrollbar-width:thin]">

                  {groups.map((g) => (
                    <div key={g.id} className="space-y-1.5">
                      <p className="px-2 text-[11px] text-muted-foreground font-bold">
                        {g.label}
                      </p>
                      <ul className="space-y-1">
                        {g.items.map((it) => {
                          const Icon = it.icon;
                          const active = tab === it.id;
                          return (
                            <li key={it.id}>
                              <Button
                                type="button" variant="ghost"
                                onClick={() => setTab(it.id)}
                                aria-current={active ? "page" : undefined}
                                className={`w-full group flex items-center justify-start gap-2.5 px-3 h-10 rounded-md text-[13px] font-semibold transition text-start ${
                                  active
                                    ? "bg-secondary text-foreground border-s-2 border-accent"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                                }`}
                              >
                                <Icon
                                  className={`w-4 h-4 shrink-0 ${active ? "text-accent" : "text-muted-foreground"}`}
                                />
                                <span className="flex-1 truncate">{it.label}</span>
                                {it.badge ? (
                                  <span
                                    className={`min-w-[22px] text-center text-[10px] font-bold px-1.5 h-5 leading-5 rounded-md ${
                                      active
                                        ? "bg-accent/20 text-foreground"
                                        : "bg-secondary text-muted-foreground"
                                    }`}
                                  >
                                    {it.badge}
                                  </span>
                                ) : null}
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </nav>
              </aside>

              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-6">
                {tab !== "overview" && <div className="border-b border-border pb-4"><h1 className="text-xl font-bold text-foreground">{groups.flatMap((g) => g.items).find((item) => item.id === tab)?.label}</h1></div>}
                <AdminToolbar
                  enrollments={enrollments}
                  courses={courses}
                  onTrainee={setTraineeId}
                  onCourse={(id) => { setTab("courses"); setEditingCourseId(id); }}
                />
                {tab === "overview" ? (
                  <ExecutiveOverview pendingEnrollments={pending} pendingActivations={pendingActivations} approved={approved} courses={courses.length} onNavigate={setTab} />
                ) : tab === "activations" ? (
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
                ) : tab === "success_cases" ? (
                  <SuccessCasesPanel />
                ) : tab === "partners" ? (
                  <PartnersPanel />
                ) : tab === "contracts" ? (
                  <ContractsPanel />
                ) : tab === "bookings" ? (
                  <BookingsPanel />
                ) : tab === "packages" ? (
                  <PackagesPanel />
                ) : tab === "interviews" ? (
                  <InterviewsPanel />
                ) : tab === "trainings" ? (
                  <TrainingsPanel />
                ) : tab === "snapshots" ? (
                  <SnapshotsPanel />
                ) : tab === "site" ? (
                  <SiteManagementPanel />
                ) : tab === "leads" ? (
                  <CourseLeadsPanel />
                ) : tab === "feedback" ? (
                  <CourseFeedbackPanel courses={courses} />
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
            </div>
          );
        })()}

      </div>

      {drawer && (
        <EnrollmentDrawer enrollment={drawer} onClose={() => setDrawer(null)} refresh={refresh} />
      )}
      {traineeId && (
        <TraineeDrawer
          userId={traineeId}
          enrollments={enrollments.filter((e) => e.user_id === traineeId)}
          onClose={() => setTraineeId(null)}
          onOpenEnrollment={(id) => { setTraineeId(null); setDrawerId(id); }}
          refresh={refresh}
        />
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
