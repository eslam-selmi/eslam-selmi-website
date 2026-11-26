import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { AppChrome } from "@/components/shell/AppChrome";
import { useI18n } from "@/lib/i18n";
import { useTranslatedTexts } from "@/lib/useTranslatedTexts";
import { toast } from "sonner";
import { findCountry } from "@/lib/countries";
import { Calendar, Clock, Layers, Loader2, Sparkles, BookOpen, GraduationCap } from "lucide-react";
import { TraineeSupportButton } from "@/components/SupportTickets";
import { TraineePackagesSection } from "@/components/TraineePackagesSection";
import { AccountSettingsModal } from "@/components/AccountSettingsModal";
import type { Course, Enrollment, Profile, ModuleRow } from "@/components/portal/types";
import { EnrollmentCard } from "@/components/portal/EnrollmentCard";
import { CourseDetail } from "@/components/portal/CourseDetail";
import { MyCertificatesSection } from "@/components/portal/MyCertificatesSection";
import { UploadModal } from "@/components/portal/UploadModal";
import { EnrollModal } from "@/components/portal/EnrollModal";
import { timeGreeting, useWelcomeGreeting } from "@/components/portal/PersonalMessage";
import { PortalAlerts, usePortalAlerts } from "@/components/portal/OverviewExtras";
import { buildPortalNav, PortalSidebar, PortalTabBar, type PortalTabId } from "@/components/portal-next/PortalNav";
import { PortalHero, PortalNudge, PortalStatsRow, PortalQuickLinks, SectionHeader, EmptyState } from "@/components/portal-next/PortalHome";



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
      { name: "description", content: "دوراتك وشهاداتك وجلساتك التدريبية في بوابة المتدرب." },
      { property: "og:title", content: "بوابة المتدرب · إسلام سلمي" },
      { property: "og:description", content: "دوراتك وشهاداتك وجلساتك التدريبية في بوابة المتدرب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  // Titles of courses with an issued certificate, kept even if the course is later set inactive.
  const [certCourses, setCertCourses] = useState<Record<string, { id: string; title: string; total_hours: number | null }>>({});
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [tab, setTab] = useState<PortalTabId>("overview");
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
    if (p.data?.account_blocked) {
      toast.error("تم إيقاف حسابك من قِبل الإدارة. للتواصل، يرجى مراسلة الإدارة.");
      await supabase.auth.signOut();
      nav({ to: "/auth" });
      return;
    }
    setProfile(p.data);
    setCourses((c.data as Course[]) ?? []);
    setEnrollments((e.data as any) ?? []);
    if (((e.data as any[]) ?? []).some((x) => x.certificate_issued && !x.courses)) {
      const cc = await (supabase as any).rpc("my_certificate_courses");
      const map: Record<string, { id: string; title: string; total_hours: number | null }> = {};
      for (const r of (cc.data as any[]) ?? []) map[r.course_id] = { id: r.course_id, title: r.title, total_hours: r.total_hours };
      setCertCourses(map);
    }
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

  // Legacy PersonalMessage priority preserved: cert-request / pending-review nudges are
  // eligible only when there is no active continueTarget (the hero owns that state).
  const nudge = useMemo(() => {
    if (continueTarget) return { readyForCert: null, hasPending: false };
    const approved = trEnrollments.filter((e) => e.status === "approved");
    const readyForCert = approved.find((e) => !e.certificate_issued && !e.certificate_requested_at) ?? null;
    const hasPending = trEnrollments.some((e) => e.status === "pending");
    return { readyForCert, hasPending };
  }, [trEnrollments, continueTarget]);

  useWelcomeGreeting(user?.id, (profile?.full_name || "").trim().split(/\s+/)[0] || undefined, lang);

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
    // Open the tab synchronously (inside the tap) so Safari does not block it, then point it at the signed file.
    const w = window.open("", "_blank");
    const { data, error } = await supabase.storage.from("certificates").createSignedUrl(url, 60);
    if (error || !data) {
      w?.close();
      return toast.error("تعذّر تحميل الشهادة");
    }
    if (w) w.location.href = data.signedUrl;
    else window.location.href = data.signedUrl;
  }

  if (loading || !user) {
    return <div className="min-h-screen bg-[#0b1736] flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div>;
  }

  const isAr = lang === "ar";
  const country = findCountry(profile?.country);
  const navItems = buildPortalNav(lang, {
    paymentCount: alerts.paymentCount,
    certCount: alerts.certCount,
    availableCount: availableCourses.length || undefined,
  });

  const chromeProps = {
    role: "trainee" as const,
    userId: user.id,
    userLabel: profile?.full_name || profile?.email,
    avatarSrc,
    onAccountSettings: () => setAccountOpen(true),
    sidebar: (
      <PortalSidebar
        items={navItems}
        tab={tab}
        onSelect={(id) => { setTab(id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onAccount={() => setAccountOpen(true)}
        summary={stats}
        profile={{
          name: profile?.full_name || (isAr ? "متدرب جديد" : "New trainee"),
          avatarSrc,
          countryFlag: country?.flag,
          countryName: isAr ? country?.name_ar : country?.name_en,
        }}
        supportNode={
          <TraineeSupportButton
            userId={user.id}
            enrolledCourses={trEnrollments
              .filter((e) => e.status === "approved" && e.courses)
              .map((e) => ({ id: e.course_id, title: e.courses!.title }))}
          />
        }
        lang={lang}
      />
    ),
    mobileBar: (
      <PortalTabBar
        items={navItems}
        tab={tab}
        onSelect={(id) => { setTab(id); window.scrollTo({ top: 0 }); }}
        lang={lang}
      />
    ),
  };

  if (viewing) {
    // always read the freshest enrollment so name/cert updates flow into the detail view
    const fresh = trEnrollments.find((e) => e.id === viewing.id) ?? enrollments.find((e) => e.id === viewing.id) ?? viewing;
    return (
      <AppChrome {...chromeProps}>
        <CourseDetail enrollment={fresh} onBack={() => { setViewing(null); refresh(); }} onDownloadCert={downloadCert} onRefresh={refresh} />
      </AppChrome>
    );
  }

  const hour = new Date().getHours();
  const greeting = timeGreeting(lang, hour);
  const firstName = (profile?.full_name || "").trim().split(/\s+/)[0] || (isAr ? "متدرب جديد" : "there");
  const welcomeLine = isAr
    ? (hour < 5 ? `${firstName}، يمكنك متابعة الكورس من حيث توقفت.`
      : hour < 12 ? `صباح النشاط يا ${firstName} — ابدأ يومك بمحاضرة جديدة.`
      : hour < 17 ? `أهلاً ${firstName} — نظرة سريعة على كورساتك وتقدمك.`
      : hour < 21 ? `مساء الخير يا ${firstName} — وقت مثالي لمراجعة ما أنجزته اليوم.`
      : `${firstName}، جلسة مذاكرة هادئة قبل النوم؟ محتواك في انتظارك.`)
    : (hour < 5 ? `${firstName}, the night is quiet — pick up where you left off.`
      : hour < 12 ? `Good morning ${firstName} — start the day with a fresh lecture.`
      : hour < 17 ? `Hi ${firstName} — a quick look at your courses and progress.`
      : hour < 21 ? `Good evening ${firstName} — a great time to review today's progress.`
      : `${firstName}, a calm late-night session? Your content is ready.`);

  return (
    <AppChrome {...chromeProps}>
      <div className="space-y-6">
        {tab === "overview" && (<>
        <PortalAlerts alerts={alerts} lang={lang} onGo={(t) => setTab(t)} />
        <PortalHero
          lang={lang}
          greeting={greeting}
          firstName={firstName}
          fullName={profile?.full_name || (isAr ? "متدرب جديد" : "New trainee")}
          welcomeLine={welcomeLine}
          countryFlag={country?.flag}
          countryName={isAr ? country?.name_ar : country?.name_en}
          avatarSrc={avatarSrc}
          hoursEarned={stats.hoursEarned}
          hoursTotal={stats.hoursTotal}
          continueTarget={continueTarget}
          onOpenCourse={(en) => setViewing(en)}
          onBrowse={() => setTab("available")}
          onAccount={() => setAccountOpen(true)}
          supportNode={
            <TraineeSupportButton
              userId={user.id}
              enrolledCourses={trEnrollments
                .filter((e) => e.status === "approved" && e.courses)
                .map((e) => ({ id: e.course_id, title: e.courses!.title }))}
            />
          }
        />
        <PortalNudge
          lang={lang}
          firstName={firstName}
          readyForCert={nudge.readyForCert}
          hasPending={nudge.hasPending}
          onOpenCourse={(en) => setViewing(en)}
          onGoMyCourses={() => setTab("my-courses")}
        />
        <PortalStatsRow lang={lang} stats={stats} />
        <PortalQuickLinks
          items={navItems.filter((it) => it.id !== "overview" && it.id !== "account")}
          onSelect={(id) => setTab(id)}
          lang={lang}
        />
        </>)}

        {tab === "certificates" && (
        <section id="certificates" className="scroll-mt-24">
          <SectionHeader icon={GraduationCap} hint={isAr ? "إنجازاتك" : "Your achievements"} title={isAr ? "شهاداتي" : "My certificates"} />
          <MyCertificatesSection
            enrollments={trEnrollments
              .filter((e) => e.certificate_issued && (e.certificate_url_ar || e.certificate_url_en || e.certificate_url))
              .map((e) => (e.courses || !certCourses[e.course_id] ? e : { ...e, courses: certCourses[e.course_id] as any }))}
            onDownload={downloadCert}
            lang={lang}
          />
        </section>
        )}

        {tab === "packages" && (
        <section id="packages" className="scroll-mt-24">
          <SectionHeader icon={Layers} hint={isAr ? "جلسات فردية" : "1:1 sessions"} title={isAr ? "باقات الاستشارات" : "Consulting packages"} />
          {user?.id && <TraineePackagesSection userId={user.id} />}
        </section>
        )}

        {tab === "my-courses" && (
        <section id="my-courses" className="scroll-mt-24">
          <SectionHeader icon={BookOpen} hint={isAr ? "مسارك التعليمي" : "Your learning path"} title={isAr ? "كورساتي" : "My courses"} />
          {loadingData ? <p className="text-white/50 text-sm">{isAr ? "جاري التحميل..." : "Loading..."}</p> :
           enrollments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={isAr ? "لا توجد كورسات بعد" : "No courses yet"}
              hint={isAr ? "اختر كورساً من تبويب الكورسات المتاحة وابدأ رحلتك." : "Pick a course from the Available courses tab to start."}
              action={<button className="nx-btn nx-btn-primary" onClick={() => setTab("available")}>{isAr ? "استعرض المتاح" : "Browse available"}</button>}
            />
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
          <SectionHeader icon={Sparkles} hint={isAr ? "خطوتك القادمة" : "Your next step"} title={isAr ? "كورسات متاحة" : "Available courses"} />
          {availableCourses.length === 0 ? (
            <EmptyState icon={GraduationCap} title={isAr ? "لا توجد كورسات جديدة حالياً" : "No new courses right now"} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trAvailable.map((c) => (
                <div key={c.id} className="group nx-card nx-card-hover p-5 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--nx-teal)]/10 border border-[var(--nx-teal)]/25 flex items-center justify-center text-2xl shrink-0">
                      {c.cover_emoji || "🎓"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[15px] leading-snug">{c.title}</h3>
                      <p className="text-[10.5px] text-[var(--nx-teal)] font-semibold mt-1">
                        {c.installments_count === 1 ? (isAr ? "دفعة كاملة" : "Single payment") : (isAr ? `${c.installments_count} أقساط` : `${c.installments_count} installments`)}
                      </p>
                    </div>
                  </div>
                  {c.description && <p className="text-[13px] text-white/55 leading-relaxed line-clamp-3 flex-1">{c.description}</p>}
                  <div className="flex flex-wrap items-center gap-2.5 mt-3 text-[11px] text-white/50">
                    {(c.starts_at || c.ends_at) && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.starts_at || "—"} ← {c.ends_at || "—"}</span>
                    )}
                    {Number(c.total_hours) > 0 && (
                      <span className="flex items-center gap-1 text-[var(--nx-gold)]"><Clock className="w-3 h-3" /> {c.total_hours} {isAr ? "ساعة" : "hrs"}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.07]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[var(--nx-gold)] font-bold text-sm nx-display">
                        {Number(c.price) > 0 ? `${Number(c.price).toLocaleString()} ${c.currency}` : (isAr ? "مجاني" : "Free")}
                      </span>
                      {c.installments_count > 1 && Number(c.price) > 0 && (
                        <span className="text-[10px] text-white/45 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          {isAr
                            ? `${c.installments_count} أقساط · ${Math.ceil(Number(c.price) / c.installments_count).toLocaleString()} ${c.currency} / قسط`
                            : `${c.installments_count} installments · ${Math.ceil(Number(c.price) / c.installments_count).toLocaleString()} ${c.currency} each`}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setEnrollingCourse(c)} className="nx-btn nx-btn-gold !h-9 !px-4 text-xs">
                      {isAr ? "تقديم طلب" : "Apply"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        )}
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
    </AppChrome>

  );
}
