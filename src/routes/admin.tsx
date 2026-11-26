import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { AppChrome } from "@/components/shell/AppChrome";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { AdminSupportPanel } from "@/components/SupportTickets";
import { assertAdmin } from "@/lib/admin-guard.functions";
import { SiteManagementPanel } from "@/components/admin/SiteManagementPanel";
import { PageAccessPanel } from "@/components/admin/PageAccessPanel";
import { ToolsAccessPanel } from "@/components/admin/ToolsAccessPanel";
import { SuccessCasesPanel } from "@/components/admin/SuccessCasesPanel";
import { PartnersPanel } from "@/components/admin/PartnersPanel";
import { ContractsPanel } from "@/components/admin/ContractsPanel";
import { BookingsPanel } from "@/components/admin/BookingsPanel";
import { PackagesPanel } from "@/components/admin/PackagesPanel";
import { InterviewsPanel } from "@/components/admin/InterviewsPanel";
import { TrainingsPanel } from "@/components/admin/TrainingsPanel";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { TraineeDrawer } from "@/components/admin/TraineeDrawer";
import { CourseFeedbackPanel } from "@/components/admin/CourseFeedbackPanel";
import { ShareLinksAdmin } from "@/components/share/ShareLinksAdmin";
import { ActivationsPanel } from "@/components/admin/panels/ActivationsPanel";
import { LatestAdditionsPanel, SnapshotsPanel, TestimonialsPanel } from "@/components/admin/panels/ContentPanels";
import { CouponsPanel } from "@/components/admin/panels/Coupons";
import { CourseLeadsPanel } from "@/components/admin/panels/CourseLeadsPanel";
import { CourseEditor, CoursesPanel } from "@/components/admin/panels/Courses";
import { EnrollmentDrawer } from "@/components/admin/panels/EnrollmentDrawer";
import { BannedPanel, EnrollmentsTable } from "@/components/admin/panels/Enrollments";
import { FinancePanel, PaymentMethodsPanel } from "@/components/admin/panels/Finance";
import { ProgramsPanel } from "@/components/admin/ProgramsPanel";
import { GraduateToolsPanel } from "@/components/admin/GraduateToolsPanel";
import { BuildEffectsPanel } from "@/components/admin/BuildEffectsPanel";
import { SiteMediaPanel } from "@/components/admin/SiteMediaPanel";
import { ServicesPanel } from "@/components/admin/panels/ServicesPanel";
import { VideosPanel } from "@/components/admin/panels/VideosPanel";
import { PillarsPanel } from "@/components/admin/panels/PillarsPanel";
import { AdminTranslationReview } from "@/components/admin/AdminTranslationReview";
import { Course, EnrollmentRow } from "@/components/admin/panels/types";
import { buildAdminNav, AdminSidebar, AdminMobileNav, type AdminTabId } from "@/components/admin-next/AdminNav";
import { AdminOverview, type RecentEnrollment } from "@/components/admin-next/AdminOverview";
import { SectionHeader } from "@/components/portal-next/PortalHome";
import { LayoutDashboard } from "lucide-react";

