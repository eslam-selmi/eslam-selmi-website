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
  Paperclip, Check, ChevronLeft, PlayCircle, PhoneOutgoing, Award, Linkedin, GraduationCap, Hourglass,
  FileText, Send, AlertCircle, X, Star } from "lucide-react";
import { MediaViewerModal, type MediaItem } from "@/components/MediaViewerModal";
import { TraineeSupportButton } from "@/components/SupportTickets";



type PortalSearch = {
  view?: string;
};

export const Route = createFileRoute("/portal")({
  validateSearch: (search: Record<string, unknown>): PortalSearch => ({
    view: search.view as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "بوابة المتدرب · أكاديمية إسلام سلمي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalPage,
});

type Course = {
  id: string; title: string; description: string | null; price: number | null;
  currency: string; starts_at: string | null; ends_at: string | null;
  installments_count: number; online_url: string | null; cover_emoji: string | null;
  total_hours: number | null; active: boolean; is_archived?: boolean;
};
type Enrollment = {
  id: string; user_id: string; course_id: string; status: "pending" | "approved" | "rejected";
  certificate_url: string | null; certificate_issued: boolean; notes: string | null;
  name_ar: string | null; name_en: string | null;
  certificate_url_ar: string | null; certificate_url_en: string | null;
  certificate_requested_at: string | null;
  payment_reminder_dismissed_at: string | null;
  courses: Course | null;
};
type Profile = { full_name: string | null; email: string | null; phone: string | null; country: string | null; country_code: string | null; account_blocked?: boolean };
type ModuleRow = { id: string; course_id: string; completed_by_admin: boolean };

const DRIVE_URL = "https://drive.google.com/drive/folders/1_GB18CPhfYZQt06orG1pIgbGffUk8dXA?usp=sharing";

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

  async function refresh() {
    if (!user) return;
    setLoadingData(true);
    const [p, c, e] = await Promise.all([
      supabase.from("profiles").select("full_name,email,phone,country,country_code,account_blocked").eq("id", user.id).maybeSingle(),
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

  // Realtime refresh on enrollment / payment changes
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`trainee-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments", filter: `user_id=eq.${user.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.course_id)), [enrollments]);
  const availableCourses = useMemo(() => courses.filter((c) => !(c.is_archived && !enrolledIds.has(c.id))), [courses, enrolledIds]);

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

  return (
    <PortalShell userId={user.id} role="trainee" userLabel={profile?.full_name || profile?.email}>
      <div className="space-y-10">
        <section className="dash-card p-7 sm:p-9 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs tracking-widest text-[var(--gold)] mb-2">{lang === "ar" ? "مرحباً بك" : "Welcome"}</p>
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
              <p className="text-white/60 mt-2 max-w-xl">{lang === "ar"
                ? "نظرة سريعة على كورساتك وتقدمك."
                : "A quick look at your courses and progress."}</p>
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

        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[var(--gold)]" /> {lang === "ar" ? "كورساتي" : "My Courses"}</h2>
          {loadingData ? <p className="text-white/50 text-sm">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p> :
           enrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">
              {lang === "ar" ? "لا توجد كورسات بعد. اختر كورساً من الأسفل لتقديم طلب الالتحاق." : "No courses yet. Pick a course below to request enrollment."}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {trEnrollments.map((en) => <EnrollmentCard key={en.id} en={en} onOpen={() => setViewing(en)} onWithdraw={withdraw} />)}
            </div>
          )}
        </section>

        <section>
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

      </div>


      {enrollingCourse && (
        <EnrollModal
          course={enrollingCourse}
          onClose={() => setEnrollingCourse(null)}
          onConfirm={(code: string | undefined) => enroll(enrollingCourse.id, code)}
        />
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </PortalShell>
  );
}

function EnrollmentCard({ en, onOpen, onWithdraw }: { en: Enrollment; onOpen: () => void; onWithdraw: (id: string) => void }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const statusBadge = {
    pending: { label: isAr ? "قيد المراجعة" : "Under review", icon: Clock, color: "text-amber-300 bg-amber-300/10 border-amber-300/30" },
    approved: { label: isAr ? "مقبول" : "Approved", icon: CheckCircle2, color: "text-emerald-300 bg-emerald-300/10 border-emerald-300/30" },
    rejected: { label: isAr ? "مرفوض" : "Rejected", icon: XCircle, color: "text-rose-300 bg-rose-300/10 border-rose-300/30" },
  }[en.status];

  const SIcon = statusBadge.icon;
  const c = en.courses;

  return (
    <div className="dash-card dash-card-hover p-5 flex flex-col">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-2xl shrink-0">
          {c?.cover_emoji || "🎓"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight">{c?.title}</h3>
          <span className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] ${statusBadge.color}`}>
            <SIcon className="w-3 h-3" /> {statusBadge.label}
          </span>
        </div>
      </div>

      {en.status === "pending" && (
        <>
          <p className="mt-3 text-xs text-amber-200/80 bg-amber-300/5 border border-amber-300/15 rounded-lg p-3">
            {isAr ? "لم تتم الموافقة على انضمامك حتى الآن. يمكنك تصفح عناوين المحاضرات (المحتوى مقفل 🔒) أو سحب الطلب."
                  : "Your enrollment isn't approved yet. You can preview lecture titles (content locked 🔒) or withdraw the request."}
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={onOpen} className="flex-1 text-xs h-10 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10">
              {isAr ? "معاينة المحاضرات 🔒" : "Preview lectures 🔒"}
            </button>
            <button onClick={() => onWithdraw(en.id)} className="text-xs px-3 h-10 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25">
              {isAr ? "انسحاب" : "Withdraw"}
            </button>
          </div>
        </>
      )}
      {en.status === "rejected" && en.notes && <p className="mt-3 text-sm text-rose-200/80">{en.notes}</p>}

      {en.status === "approved" && (
        <button onClick={onOpen}
          className="mt-4 w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
          {isAr ? "فتح الكورس" : "Open course"} <ArrowRight className="w-4 h-4 rtl-flip" />
        </button>
      )}

    </div>
  );
}

// ============= COURSE DETAIL (trainee) =============
function CourseDetail({ enrollment, onBack, onDownloadCert, onRefresh }: { enrollment: Enrollment; onBack: () => void; onDownloadCert: (url: string) => void; onRefresh: () => void }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const c = enrollment.courses!;
  const [modules, setModules] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [viewItem, setViewItem] = useState<MediaItem | null>(null);




  async function load() {
    const [mRes, sRes, pRes, iRes] = await Promise.all([
      supabase.from("course_modules").select("*").eq("course_id", c.id).order("order_index"),
      supabase.from("course_sessions").select("*").eq("course_id", c.id).order("starts_at"),
      supabase.from("payments").select("*").eq("enrollment_id", enrollment.id).order("paid_at"),
      supabase.from("installments").select("*").eq("enrollment_id", enrollment.id).order("due_date"),
    ]);
    const mods = mRes.data ?? [];
    setModules(mods);
    setSessions(sRes.data ?? []);
    setPayments(pRes.data ?? []);
    setInstallments(iRes.data ?? []);
    if (mods.length) {
      const { data: its } = await supabase.from("module_items").select("*").in("module_id", mods.map((m: any) => m.id)).order("order_index");
      const grouped: Record<string, any[]> = {};
      (its ?? []).forEach((it: any) => { (grouped[it.module_id] ||= []).push(it); });
      setItems(grouped);
    }
  }
  useEffect(() => { load(); }, [c.id, enrollment.id]);

  const totalPaid = payments.filter((p) => p.status !== "rejected" && p.status !== "pending").reduce((s, p) => s + Number(p.amount), 0);
  const coursePrice = Number(c.price ?? 0);
  const completedCount = modules.filter((m) => m.completed_by_admin).length;
  const progressPct = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;

  // Translate module titles + session titles
  const moduleTitles = useMemo(() => modules.map((m: any) => m.title || ""), [modules]);
  const trModuleTitles = useTranslatedTexts(moduleTitles);
  const sessionTitles = useMemo(() => sessions.map((s: any) => s.title || ""), [sessions]);
  const trSessionTitles = useTranslatedTexts(sessionTitles);

  return (
    <div className="space-y-7">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
        <ChevronLeft className="w-4 h-4 rtl-flip" /> {isAr ? "العودة لكورساتي" : "Back to my courses"}
      </button>

      <section className="dash-card p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-4xl">
            {c.cover_emoji || "🎓"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">{c.title}</h1>
            {c.description && <p className="text-white/65 mt-2 leading-relaxed">{c.description}</p>}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-white/60">
              {(c.starts_at || c.ends_at) && (
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[var(--gold)]" /> {c.starts_at || "—"} → {c.ends_at || "—"}</span>
              )}
              <span className="text-[var(--gold)] font-semibold">{coursePrice > 0 ? `${coursePrice.toLocaleString()} ${c.currency}` : (isAr ? "مجاني" : "Free")}</span>
              <span>{c.installments_count === 1 ? (isAr ? "دفعة كاملة" : "Single payment") : (isAr ? `${c.installments_count} أقساط` : `${c.installments_count} installments`)}</span>
              {Number(c.total_hours) > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[var(--gold)]" /> {c.total_hours} {isAr ? "ساعة تدريبية" : "training hrs"}</span>}
            </div>
            {c.online_url && (
              <a href={c.online_url} target="_blank" rel="noopener"
                className="mt-4 inline-flex items-center gap-2 text-sm px-4 h-10 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/40 text-[var(--gold)] hover:bg-[var(--gold)]/25 transition">
                <PlayCircle className="w-4 h-4" /> {isAr ? "رابط المحاضرة" : "Lecture link"} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {modules.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-xs text-white/60 mb-2">
              <span>{isAr ? "التقدّم" : "Progress"}</span><span className="font-semibold text-[var(--gold)]">{progressPct}% ({completedCount}/{modules.length})</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full transition-all rounded-full" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, var(--gold), #b8923f)" }} />
            </div>
          </div>
        )}
      </section>


      {/* Sessions */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-[var(--gold)]" /> {isAr ? "المحاضرات القادمة" : "Upcoming sessions"}</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-white/50 rounded-xl border border-dashed border-white/15 p-6 text-center">{isAr ? "لم تُجدول محاضرات بعد." : "No sessions scheduled yet."}</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {sessions.map((s) => {
              const dt = new Date(s.starts_at);
              const past = dt.getTime() < Date.now();
              return (
                <div key={s.id} className={`rounded-2xl border p-4 ${past ? "border-white/5 bg-white/[0.02] opacity-60" : "border-white/10 bg-white/5"}`}>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[var(--gold)] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{trSessionTitles[sessions.indexOf(s)] || s.title}</h4>
                      <p className="text-xs text-white/60 mt-1">{dt.toLocaleString(isAr ? "ar-EG" : "en-GB")} · {s.duration_minutes}{isAr ? "د" : "m"}</p>
                      {s.online_url && !past && (
                        <a href={s.online_url} target="_blank" rel="noopener"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">
                          {isAr ? "الانضمام" : "Join"} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modules / content */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Layers className="w-5 h-5 text-[var(--gold)]" /> {isAr ? "محتوى الكورس" : "Course content"}</h2>
        {modules.length === 0 ? (
          <p className="text-sm text-white/50 rounded-xl border border-dashed border-white/15 p-6 text-center">{isAr ? "المحتوى قيد التحضير." : "Content is being prepared."}</p>
        ) : (
          <div className="space-y-3">
            {modules.map((m: any, i: number) => (
              <div key={m.id} className={`rounded-2xl border p-5 ${m.completed_by_admin ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${m.completed_by_admin ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-[var(--gold)]"}`}>
                    {m.completed_by_admin ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold">{trModuleTitles[i] || m.title}</h4>
                    {m.completed_by_admin && <p className="text-[11px] text-emerald-300/80 mt-0.5">✓ {isAr ? "تم إكمال هذا الجزء" : "This module is complete"}</p>}
                  </div>
                  {m.online_url && (
                    <a href={m.online_url} target="_blank" rel="noopener" className="text-xs px-3 h-9 rounded-lg bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 flex items-center gap-1">
                      <PlayCircle className="w-3.5 h-3.5" /> {isAr ? "رابط المحاضرة" : "Lecture"}
                    </a>
                  )}
                </div>


                {(items[m.id]?.length ?? 0) > 0 && (
                  <ul className="mt-4 space-y-1.5 ms-12">
                    {items[m.id].map((it: any) => {
                      const isStorage = it.kind === "file";
                      const openable = it.kind !== "note" && !!it.url;
                      return (
                        <li key={it.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm">
                          {it.kind === "note" ? <StickyNote className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" /> :
                           it.kind === "link" ? <LinkIcon className="w-4 h-4 mt-0.5 text-sky-300 shrink-0" /> :
                           <Paperclip className="w-4 h-4 mt-0.5 text-emerald-300 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{it.title}</p>
                            {it.content && <p className="text-xs text-white/60 whitespace-pre-wrap mt-1">{it.content}</p>}
                            {openable && (
                              <button
                                type="button"
                                onClick={() =>
                                  setViewItem({
                                    title: it.title,
                                    kind: it.kind === "file" ? "file" : "link",
                                    url: it.url,
                                    isStoragePath: isStorage,
                                  })
                                }
                                className="text-xs text-[var(--gold)] hover:underline mt-1 inline-flex items-center gap-1"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                                {isAr ? "فتح المحتوى" : "Open content"}
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <MediaViewerModal item={viewItem} onClose={() => setViewItem(null)} />


      <AssignmentsSection courseId={c.id} />



      {/* Payments + Certificate */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="dash-card dash-card-hover p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-[var(--gold)]" /> {isAr ? "المدفوعات" : "Payments"}</h3>
          {coursePrice > 0 && (
            <p className="text-xs text-white/60 mb-3">
              {isAr ? "مدفوع" : "Paid"} <span className="text-[var(--gold)] font-semibold">{totalPaid.toLocaleString()} {c.currency}</span> {isAr ? "من" : "of"} {coursePrice.toLocaleString()} {c.currency}
            </p>
          )}
          {payments.length === 0 ? <p className="text-xs text-white/40">{isAr ? "لا توجد مدفوعات مسجلة بعد." : "No payments recorded yet."}</p> :
            <ul className="space-y-1.5">
              {payments.map((p) => (
                <li key={p.id} className={`flex justify-between items-center text-xs rounded px-2.5 py-2 ${p.status === "pending" ? "bg-amber-300/10 border border-amber-300/30" : p.status === "rejected" ? "bg-rose-500/10 border border-rose-500/30 opacity-70" : "bg-white/5"}`}>
                  <span className="font-semibold">{Number(p.amount).toLocaleString()} {p.currency}</span>
                  {p.status === "pending" && <span className="text-amber-300">{isAr ? "بانتظار التأكيد" : "Awaiting confirmation"}</span>}
                  {p.status === "rejected" && <span className="text-rose-300">{isAr ? "مرفوضة" : "Rejected"}</span>}
                  <span className="text-white/40">{new Date(p.paid_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}</span>
                </li>
              ))}
            </ul>
          }
          <ProofUploader
            enrollmentId={enrollment.id}
            userId={enrollment.user_id ?? ""}
            currency={c.currency}
            remaining={Math.max(0, coursePrice - Number((enrollment as any).discount_amount || 0) - totalPaid)}
            onUploaded={load}
            isAr={isAr}
          />
          {installments.length > 0 && (
            <>
              <p className="text-xs text-white/50 mt-4 mb-2">{isAr ? "الأقساط" : "Installments"}</p>
              <ul className="space-y-1.5">
                {installments.map((i) => (
                  <li key={i.id} className="flex justify-between items-center text-xs bg-white/5 rounded px-2.5 py-2">
                    <span className="font-semibold">{Number(i.amount).toLocaleString()} {i.currency}</span>
                    <span className="text-white/40">{i.due_date ?? "—"}</span>
                    <span className={i.paid ? "text-emerald-300" : "text-amber-300"}>{i.paid ? (isAr ? "مدفوع" : "Paid") : (isAr ? "مستحق" : "Due")}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>


        <CertificatePanel
          enrollment={enrollment}
          course={c}
          allModulesDone={modules.length > 0 && modules.every((m: any) => m.completed_by_admin)}
          totalModules={modules.length}
          completedModules={completedCount}
          onDownloadCert={onDownloadCert}
          onRefresh={onRefresh}
        />
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, suffix }: { icon: any; label: string; value: number | string; accent: "emerald" | "amber" | "sky" | "gold"; suffix?: string }) {
  const tone = {
    emerald: { ring: "bg-emerald-400/10 border-emerald-400/30", text: "text-emerald-300", glow: "from-emerald-400/25" },
    amber:   { ring: "bg-amber-400/10 border-amber-400/30",     text: "text-amber-300",   glow: "from-amber-400/25" },
    sky:     { ring: "bg-sky-400/10 border-sky-400/30",         text: "text-sky-300",     glow: "from-sky-400/25" },
    gold:    { ring: "bg-[var(--gold)]/10 border-[var(--gold)]/30", text: "text-[var(--gold)]", glow: "from-[var(--gold)]/30" },
  }[accent];
  return (
    <div className="dash-card dash-card-hover relative overflow-hidden p-5">
      <div className={`pointer-events-none absolute -top-12 -end-12 w-32 h-32 rounded-full bg-gradient-to-br ${tone.glow} to-transparent blur-2xl`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-white/55 font-semibold">{label}</p>
          <p className="text-3xl font-bold mt-2 leading-none truncate">
            {value}{suffix && <span className="text-sm font-medium opacity-70 ms-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-2xl border ${tone.ring} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${tone.text}`} />
        </div>
      </div>
    </div>
  );
}


function CertificatePanel({
  enrollment, course, allModulesDone, totalModules, completedModules, onDownloadCert, onRefresh,
}: {
  enrollment: Enrollment; course: Course;
  allModulesDone: boolean; totalModules: number; completedModules: number;
  onDownloadCert: (url: string) => void; onRefresh: () => void;
}) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [nameAr, setNameAr] = useState(enrollment.name_ar ?? "");
  const [nameEn, setNameEn] = useState(enrollment.name_en ?? "");
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [gradState, setGradState] = useState<{ required: boolean; submitted: boolean; approved: boolean; loading: boolean }>({ required: false, submitted: false, approved: false, loading: true });
  const namesSaved = !!(enrollment.name_ar && enrollment.name_en);
  const issued = enrollment.certificate_issued && (enrollment.certificate_url_ar || enrollment.certificate_url_en || enrollment.certificate_url);
  const requested = !!enrollment.certificate_requested_at && !issued;

  useEffect(() => {
    (async () => {
      const { data: assignments } = await supabase.from("assignments")
        .select("id,max_score,is_graduation_project")
        .eq("course_id", course.id)
        .eq("is_graduation_project", true);
      const gradAssignments = assignments ?? [];
      if (gradAssignments.length === 0) {
        setGradState({ required: false, submitted: false, approved: false, loading: false });
        return;
      }
      const ids = gradAssignments.map((a: any) => a.id);
      const { data: subs } = await supabase.from("assignment_submissions")
        .select("assignment_id,score,graded_at")
        .eq("user_id", enrollment.user_id!)
        .in("assignment_id", ids);
      const submitted = (subs ?? []).length > 0;
      const approved = gradAssignments.some((a: any) => {
        const s = (subs ?? []).find((x: any) => x.assignment_id === a.id);
        if (!s || s.score == null || !s.graded_at) return false;
        const pass = Number(a.max_score) * 0.6;
        return Number(s.score) >= pass;
      });
      setGradState({ required: true, submitted, approved, loading: false });
    })();
  }, [course.id, enrollment.user_id]);

  async function saveNames() {
    if (!nameAr.trim() || !nameEn.trim()) return toast.error(isAr ? "اكتب الاسم بالعربي والإنجليزي" : "Enter your name in both Arabic and English");
    setSaving(true);
    const { error } = await supabase.from("enrollments")
      .update({ name_ar: nameAr.trim(), name_en: nameEn.trim() })
      .eq("id", enrollment.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isAr ? "تم حفظ الاسم" : "Name saved");
    onRefresh();
  }

  async function requestCertificate() {
    if (!allModulesDone) return toast.error(isAr ? "لازم تكمل كل الدروس الأول" : "Finish all modules first");
    if (gradState.required && !gradState.approved) return toast.error(isAr ? "لازم يتم اعتماد مشروع التخرّج الأول" : "Your graduation project must be approved first");
    if (!namesSaved) return toast.error(isAr ? "اكتب اسمك بالعربي والإنجليزي الأول" : "Save your name in Arabic and English first");
    setRequesting(true);
    const { error } = await supabase.from("enrollments")
      .update({ certificate_requested_at: new Date().toISOString() })
      .eq("id", enrollment.id);
    setRequesting(false);
    if (error) return toast.error(error.message);
    toast.success(isAr ? "تم إرسال طلب الشهادة للأدمن ✅" : "Certificate request sent to admin ✅");
    onRefresh();
  }

  const canRequest = allModulesDone && namesSaved && (!gradState.required || gradState.approved);

  return (
    <div className="dash-card dash-card-hover p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-[var(--gold)]" /> {isAr ? "الشهادة" : "Certificate"}</h3>

      {issued ? (
        <div className="space-y-2.5">
          <p className="text-xs text-emerald-300 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> {isAr ? "شهادتك جاهزة — اختر اللغة للتحميل" : "Your certificate is ready — pick a language to download"}
          </p>
          {enrollment.certificate_url_ar && (
            <button onClick={() => onDownloadCert(enrollment.certificate_url_ar!)}
              className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
              <Download className="w-4 h-4" /> {isAr ? "تحميل النسخة العربية" : "Download Arabic version"}
            </button>
          )}
          {enrollment.certificate_url_en && (
            <button onClick={() => onDownloadCert(enrollment.certificate_url_en!)}
              className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 bg-white/10 border border-[var(--gold)]/40 text-[var(--gold)] hover:bg-white/15">
              <Download className="w-4 h-4" /> Download English version
            </button>
          )}
          {!enrollment.certificate_url_ar && !enrollment.certificate_url_en && enrollment.certificate_url && (
            <button onClick={() => onDownloadCert(enrollment.certificate_url!)}
              className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
              <Download className="w-4 h-4" /> {isAr ? "تحميل الشهادة" : "Download certificate"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {!namesSaved && (
            <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 space-y-2">
              <p className="text-xs text-[var(--gold)] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {isAr ? "اكتب اسمك بالضبط زي ما تحبه يظهر على الشهادة" : "Write your name exactly as you want it on the certificate"}
              </p>
              <input value={nameAr} onChange={(e) => setNameAr(e.target.value)}
                placeholder={isAr ? "الاسم بالعربي" : "Name in Arabic"} dir="rtl"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                placeholder="Full name in English" dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
              <button onClick={saveNames} disabled={saving}
                className="w-full h-10 rounded-lg text-xs font-semibold bg-[var(--gold)] text-[#0b1736] disabled:opacity-50">
                {saving ? "..." : (isAr ? "حفظ الاسم" : "Save name")}
              </button>
            </div>
          )}

          {namesSaved && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/70 space-y-1">
              <p>{isAr ? "الاسم على الشهادة:" : "Name on certificate:"}</p>
              <p className="text-white font-semibold">{enrollment.name_ar}</p>
              <p className="text-white font-semibold" dir="ltr">{enrollment.name_en}</p>
            </div>
          )}

          {requested ? (
            <div className="rounded-xl bg-amber-300/10 border border-amber-300/30 p-3 text-xs text-amber-200 flex items-center gap-2">
              <Hourglass className="w-3.5 h-3.5" /> {isAr ? "طلبك مُرسل للأدمن، هتوصلك الشهادة قريب" : "Request sent — admin will issue your certificate soon"}
            </div>
          ) : (
            <>
              {!allModulesDone && totalModules > 0 && (
                <p className="text-[11px] text-white/55 text-center">
                  {isAr ? `متبقى ${totalModules - completedModules} محاضرة قبل ما تقدر تطلب الشهادة` : `${totalModules - completedModules} lecture(s) remaining before you can request the certificate`}
                </p>
              )}
              {gradState.required && (
                <div className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${gradState.approved ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" : gradState.submitted ? "bg-amber-300/10 border-amber-300/30 text-amber-200" : "bg-rose-500/10 border-rose-500/30 text-rose-200"}`}>
                  {gradState.approved ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <p>
                    🎓 {isAr ? "مشروع التخرّج: " : "Graduation project: "}
                    {gradState.approved
                      ? (isAr ? "تم الاعتماد ✅" : "Approved ✅")
                      : gradState.submitted
                      ? (isAr ? "بانتظار تقييم الأدمن" : "Awaiting admin review")
                      : (isAr ? "لازم تسلّم مشروع التخرّج وتاخد درجة نجاح قبل ما تطلب الشهادة" : "Submit your graduation project and earn a passing grade before requesting the certificate")}
                  </p>
                </div>
              )}
              <button onClick={requestCertificate} disabled={!canRequest || requesting}
                className="w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canRequest ? "linear-gradient(135deg, var(--gold), #b8923f)" : "rgba(255,255,255,0.05)", color: canRequest ? "#0b1736" : "rgba(255,255,255,0.5)" }}>
                <Send className="w-4 h-4" /> {requesting ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "طلب إصدار الشهادة" : "Request certificate")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}


function buildLinkedInShareUrl(courseTitle: string, hours: number) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://eslam-selmi.lovable.app";
  const text =
`🎓 Just completed the "${courseTitle}" course${hours > 0 ? `, accumulating ${hours} training hours` : ""} with Eslam Selmi Academy.

Grateful for the depth of practical L&D, talent and performance management content. On to the next milestone!

#LearningAndDevelopment #TalentManagement #Performance #ContinuousLearning #EslamSelmiAcademy`;
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}&summary=${encodeURIComponent(text)}`;
}

function UploadModal({ onClose }: { onClose: () => void }) {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} dir={dir}
        className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[rgba(11,23,54,0.96)] p-8 text-white shadow-2xl">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border border-[var(--gold)]/40 mx-auto"
          style={{ background: "linear-gradient(135deg, rgba(212,178,89,0.25), transparent)" }}>
          <Upload className="w-7 h-7 text-[var(--gold)]" />
        </div>
        <h3 className="text-2xl font-bold text-center">{isAr ? "رفع ملفات الاختبار" : "Upload test files"}</h3>
        <p className="text-white/70 text-center mt-3 leading-relaxed text-sm">
          {isAr ? "ارفع الملفات المطلوبة منك كاختبار على مجلد Google Drive المخصص. سيتم مراجعتها وإخطارك بالنتيجة."
                : "Upload your test files to the dedicated Google Drive folder. They'll be reviewed and you'll be notified with the result."}
        </p>
        <a href={DRIVE_URL} target="_blank" rel="noopener"
          className="mt-6 w-full h-12 rounded-xl flex items-center justify-center gap-2 font-semibold transition hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
          {isAr ? "فتح مجلد الرفع" : "Open upload folder"} <ExternalLink className="w-4 h-4" />
        </a>
        <button onClick={onClose} className="mt-3 w-full text-xs text-white/60 hover:text-white py-2">{isAr ? "إغلاق" : "Close"}</button>
      </div>
    </div>
  );
}


// ============= ASSIGNMENTS (trainee view) =============
type Assignment = {
  id: string; module_id: string; course_id: string;
  title: string; instructions: string | null;
  due_date: string | null; max_score: number;
  is_graduation_project?: boolean;
  is_visible?: boolean;
  reference_url?: string | null;
};
type Submission = {
  id: string; assignment_id: string; user_id: string;
  content: string | null; link: string | null;
  file_path?: string | null;
  score: number | null; feedback: string | null;
  submitted_at: string; graded_at: string | null;
};

function AssignmentsSection({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subs, setSubs] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [aRes, sRes] = await Promise.all([
      supabase.from("assignments").select("*").eq("course_id", courseId).order("created_at"),
      supabase.from("assignment_submissions").select("*").eq("user_id", user.id),
    ]);
    setAssignments((aRes.data as Assignment[]) ?? []);
    const map: Record<string, Submission> = {};
    ((sRes.data as Submission[]) ?? []).forEach((s) => { map[s.assignment_id] = s; });
    setSubs(map);
    setLoading(false);
  }
  useEffect(() => { load(); }, [courseId, user?.id]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`assignments-${courseId}-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: `course_id=eq.${courseId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignment_submissions", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [courseId, user?.id]);

  if (loading) return null;
  // Hide invisible assignments from trainees
  const visible = assignments.filter((a) => a.is_visible !== false);
  const regular = visible.filter((a) => !a.is_graduation_project);
  const grad = visible.filter((a) => !!a.is_graduation_project);
  if (visible.length === 0) return null;

  return (
    <section className="space-y-6">
      {regular.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-[var(--gold)]" /> {isAr ? "التكليفات" : "Assignments"}</h2>
          <div className="space-y-3">
            {regular.map((a) => (
              <AssignmentCard key={a.id} a={a} sub={subs[a.id]} userId={user!.id} onChange={load} />
            ))}
          </div>
        </div>
      )}
      {grad.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--gold)]" /> {isAr ? "مشروع التخرّج (Capstone)" : "Capstone Graduation Project"}
          </h2>
          <div className="space-y-3">
            {grad.map((a) => (
              <AssignmentCard key={a.id} a={a} sub={subs[a.id]} userId={user!.id} onChange={load} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const GRAD_ALLOWED_EXT = ["pdf", "zip", "rar", "pptx"];
const GRAD_MAX_BYTES = 20 * 1024 * 1024;

function AssignmentCard({ a, sub, userId, onChange }: { a: Assignment; sub: Submission | undefined; userId: string; onChange: () => void }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [content, setContent] = useState(sub?.content ?? "");
  const [link, setLink] = useState(sub?.link ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const overdue = a.due_date && new Date(a.due_date) < new Date() && !sub;
  const graded = sub && sub.score !== null;
  const isGrad = !!a.is_graduation_project;

  async function submit() {
    if (!isGrad) {
      if (!content.trim() && !link.trim()) return toast.error(isAr ? "اكتب إجابة أو ضع رابط" : "Write an answer or paste a link");
    }
    setSaving(true);
    let uploadedPath: string | null = sub?.file_path ?? null;
    try {
      if (isGrad && file) {
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        if (!GRAD_ALLOWED_EXT.includes(ext)) {
          setSaving(false);
          return toast.error(isAr ? "الامتدادات المسموح بها: pdf, zip, rar, pptx" : "Allowed extensions: pdf, zip, rar, pptx");
        }
        if (file.size > GRAD_MAX_BYTES) {
          setSaving(false);
          return toast.error(isAr ? "الحد الأقصى لحجم الملف 20 ميجابايت" : "Max file size is 20MB");
        }
        const path = `${a.course_id}/${userId}/${a.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("assignment-files").upload(path, file, { upsert: true });
        if (upErr) { setSaving(false); return toast.error(upErr.message); }
        uploadedPath = path;
      }

      if (sub) {
        const { error } = await supabase.from("assignment_submissions")
          .update({ content: content || null, link: link || null, file_path: uploadedPath, submitted_at: new Date().toISOString() } as any)
          .eq("id", sub.id);
        if (error) { setSaving(false); return toast.error(error.message); }
      } else {
        const { error } = await supabase.from("assignment_submissions")
          .insert({ assignment_id: a.id, user_id: userId, content: content || null, link: link || null, file_path: uploadedPath } as any);
        if (error) { setSaving(false); return toast.error(error.message); }
      }
      toast.success(isAr ? "تم إرسال التسليم" : "Submission sent");
      setFile(null);
      onChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-2xl border p-5 ${graded ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--gold)]" /> {a.title}</h4>
          {a.instructions && <p className="text-sm text-white/65 mt-2 whitespace-pre-wrap">{a.instructions}</p>}
          {a.reference_url && (
            <a href={a.reference_url} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300 hover:underline">
              <LinkIcon className="w-3 h-3" /> {isAr ? "مرجع خارجي" : "External reference"} <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-white/55">
            {a.due_date && <span className={overdue ? "text-rose-300" : ""}><Calendar className="inline w-3 h-3 me-1" />{new Date(a.due_date).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}</span>}
            <span>{isAr ? "درجة قصوى" : "Max score"}: <span className="text-[var(--gold)]">{a.max_score}</span></span>
          </div>
        </div>
        {graded && (
          <div className="text-center px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
            <p className="text-2xl font-bold text-emerald-300">{sub.score}<span className="text-xs text-white/50">/{a.max_score}</span></p>
            <p className="text-[10px] text-emerald-300/70 mt-1">{isAr ? "تم التقييم" : "Graded"}</p>
          </div>
        )}
      </div>

      {graded && sub.feedback && (
        <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
          <p className="text-white/50 mb-1">{isAr ? "ملاحظات المدرّب:" : "Trainer feedback:"}</p>
          <p className="text-white/85 whitespace-pre-wrap">{sub.feedback}</p>
        </div>
      )}

      {!graded && (
        <div className="mt-4 space-y-2">
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder={isAr ? "اكتب إجابتك أو وصف تسليمك..." : "Write your answer or describe your submission..."}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />

          {isGrad ? (
            <>
              <div>
                <label className="text-[11px] text-white/60 block mb-1">
                  {isAr ? "ملف المشروع (pdf / zip / rar / pptx — حد أقصى 20MB)" : "Project file (pdf / zip / rar / pptx — max 20MB)"}
                </label>
                <input
                  type="file"
                  accept=".pdf,.zip,.rar,.pptx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs file:me-2 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-white/10 file:text-white"
                />
                {sub?.file_path && !file && (
                  <p className="text-[11px] text-emerald-300 mt-1">
                    ✓ {isAr ? "تم رفع ملف سابق — يمكنك استبداله بملف جديد" : "Previous file uploaded — you can replace it"}
                  </p>
                )}
              </div>
              <input value={link} onChange={(e) => setLink(e.target.value)}
                placeholder={isAr ? "رابط إضافي اختياري (Google Drive / OneDrive / ...)" : "Optional extra link (Google Drive / OneDrive / ...)"} dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
            </>
          ) : (
            <>
              <input value={link} onChange={(e) => setLink(e.target.value)}
                placeholder={isAr ? "رابط التسليم (Google Drive / OneDrive)" : "Submission link (Google Drive / OneDrive)"} dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
              <p className="text-[11px] leading-relaxed flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? "⚡ برجاء التأكد من ضبط إعدادات مشاركة الرابط ليكون 'عام / لأي شخص يمتلك الرابط' قبل إرفاقه، لضمان مراجعته واعتماده بنجاح."
                    : "⚡ Make sure the link sharing is set to 'Public / Anyone with the link' before submitting — otherwise the trainer won't be able to open it."}
                </span>
              </p>
            </>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[11px] text-white/50">
              {sub ? (isAr ? `آخر تسليم: ${new Date(sub.submitted_at).toLocaleString("ar-EG")} — يمكنك تعديله حتى يتم التقييم`
                          : `Last submitted: ${new Date(sub.submitted_at).toLocaleString("en-GB")} — editable until graded`)
                   : (isAr ? "لم تسلّم بعد" : "Not submitted yet")}
            </p>
            <button onClick={submit} disabled={saving}
              className="px-4 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50">
              <Send className="w-3.5 h-3.5" /> {sub ? (isAr ? "تحديث" : "Update") : (isAr ? "إرسال" : "Submit")}
            </button>
          </div>
        </div>

      )}
    </div>
  );
}


// ============================================================
// Enroll Modal — handles optional coupon code with live preview
// ============================================================
function EnrollModal({ course, onClose, onConfirm }: { course: Course; onClose: () => void; onConfirm: (code?: string) => void }) {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [preview, setPreview] = useState<{ ok: boolean; discount?: number; final?: number; error?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rawPrice = Number(course.price ?? 0);

  async function check() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return setPreview(null);
    setChecking(true);
    const { data, error } = await supabase.rpc("validate_coupon", { _code: trimmed, _course_id: course.id });
    setChecking(false);
    const payload = data as any;
    if (error) return setPreview({ ok: false, error: error.message });
    if (payload?.ok) setPreview({ ok: true, discount: Number(payload.discount_amount), final: Number(payload.final_price) });
    else setPreview({ ok: false, error: payload?.error || (isAr ? "كود غير صالح" : "Invalid code") });
  }

  const errorLabels: Record<string, string> = isAr ? {
    invalid_code: "كود غير صحيح",
    expired: "الكوبون منتهي الصلاحية",
    exhausted: "تم استنفاد عدد مرات الاستخدام",
    wrong_course: "هذا الكوبون لا يصلح لهذا الكورس",
    already_used: "لقد استخدمت هذا الكوبون من قبل",
    unauthenticated: "الرجاء تسجيل الدخول",
  } : {
    invalid_code: "Invalid code",
    expired: "Coupon has expired",
    exhausted: "Coupon usage limit reached",
    wrong_course: "This coupon isn't valid for this course",
    already_used: "You've already used this coupon",
    unauthenticated: "Please sign in",
  };

  async function submit() {
    setSubmitting(true);
    await onConfirm(preview?.ok ? code.trim().toUpperCase() : undefined);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div dir={dir} className="bg-[#0b1736] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--gold)] mb-1">{isAr ? "تأكيد طلب الالتحاق" : "Confirm enrollment request"}</p>
            <h3 className="text-lg font-bold">{course.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-white/60">{isAr ? "السعر" : "Price"}</span>
            <span className="font-semibold">{rawPrice > 0 ? `${rawPrice.toLocaleString()} ${course.currency}` : (isAr ? "مجاني" : "Free")}</span>
          </div>
          {preview?.ok && (
            <>
              <div className="flex justify-between text-emerald-300"><span>{isAr ? "خصم الكوبون" : "Coupon discount"}</span>
                <span>−{preview.discount?.toLocaleString()} {course.currency}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 text-[var(--gold)] font-bold">
                <span>{isAr ? "الإجمالي" : "Total"}</span>
                <span>{preview.final?.toLocaleString()} {course.currency}</span>
              </div>
            </>
          )}
        </div>

        {rawPrice > 0 && (
          <div>
            <label className="text-xs text-white/60 block mb-1.5">{isAr ? "كوبون خصم (اختياري)" : "Discount coupon (optional)"}</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setPreview(null); }}
                onBlur={check}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); check(); } }}
                placeholder="SUMMER25"
                className="flex-1 h-11 px-3 rounded-lg bg-white/5 border border-white/15 font-mono uppercase tracking-wider"
              />
              <button onClick={check} disabled={checking || !code.trim()}
                className="px-4 h-11 rounded-lg bg-white/10 border border-white/15 text-sm font-semibold disabled:opacity-50">
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "تحقق" : "Check")}
              </button>
            </div>
            {preview && !preview.ok && (
              <p className="text-xs text-rose-300 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errorLabels[preview.error || ""] || preview.error}
              </p>
            )}
            {preview?.ok && (
              <p className="text-xs text-emerald-300 mt-1.5 flex items-center gap-1">
                <Check className="w-3 h-3" /> {isAr ? "تم تطبيق الكوبون" : "Coupon applied"}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-lg bg-white/5 border border-white/15 text-sm">{isAr ? "إلغاء" : "Cancel"}</button>
          <button onClick={submit} disabled={submitting}
            className="flex-1 h-11 rounded-lg bg-[var(--gold)] text-[#0b1736] text-sm font-semibold disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isAr ? "تأكيد الطلب" : "Confirm request")}
          </button>
        </div>
      </div>

    </div>
  );
}

const PROOF_ALLOWED_EXT = ["jpg", "jpeg", "png", "pdf"];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

function ProofUploader({ enrollmentId, userId, currency, remaining, onUploaded, isAr }: { enrollmentId: string; userId: string; currency: string; remaining: number; onUploaded: () => void; isAr: boolean }) {
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [methods, setMethods] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (remaining <= 0) return;
    supabase.from("payment_methods" as any).select("*").eq("active", true).order("order_index")
      .then(({ data }) => setMethods((data as any[]) ?? []));
  }, [remaining]);

  // Hide uploader entirely when nothing is owed
  if (remaining <= 0) return null;

  async function submit() {
    if (!selected) { toast.error(isAr ? "اختر طريقة الدفع أولاً" : "Select a payment method first"); return; }
    if (!amount || !file) { toast.error(isAr ? "أدخل المبلغ وصورة الإيصال" : "Enter amount and proof image"); return; }
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!PROOF_ALLOWED_EXT.includes(ext)) {
      toast.error(isAr ? "الامتدادات المسموح بها: jpg, jpeg, png, pdf" : "Allowed extensions: jpg, jpeg, png, pdf");
      return;
    }
    if (file.size > PROOF_MAX_BYTES) {
      toast.error(isAr ? "الحد الأقصى لحجم الملف 5 ميجابايت" : "Max file size is 5MB");
      return;
    }
    setBusy(true);
    try {
      const path = `${userId}/${enrollmentId}-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("payments").insert({
        enrollment_id: enrollmentId,
        amount: Number(amount),
        currency,
        proof_url: path,
        status: "pending",
        submitted_by: userId,
        payment_method_id: selected.id,
        payment_method_name: isAr ? selected.name_ar : selected.name_en,
        note: isAr ? "إيصال من المتدرب" : "Trainee proof",
      } as any);
      if (insErr) throw insErr;
      toast.success(isAr ? "تم إرسال إيصال الدفع، بانتظار اعتماد الإدارة" : "Proof submitted, awaiting admin approval");
      setAmount(""); setFile(null); setSelected(null);
      onUploaded();
    } catch (e: any) {
      toast.error(e?.message ?? (isAr ? "حدث خطأ" : "Error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--gold)]/25 bg-[var(--gold)]/5 p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--gold)]">{isAr ? "📤 إرسال إيصال دفع" : "📤 Submit payment proof"}</p>

      {methods.length === 0 ? (
        <p className="text-xs text-white/50">{isAr ? "لا توجد طرق دفع متاحة حالياً. تواصل مع الإدارة." : "No payment methods available. Please contact admin."}</p>
      ) : (
        <>
          <div>
            <p className="text-[11px] text-white/60 mb-2">{isAr ? "1. اختر طريقة الدفع" : "1. Choose a payment method"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {methods.map((m) => {
                const active = selected?.id === m.id;
                return (
                  <button key={m.id} type="button" onClick={() => setSelected(m)}
                    className={`text-xs px-3 py-2 rounded-lg border text-start transition ${active ? "bg-[var(--gold)]/25 border-[var(--gold)] text-white" : "bg-white/5 border-white/15 text-white/80 hover:bg-white/10"}`}>
                    <span className="font-semibold block">{isAr ? m.name_ar : m.name_en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (selected.details_ar || selected.details_en) && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <p className="text-[10px] text-[var(--gold)] mb-1.5 font-semibold">{isAr ? "تفاصيل الحساب — استخدم البيانات التالية للتحويل" : "Account details — use the info below to transfer"}</p>
              <pre dir={isAr ? "rtl" : "ltr"} className="text-xs whitespace-pre-wrap font-sans text-white/85">{isAr ? (selected.details_ar || selected.details_en) : (selected.details_en || selected.details_ar)}</pre>
            </div>
          )}

          {selected && (
            <>
              <p className="text-[11px] text-white/60">{isAr ? "2. أدخل المبلغ وارفع صورة الإيصال" : "2. Enter amount and upload proof"}</p>
              <div className="flex gap-2">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={isAr ? "المبلغ" : "Amount"}
                  className="flex-1 h-9 px-3 rounded-lg bg-white/5 border border-white/15 text-sm" />
                <span className="h-9 px-3 inline-flex items-center text-xs text-white/60 bg-white/5 rounded-lg border border-white/10">{currency}</span>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs file:me-2 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-white/10 file:text-white" />
              <p className="text-[10px] text-white/50">{isAr ? "الامتدادات المسموح بها: jpg, jpeg, png, pdf — حد أقصى 5MB" : "Allowed: jpg, jpeg, png, pdf — max 5MB"}</p>
              <button onClick={submit} disabled={busy}
                className="w-full h-9 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
                {busy ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال الإيصال للمراجعة" : "Send proof for review")}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
