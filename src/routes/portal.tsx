import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/PortalShell";
import { useI18n } from "@/lib/i18n";
import { useTranslatedTexts } from "@/lib/useTranslatedTexts";
import { toast } from "sonner";
import { findCountry } from "@/lib/countries";
import { safeHref } from "@/lib/safe-url";
import { Clock, CheckCircle2, XCircle, Download, Upload, BookOpen, Wallet, Loader2,
  ExternalLink, Sparkles, ArrowRight, Calendar, Layers, StickyNote, Link as LinkIcon,
  Paperclip, Check, ChevronLeft, PlayCircle, PhoneOutgoing, Award, GraduationCap, Hourglass,
  FileText, Send, AlertCircle, X, Star, UserCog, Camera, Save } from "lucide-react";
import { MediaViewerModal, type MediaItem } from "@/components/MediaViewerModal";
import { TraineeSupportButton } from "@/components/SupportTickets";
import { TraineePackagesSection } from "@/components/TraineePackagesSection";
import { AccountSettingsModal } from "@/components/AccountSettingsModal";
import type { Course, Enrollment, Profile, ModuleRow } from "@/components/portal/types";
import { MiniStat } from "@/components/portal/MiniStat";
import { EnrollmentCard } from "@/components/portal/EnrollmentCard";
import { CourseDetail } from "@/components/portal/CourseDetail";
import { StatCard } from "@/components/portal/StatCard";
import { MyCertificatesSection } from "@/components/portal/MyCertificatesSection";
import { UploadModal } from "@/components/portal/UploadModal";
import { EnrollModal } from "@/components/portal/EnrollModal";
import { PortalAlerts, ContinueLearningCard, usePortalAlerts } from "@/components/portal/OverviewExtras";



type PortalSearch = {
  view?: string;
};

export const Route = createFileRoute("/portal")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): PortalSearch => ({
    view: search.view as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "بوابة المتدرب · إسلام سلمي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalPage,
});