type AdminSearch = {
  tab?: AdminTabId;
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
  const isAr = lang === "ar";

  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const navigation = useRef(nav);
  navigation.current = nav;
  const search = Route.useSearch();
  const [tab, setTab] = useState<AdminTabId>(search.tab || "overview");

  const [pendingActivations, setPendingActivations] = useState<number>(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
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
        tab,
        drawer: drawerId || undefined,
        editCourse: editingCourseId || undefined,
      },
      replace: true,
    });
  }, [tab, drawerId, editingCourseId]);

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
    setDataLoaded(true);
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

  // Overview counts (bookings + open tickets) — same query key and realtime tables as the legacy ExecutiveOverview
  const queryClient = useQueryClient();
  const overviewCounts = useQuery({
    queryKey: ["admin", "overview-counts"],
    staleTime: 30_000,
    enabled: role === "admin",
    queryFn: async () => {
      const [b, s] = await Promise.all([
        supabase.from("consultation_slots").select("id", { count: "exact", head: true }).eq("status", "booked").gte("starts_at", new Date().toISOString()),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending_admin"]),
      ]);
      return { bookings: b.error ? null : b.count ?? 0, tickets: s.error ? null : s.count ?? 0 };
    },
  });
  useEffect(() => {
    if (role !== "admin") return;
    const invalidate = () => { void queryClient.invalidateQueries({ queryKey: ["admin", "overview-counts"] }); };
    const channel = supabase.channel("admin-overview-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "consultation_slots" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, invalidate)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [role, queryClient]);

  if (loading || !user || role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0b1736] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const pending = enrollments.filter((e) => e.status === "pending").length;
  const approved = enrollments.filter((e) => e.status === "approved").length;
  const blockedCount = enrollments.filter((e) => e.profiles?.account_blocked).length;

  const groups = buildAdminNav(lang, { pendingActivations, pendingEnrollments: pending, blockedCount });
  const currentSection = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))).find((i) => i.id === tab);

  const recentEnrollments: RecentEnrollment[] = enrollments.slice(0, 5).map((e) => ({
    id: e.id,
    name: e.profiles?.full_name || e.profiles?.email || t("بدون اسم", "No name"),
    course: (e as any).courses?.title || "",
    status: e.status || "pending",
    date: (e as any).created_at ? new Date((e as any).created_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB") : "",
  }));

  return (
    <AppChrome
      role="admin"
      userId={user.id}
      userLabel={user.email}
      sidebar={
        <AdminSidebar
          groups={groups}
          tab={tab}
          onSelect={setTab}
          lang={lang}
          attention={[
            { label: t("تفعيلات", "Activations"), value: pendingActivations, tone: "gold" },
            { label: t("طلبات", "Requests"), value: pending, tone: "gold" },
            { label: t("تذاكر", "Tickets"), value: overviewCounts.data?.tickets ?? 0, tone: "teal" },
          ]}
        />
      }
    >
      <div className="lg:hidden"><AdminMobileNav groups={groups} tab={tab} onSelect={setTab} lang={lang} /></div>

      <div className="space-y-6">
        {tab !== "overview" && (
          <SectionHeader
            icon={currentSection?.icon ?? LayoutDashboard}
            hint={currentSection?.group}
            title={currentSection?.label || ""}
          />
        )}
        <AdminToolbar
          enrollments={enrollments}
          courses={courses}
          onTrainee={setTraineeId}
          onCourse={(id) => { setTab("courses"); setEditingCourseId(id); }}
        />
        {tab === "overview" ? (
          <AdminOverview
            lang={lang}
            pendingEnrollments={pending}
            pendingActivations={pendingActivations}
            approved={approved}
            courses={courses.length}
            bookings={overviewCounts.data?.bookings ?? null}
            tickets={overviewCounts.data?.tickets ?? null}
            onNavigate={(d) => setTab(d)}
            recentEnrollments={recentEnrollments}
          />
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
            loaded={dataLoaded}
            refresh={refresh}
            onEdit={setEditingCourse}
          />
        ) : tab === "share" ? (
          <ShareLinksAdmin lang={lang} />
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
        ) : tab === "programs" ? (
          <ProgramsPanel />
        ) : tab === "services" ? (
          <ServicesPanel />
        ) : tab === "videos" ? (
          <VideosPanel />
        ) : tab === "pillars" ? (
          <PillarsPanel />
        ) : tab === "graduate_tools" ? (
          <GraduateToolsPanel />
        ) : tab === "media" ? (
          <SiteMediaPanel />
        ) : tab === "tools" ? (
          <ToolsAccessPanel />
        ) : tab === "pages" ? (
          <PageAccessPanel />
        ) : tab === "effects" ? (
          <BuildEffectsPanel />
        ) : tab === "visibility" || tab === "popups" || tab === "maintenance" || tab === "site" ? (
          <SiteManagementPanel section={tab === "site" ? "profile" : tab === "visibility" ? "content" : tab} />
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

      <AdminTranslationReview />

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
    </AppChrome>
  );
}