function PortalPage() {
  const { user, role, loading, activationStatus } = useAuth();
  const { lang, setLang } = useI18n();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  type TabId = "overview" | "my-courses" | "certificates" | "packages" | "available";
  const [tab, setTab] = useState<TabId>("overview");
  const search = Route.useSearch();
  const [viewingId, setViewingId] = useState<string | null>(search.view || null);
  const viewing = useMemo(() => enrollments.find(e => e.id === viewingId) || null, [viewingId, enrollments]);
  const setViewing = (v: Enrollment | null) => setViewingId(v ? v.id : null);

  useEffect(() => {
    nav({ to: "/portal", search: { view: viewingId || undefined }, replace: true });
  }, [viewingId, nav]);

  const [enrollingCourse, setEnrollingCourse] = useState<Course | null>(null);


  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && role === "admin") nav({ to: "/admin" });
    if (!loading && user && role !== "admin" && (activationStatus === "pending" || activationStatus === "rejected")) {
      nav({ to: "/onboarding" });
    }
  }, [user, role, loading, activationStatus, nav]);

  async function refresh(opts?: { silent?: boolean }) {
    if (!user) return;
    if (!opts?.silent) setLoadingData(true);

    const [p, c, e] = await Promise.all([
      supabase.from("profiles").select("full_name,email,phone,country,country_code,account_blocked,avatar_url").eq("id", user.id).maybeSingle(),
      supabase.from("courses").select("*").eq("active", true).order("created_at", { ascending: false }),
      supabase.from("enrollments").select("*, courses(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    // Hard block: account disabled → force sign-out
    if ((p.data as any)?.account_blocked) {
      toast.error("تم إيقاف حسابك من قِبل الإدارة. للتواصل، يرجى مراسلة الإدارة.");
      await supabase.auth.signOut();
      nav({ to: "/auth" });
      return;
    }
    setProfile(p.data);
    setCourses((c.data as Course[]) ?? []);
    setEnrollments((e.data as any) ?? []);
    // Modules for approved enrollments → used to compute hours-as-progress
    const approvedCourseIds = ((e.data as any[]) ?? [])
      .filter((x) => x.status === "approved")
      .map((x) => x.course_id);
    if (approvedCourseIds.length > 0) {
      const m = await supabase.from("course_modules")
        .select("id,course_id,completed_by_admin")
        .in("course_id", approvedCourseIds);
      setModules((m.data as ModuleRow[]) ?? []);
    } else {
      setModules([]);
    }
    setLoadingData(false);
  }
  useEffect(() => { if (user) refresh(); }, [user]);

  // Signed URL for the private avatar file
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const path = profile?.avatar_url;
    if (!path) { setAvatarSrc(null); return; }
    supabase.storage.from("avatars").createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled) setAvatarSrc(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [profile?.avatar_url]);

  // Realtime refresh on enrollment / payment changes (silent → no loading flicker)
  useEffect(() => {
    if (!user) return;
    const silentRefresh = () => { refresh({ silent: true }); };
    const ch = supabase.channel(`trainee-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments", filter: `user_id=eq.${user.id}` }, silentRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, silentRefresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.course_id)), [enrollments]);
  // Available = active, non-archived courses the trainee is NOT already enrolled in
  const availableCourses = useMemo(
    () => courses.filter((c) => !enrolledIds.has(c.id) && !c.is_archived),
    [courses, enrolledIds]
  );


  // Batched translation of available + enrolled course titles & descriptions
  const courseTextsFlat = useMemo(() => {
    const arr: string[] = [];
    availableCourses.forEach((c) => { arr.push(c.title || ""); arr.push(c.description || ""); });
    enrollments.forEach((e) => { arr.push(e.courses?.title || ""); arr.push(e.courses?.description || ""); });
    return arr;
  }, [availableCourses, enrollments]);
  const courseTextsTr = useTranslatedTexts(courseTextsFlat);
  const trAvailable = useMemo(() => availableCourses.map((c, i) => ({
    ...c,
    title: courseTextsTr[i * 2] || c.title,
    description: courseTextsTr[i * 2 + 1] || c.description,
  })), [availableCourses, courseTextsTr]);
  const enrollmentOffset = availableCourses.length * 2;
  const trEnrollments = useMemo(() => enrollments.map((e, i) => ({
    ...e,
    courses: e.courses ? {
      ...e.courses,
      title: courseTextsTr[enrollmentOffset + i * 2] || e.courses.title,
      description: courseTextsTr[enrollmentOffset + i * 2 + 1] || e.courses.description,
    } : e.courses,
  })), [enrollments, courseTextsTr, enrollmentOffset]);

  const stats = useMemo(() => {
    const approved = enrollments.filter((e) => e.status === "approved");
    const certs = enrollments.filter((e) => e.certificate_issued).length;
    // Hours-as-progress: earned hours per course = total_hours * (completed_modules / total_modules)
    // Until all lessons are completed by admin, the trainee sees a fraction; once everything is
    // ticked off, they see the full course hours (e.g. 50/50).
    let earned = 0, total = 0;
    for (const e of approved) {
      const courseTotal = Number(e.courses?.total_hours ?? 0);
      total += courseTotal;
      const ms = modules.filter((m) => m.course_id === e.course_id);
      if (ms.length === 0) continue;
      const done = ms.filter((m) => m.completed_by_admin).length;
      earned += courseTotal * (done / ms.length);
    }
    return {
      active: approved.length,
      pending: enrollments.filter((e) => e.status === "pending").length,
      certs,
      hoursEarned: Math.round(earned),
      hoursTotal: Math.round(total),
    };
  }, [enrollments, modules]);

  const alerts = usePortalAlerts(user?.id, enrollments);
  const continueTarget = useMemo(() => {
    for (const e of trEnrollments) {
      if (e.status !== "approved") continue;
      const ms = modules.filter((m) => m.course_id === e.course_id);
      if (ms.length === 0 || ms.every((m) => m.completed_by_admin)) continue;
      const done = ms.filter((m) => m.completed_by_admin).length;
      return { en: e, progress: Math.round((done / ms.length) * 100), done, total: ms.length };
    }
    return null;
  }, [trEnrollments, modules]);

  useEffect(() => {
    if (tab === "certificates" && alerts.certCount) alerts.markSeen("certs");
    if (tab === "my-courses" && alerts.paymentCount) alerts.markSeen("payments");
  }, [tab, alerts.certCount, alerts.paymentCount]);

  async function enroll(courseId: string, couponCode?: string) {
    if (!user) return;
    const { data, error } = await supabase
      .from("enrollments")
      .insert({ user_id: user.id, course_id: courseId })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    if (couponCode && data?.id) {
      const res = await supabase.rpc("apply_coupon_to_enrollment", { _enrollment_id: data.id, _code: couponCode });
      const payload = res.data as any;
      if (res.error) toast.error(res.error.message);
      else if (payload && payload.ok === false) toast.error("تعذّر تطبيق الكوبون: " + payload.error);
      else toast.success(`تم تطبيق الكوبون · خصم ${payload?.discount_amount ?? 0}`);
    }
    toast.success("تم تقديم طلب الالتحاق. ستصلك إشعار فور المراجعة.");
    setEnrollingCourse(null);
    refresh();
  }

  async function withdraw(enrollmentId: string) {
    const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
    if (error) return toast.error(error.message);
    toast.success("تم سحب الطلب");
    refresh();
  }


  async function downloadCert(url: string) {
    const { data, error } = await supabase.storage.from("certificates").createSignedUrl(url, 60);
    if (error || !data) return toast.error("تعذّر تحميل الشهادة");
    window.open(data.signedUrl, "_blank");
  }

  if (loading || !user) {
    return <div className="min-h-screen bg-[#0b1736] flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div>;
  }

  if (viewing) {
    // always read the freshest enrollment so name/cert updates flow into the detail view
    const fresh = trEnrollments.find((e) => e.id === viewing.id) ?? enrollments.find((e) => e.id === viewing.id) ?? viewing;
    return (
      <PortalShell userId={user.id} role="trainee" userLabel={profile?.full_name || profile?.email}>
        <CourseDetail enrollment={fresh} onBack={() => { setViewing(null); refresh(); }} onDownloadCert={downloadCert} onRefresh={refresh} />
      </PortalShell>
    );
  }

  const hour = new Date().getHours();
  const greeting = lang === "ar"
    ? (hour < 5 ? "ليلة هادئة" : hour < 12 ? "صباح الخير" : hour < 17 ? "طاب يومك" : hour < 21 ? "مساء الخير" : "مساء النور")
    : (hour < 5 ? "Quiet night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night");
  const firstName = (profile?.full_name || "").trim().split(/\s+/)[0] || (lang === "ar" ? "متدرب جديد" : "there");
  const welcomeLine = lang === "ar"
    ? (hour < 5 ? `${firstName}، شغف التعلّم لا ينام — خُذ راحتك واستكمل من حيث توقفت.`
      : hour < 12 ? `صباح النشاط يا ${firstName} — ابدأ يومك بمحاضرة جديدة.`
      : hour < 17 ? `أهلاً ${firstName} — نظرة سريعة على كورساتك وتقدمك.`
      : hour < 21 ? `مساء الخير يا ${firstName} — وقت مثالي لمراجعة ما أنجزته اليوم.`
      : `${firstName}، جلسة مذاكرة هادئة قبل النوم؟ محتواك في انتظارك.`)
    : (hour < 5 ? `${firstName}, the night is quiet — pick up where you left off.`
      : hour < 12 ? `Good morning ${firstName} — start the day with a fresh lecture.`
      : hour < 17 ? `Hi ${firstName} — a quick look at your courses and progress.`
      : hour < 21 ? `Good evening ${firstName} — a great time to review today's progress.`
      : `${firstName}, a calm late-night session? Your content is ready.`);

  const navItems: { id: string; label: string; icon: any; badge?: number; to?: string; alert?: boolean }[] = [
    { id: "overview", label: lang === "ar" ? "نظرة عامة" : "Overview", icon: Sparkles },
    { id: "my-courses", label: lang === "ar" ? "كورساتي" : "My courses", icon: BookOpen, badge: alerts.paymentCount || undefined, alert: true },
    { id: "certificates", label: lang === "ar" ? "شهاداتي" : "My certificates", icon: Award, badge: alerts.certCount || undefined, alert: true },
    { id: "packages", label: lang === "ar" ? "باقات الاستشارات" : "Consulting packages", icon: PhoneOutgoing },
    { id: "available", label: lang === "ar" ? "كورسات متاحة" : "Available courses", icon: GraduationCap, badge: availableCourses.length || undefined },
    { id: "account", label: lang === "ar" ? "إعدادات الحساب" : "Account settings", icon: UserCog },
  ];


  return (
    <PortalShell userId={user.id} role="trainee" userLabel={profile?.full_name || profile?.email}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto sticky top-16 z-30 py-2 dash-header backdrop-blur-xl">
          <div className="flex gap-2 w-max">
            {navItems.filter((it) => it.id !== "account").map((it) => {
              const Icon = it.icon;
              return (
                <button key={it.id} onClick={() => setTab(it.id as TabId)}
                  className={`relative flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${tab === it.id ? "bg-[var(--gold)]/15 text-[var(--gold)] border-[var(--gold)]/40" : "text-white/70 border-white/10 bg-white/[0.03]"}`}>
                  <Icon className="w-3.5 h-3.5" /> {it.label}
                  {it.badge ? <span className={`ms-1 min-w-[18px] h-[18px] leading-[18px] text-[10px] rounded-md px-1 ${it.alert ? "bg-[var(--gold)] text-[#0b1736]" : "bg-white/10"}`}>{it.badge}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="dash-card p-3 lg:sticky lg:top-24 space-y-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="px-2 pt-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-bold">
                {lang === "ar" ? "ملخص سريع" : "Quick summary"}
              </p>
              <div className="mt-2 grid grid-cols-3 lg:grid-cols-1 gap-2">
                <MiniStat label={lang === "ar" ? "كورسات نشطة" : "Active"} value={stats.active} />
                <MiniStat label={lang === "ar" ? "ساعات" : "Hours"} value={`${stats.hoursEarned}/${stats.hoursTotal}`} />
                <MiniStat label={lang === "ar" ? "شهادات" : "Certificates"} value={stats.certs} />
              </div>
            </div>
            <div className="gold-divider" />
            <nav>
              <ul className="space-y-1">
                {navItems.map((it) => {
                  const Icon = it.icon;
                  return (
                    <li key={it.id}>
                      <button
                        onClick={() => { if (it.id === "account") { setAccountOpen(true); return; } if (it.to) { nav({ to: it.to }); return; } setTab(it.id as TabId); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className={`w-full group flex items-center gap-2.5 px-3 h-10 rounded-xl text-[13px] font-semibold transition text-start ${tab === it.id ? "bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30" : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"}`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-white/50 group-hover:text-[var(--gold)]" />
                        <span className="flex-1 truncate">{it.label}</span>
                        {it.badge ? (
                          <span className={`min-w-[22px] text-center text-[10px] font-bold px-1.5 h-5 leading-5 rounded-md ${it.alert ? "bg-[var(--gold)] text-[#0b1736] animate-pulse" : "bg-white/10 text-white/80"}`}>{it.badge}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        <div className="flex-1 min-w-0 space-y-6">
        {tab === "overview" && (<>
        <PortalAlerts alerts={alerts} lang={lang} onGo={(t) => setTab(t)} />
        <section id="overview" className="dash-card p-7 sm:p-9 backdrop-blur-xl scroll-mt-24">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-start gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setAccountOpen(true)}
                title={lang === "ar" ? "تغيير الصورة الشخصية" : "Change profile photo"}
                className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-[var(--gold)]/35 bg-white/5 flex items-center justify-center text-2xl font-bold text-[var(--gold)] hover:border-[var(--gold)] transition"
              >
                {avatarSrc
                  ? <img src={avatarSrc} alt={profile?.full_name || "avatar"} className="w-full h-full object-cover" />
                  : (profile?.full_name || profile?.email || "?").trim().charAt(0).toUpperCase()}
              </button>
              <div className="min-w-0">
              <p className="text-xs tracking-widest text-[var(--gold)] mb-2">{greeting}</p>
              <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3 flex-wrap">
                {(() => {
                  const country = findCountry(profile?.country);
                  return country ? (
                    <span
                      className="inline-flex items-center gap-2 text-sm font-normal px-2.5 py-1 rounded-full bg-white/10 border border-white/15"
                      title={lang === "ar" ? country.name_ar : country.name_en}
                    >
                      <span className="text-xl leading-none">{country.flag}</span>
                      <span className="text-white/85">{lang === "ar" ? country.name_ar : country.name_en}</span>
                    </span>
                  ) : null;
                })()}
                <span>{profile?.full_name || (lang === "ar" ? "متدرب جديد" : "New trainee")}</span>
              </h1>
              <p className="text-white/60 mt-2 max-w-xl">{welcomeLine}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TraineeSupportButton
                userId={user.id}
                enrolledCourses={trEnrollments
                  .filter((e) => e.status === "approved" && e.courses)
                  .map((e) => ({ id: e.course_id, title: e.courses!.title }))}
              />
            </div>
          </div>


        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={GraduationCap} label={lang === "ar" ? "كورسات نشطة" : "Active courses"} value={stats.active} accent="emerald" />
          <StatCard icon={Hourglass} label={lang === "ar" ? "طلبات معلّقة" : "Pending requests"} value={stats.pending} accent="amber" />
          <StatCard icon={Clock} label={lang === "ar" ? "ساعات تدريبية مكتملة" : "Training hours done"} value={`${stats.hoursEarned} / ${stats.hoursTotal}`} suffix={lang === "ar" ? "ساعة" : "hrs"} accent="sky" />
          <StatCard icon={Award} label={lang === "ar" ? "شهادات صادرة" : "Certificates"} value={stats.certs} accent="gold" />
        </section>

        <ContinueLearningCard target={continueTarget} hasCourses={enrollments.length > 0} lang={lang}
          onOpen={(en) => setViewing(en)} onBrowse={() => setTab("available")} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {navItems.filter((it) => it.id !== "overview" && it.id !== "account").map((it) => {
            const Icon = it.icon;
            return (
              <button key={it.id} onClick={() => setTab(it.id as TabId)} className="dash-card dash-card-hover p-4 flex items-center gap-3 text-start hover:border-[var(--gold)]/40 transition">
                <Icon className="w-5 h-5 text-[var(--gold)]" />
                <span className="flex-1 text-sm font-semibold">{it.label}</span>
                {it.badge ? <span className={`text-[10px] font-bold px-1.5 h-5 leading-5 rounded-md ${it.alert ? "bg-[var(--gold)] text-[#0b1736]" : "bg-white/10"}`}>{it.badge}</span> : <ArrowRight className="w-4 h-4 text-white/40 rtl-flip" />}
              </button>
            );
          })}
        </div>
        </>)}

        {tab === "certificates" && (
        <div id="certificates" className="scroll-mt-24">
          <MyCertificatesSection
            enrollments={trEnrollments.filter((e) => e.certificate_issued && (e.certificate_url_ar || e.certificate_url_en || e.certificate_url))}
            onDownload={downloadCert}
            lang={lang}
          />
        </div>

        )}
        {tab === "packages" && (
        <div id="packages" className="scroll-mt-24">
          {user?.id && <TraineePackagesSection userId={user.id} />}
        </div>

        )}
        {tab === "my-courses" && (
        <section id="my-courses" className="scroll-mt-24">

          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[var(--gold)]" /> {lang === "ar" ? "كورساتي" : "My Courses"}</h2>
          {loadingData ? <p className="text-white/50 text-sm">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p> :
           enrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">
              {lang === "ar" ? "لا توجد كورسات بعد. اختر كورساً من تبويب الكورسات المتاحة." : "No courses yet. Pick one from the Available courses tab."}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {trEnrollments.map((en) => {
                const mods = modules.filter((m) => m.course_id === en.course_id);
                const done = mods.filter((m) => m.completed_by_admin).length;
                return (
                  <EnrollmentCard
                    key={en.id}
                    en={en}
                    progress={mods.length ? Math.round((done / mods.length) * 100) : 0}
                    doneCount={done}
                    totalCount={mods.length}
                    onOpen={() => setViewing(en)}
                    onWithdraw={withdraw}
                  />
                );
              })}
            </div>
          )}
        </section>

        )}
        {tab === "available" && (
        <section id="available" className="scroll-mt-24">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[var(--gold)]" /> {lang === "ar" ? "كورسات متاحة" : "Available courses"}</h2>
          {availableCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">{lang === "ar" ? "لا توجد كورسات جديدة حالياً." : "No new courses right now."}</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trAvailable.map((c) => (
                <div key={c.id} className="group dash-card dash-card-hover p-5 hover:border-[var(--gold)]/40 transition flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-2xl shrink-0">
                      {c.cover_emoji || "🎓"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight">{c.title}</h3>
                      <p className="text-[10px] text-[var(--gold)]/80 mt-1">
                        {c.installments_count === 1 ? (lang === "ar" ? "دفعة كاملة" : "Single payment") : (lang === "ar" ? `${c.installments_count} أقساط` : `${c.installments_count} installments`)}
                      </p>
                    </div>
                  </div>
                  {c.description && <p className="text-sm text-white/60 line-clamp-3 flex-1">{c.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-white/55">
                    {(c.starts_at || c.ends_at) && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.starts_at || "—"} → {c.ends_at || "—"}</span>
                    )}
                    {Number(c.total_hours) > 0 && (
                      <span className="flex items-center gap-1 text-[var(--gold)]/90"><Clock className="w-3 h-3" /> {c.total_hours} {lang === "ar" ? "ساعة" : "hrs"}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="flex flex-col gap-1">
                      <span className="text-[var(--gold)] font-semibold text-sm">
                        {Number(c.price) > 0 ? `${Number(c.price).toLocaleString()} ${c.currency}` : (lang === "ar" ? "مجاني" : "Free")}
                      </span>
                      {c.installments_count > 1 && Number(c.price) > 0 && (
                        <span className="text-[10px] text-white/50 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          {lang === "ar"
                            ? `${c.installments_count} أقساط · ${Math.ceil(Number(c.price) / c.installments_count).toLocaleString()} ${c.currency} / قسط`
                            : `${c.installments_count} installments · ${Math.ceil(Number(c.price) / c.installments_count).toLocaleString()} ${c.currency} each`}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setEnrollingCourse(c)} className="text-xs px-3 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold hover:opacity-90">
                      {lang === "ar" ? "تقديم طلب" : "Apply"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        )}
        </div>
      </div>


      {enrollingCourse && (
        <EnrollModal
          course={enrollingCourse}
          onClose={() => setEnrollingCourse(null)}
          onConfirm={(code: string | undefined) => enroll(enrollingCourse.id, code)}
        />
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      <AccountSettingsModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        userId={user.id}
        userEmail={profile?.email}
        onSaved={() => refresh({ silent: true })}
      />
    </PortalShell>

  );
}

