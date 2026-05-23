import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/PortalShell";
import { useI18n } from "@/lib/i18n";
import { useTranslatedTexts } from "@/lib/useTranslatedTexts";
import { toast } from "sonner";
import {
  Clock, CheckCircle2, XCircle, Download, Upload, BookOpen, Wallet, Loader2,
  ExternalLink, Sparkles, ArrowRight, Calendar, Layers, StickyNote, Link as LinkIcon,
  Paperclip, Check, ChevronLeft, PlayCircle, Award, Linkedin, GraduationCap, Hourglass,
  Languages, FileText, Send, AlertCircle,
} from "lucide-react";


export const Route = createFileRoute("/portal")({
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
  total_hours: number | null;
};
type Enrollment = {
  id: string; course_id: string; status: "pending" | "approved" | "rejected";
  certificate_url: string | null; certificate_issued: boolean; notes: string | null;
  name_ar: string | null; name_en: string | null;
  certificate_url_ar: string | null; certificate_url_en: string | null;
  certificate_requested_at: string | null;
  courses: Course | null;
};
type Profile = { full_name: string | null; email: string | null; phone: string | null; account_blocked?: boolean };
type ModuleRow = { id: string; course_id: string; completed_by_admin: boolean };

const DRIVE_URL = "https://drive.google.com/drive/folders/1_GB18CPhfYZQt06orG1pIgbGffUk8dXA?usp=sharing";

function PortalPage() {
  const { user, role, loading } = useAuth();
  const { lang, setLang } = useI18n();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewing, setViewing] = useState<Enrollment | null>(null);


  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && role === "admin") nav({ to: "/admin" });
  }, [user, role, loading, nav]);

  async function refresh() {
    if (!user) return;
    setLoadingData(true);
    const [p, c, e] = await Promise.all([
      supabase.from("profiles").select("full_name,email,phone").eq("id", user.id).maybeSingle(),
      supabase.from("courses").select("*").eq("active", true).order("created_at", { ascending: false }),
      supabase.from("enrollments").select("*, courses(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProfile(p.data);
    setCourses((c.data as Course[]) ?? []);
    setEnrollments((e.data as any) ?? []);
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
  const availableCourses = courses.filter((c) => !enrolledIds.has(c.id));

  const stats = useMemo(() => {
    const approved = enrollments.filter((e) => e.status === "approved");
    const certs = enrollments.filter((e) => e.certificate_issued).length;
    const hours = approved.reduce((s, e) => s + Number(e.courses?.total_hours ?? 0), 0);
    return { active: approved.length, pending: enrollments.filter((e) => e.status === "pending").length, certs, hours };
  }, [enrollments]);

  async function enroll(courseId: string) {
    if (!user) return;
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
    if (error) return toast.error(error.message);
    toast.success("تم تقديم طلب الالتحاق. ستصلك إشعار فور المراجعة.");
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
    const fresh = enrollments.find((e) => e.id === viewing.id) ?? viewing;
    return (
      <PortalShell userId={user.id} role="trainee" userLabel={profile?.full_name || profile?.email}>
        <CourseDetail enrollment={fresh} onBack={() => { setViewing(null); refresh(); }} onDownloadCert={downloadCert} onRefresh={refresh} />
      </PortalShell>
    );
  }

  return (
    <PortalShell userId={user.id} role="trainee" userLabel={profile?.full_name || profile?.email}>
      <div className="space-y-10">
        <section className="rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-7 sm:p-9 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs tracking-widest text-[var(--gold)] mb-2">{lang === "ar" ? "مرحباً بك" : "Welcome"}</p>
              <h1 className="text-3xl sm:text-4xl font-bold">{profile?.full_name || (lang === "ar" ? "متدرب جديد" : "New trainee")}</h1>
              <p className="text-white/60 mt-2 max-w-xl">{lang === "ar"
                ? "تابع كورساتك ومحاضراتك وشهاداتك ومدفوعاتك من مكان واحد. ستصلك إشعارات لحظية بأي تحديث."
                : "Track your courses, sessions, certificates and payments in one place. You'll get live notifications for every update."}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-xs text-white/80">
                <Languages className="w-4 h-4" /> {lang === "ar" ? "English" : "العربية"}
              </button>
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-5 h-12 rounded-xl font-semibold transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
                <Upload className="w-4 h-4" /> {lang === "ar" ? "رفع ملفات الاختبار" : "Upload test files"}
              </button>
            </div>
          </div>

        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={GraduationCap} label="كورسات نشطة" value={stats.active} accent="emerald" />
          <StatCard icon={Hourglass} label="طلبات معلّقة" value={stats.pending} accent="amber" />
          <StatCard icon={Clock} label="إجمالي الساعات" value={stats.hours} accent="sky" />
          <StatCard icon={Award} label="شهادات صادرة" value={stats.certs} accent="gold" />
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[var(--gold)]" /> كورساتي</h2>
          {loadingData ? <p className="text-white/50 text-sm">جاري التحميل...</p> :
           enrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">
              لا توجد كورسات بعد. اختر كورساً من الأسفل لتقديم طلب الالتحاق.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {enrollments.map((en) => <EnrollmentCard key={en.id} en={en} onOpen={() => setViewing(en)} onWithdraw={withdraw} />)}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[var(--gold)]" /> كورسات متاحة</h2>
          {availableCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">لا توجد كورسات جديدة حالياً.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCourses.map((c) => (
                <div key={c.id} className="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[var(--gold)]/40 transition flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-2xl shrink-0">
                      {c.cover_emoji || "🎓"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight">{c.title}</h3>
                      <p className="text-[10px] text-[var(--gold)]/80 mt-1">
                        {c.installments_count === 1 ? "دفعة كاملة" : `${c.installments_count} أقساط`}
                      </p>
                    </div>
                  </div>
                  {c.description && <p className="text-sm text-white/60 line-clamp-3 flex-1">{c.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-white/55">
                    {(c.starts_at || c.ends_at) && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.starts_at || "—"} → {c.ends_at || "—"}</span>
                    )}
                    {Number(c.total_hours) > 0 && (
                      <span className="flex items-center gap-1 text-[var(--gold)]/90"><Clock className="w-3 h-3" /> {c.total_hours} ساعة</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <span className="text-[var(--gold)] font-semibold text-sm">
                      {Number(c.price) > 0 ? `${Number(c.price).toLocaleString()} ${c.currency}` : "مجاني"}
                    </span>
                    <button onClick={() => enroll(c.id)} className="text-xs px-3 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold hover:opacity-90">
                      تقديم طلب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </PortalShell>
  );
}

function EnrollmentCard({ en, onOpen, onWithdraw }: { en: Enrollment; onOpen: () => void; onWithdraw: (id: string) => void }) {
  const statusBadge = {
    pending: { label: "قيد المراجعة", icon: Clock, color: "text-amber-300 bg-amber-300/10 border-amber-300/30" },
    approved: { label: "مقبول", icon: CheckCircle2, color: "text-emerald-300 bg-emerald-300/10 border-emerald-300/30" },
    rejected: { label: "مرفوض", icon: XCircle, color: "text-rose-300 bg-rose-300/10 border-rose-300/30" },
  }[en.status];
  const SIcon = statusBadge.icon;
  const c = en.courses;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col">
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
            لم تتم الموافقة على انضمامك حتى الآن. يمكنك تصفح عناوين المحاضرات (المحتوى مقفل 🔒) أو سحب الطلب.
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={onOpen} className="flex-1 text-xs h-10 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10">
              معاينة المحاضرات 🔒
            </button>
            <button onClick={() => onWithdraw(en.id)} className="text-xs px-3 h-10 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25">
              انسحاب
            </button>
          </div>
        </>
      )}
      {en.status === "rejected" && en.notes && <p className="mt-3 text-sm text-rose-200/80">{en.notes}</p>}

      {en.status === "approved" && (
        <button onClick={onOpen}
          className="mt-4 w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
          فتح الكورس <ArrowRight className="w-4 h-4 rtl-flip" />
        </button>
      )}
    </div>
  );
}

// ============= COURSE DETAIL (trainee) =============
function CourseDetail({ enrollment, onBack, onDownloadCert, onRefresh }: { enrollment: Enrollment; onBack: () => void; onDownloadCert: (url: string) => void; onRefresh: () => void }) {
  const c = enrollment.courses!;
  const [modules, setModules] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);

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

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const coursePrice = Number(c.price ?? 0);
  const completedCount = modules.filter((m) => m.completed_by_admin).length;
  const progressPct = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;

  return (
    <div className="space-y-7">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
        <ChevronLeft className="w-4 h-4 rtl-flip" /> العودة لكورساتي
      </button>

      <section className="rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 sm:p-8 backdrop-blur-xl">
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
              <span className="text-[var(--gold)] font-semibold">{coursePrice > 0 ? `${coursePrice.toLocaleString()} ${c.currency}` : "مجاني"}</span>
              <span>{c.installments_count === 1 ? "دفعة كاملة" : `${c.installments_count} أقساط`}</span>
              {Number(c.total_hours) > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[var(--gold)]" /> {c.total_hours} ساعة تدريبية</span>}
            </div>
            {c.online_url && (
              <a href={c.online_url} target="_blank" rel="noopener"
                className="mt-4 inline-flex items-center gap-2 text-sm px-4 h-10 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/40 text-[var(--gold)] hover:bg-[var(--gold)]/25 transition">
                <PlayCircle className="w-4 h-4" /> رابط المحاضرة <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {modules.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-xs text-white/60 mb-2">
              <span>التقدّم</span><span className="font-semibold text-[var(--gold)]">{progressPct}% ({completedCount}/{modules.length})</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full transition-all rounded-full" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, var(--gold), #b8923f)" }} />
            </div>
          </div>
        )}
      </section>

      {/* Sessions */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-[var(--gold)]" /> المحاضرات القادمة</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-white/50 rounded-xl border border-dashed border-white/15 p-6 text-center">لم تُجدول محاضرات بعد.</p>
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
                      <h4 className="font-semibold">{s.title}</h4>
                      <p className="text-xs text-white/60 mt-1">{dt.toLocaleString("ar-EG")} · {s.duration_minutes}د</p>
                      {s.online_url && !past && (
                        <a href={s.online_url} target="_blank" rel="noopener"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">
                          الانضمام <ExternalLink className="w-3 h-3" />
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
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Layers className="w-5 h-5 text-[var(--gold)]" /> محتوى الكورس</h2>
        {modules.length === 0 ? (
          <p className="text-sm text-white/50 rounded-xl border border-dashed border-white/15 p-6 text-center">المحتوى قيد التحضير.</p>
        ) : (
          <div className="space-y-3">
            {modules.map((m: any, i: number) => (
              <div key={m.id} className={`rounded-2xl border p-5 ${m.completed_by_admin ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${m.completed_by_admin ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-[var(--gold)]"}`}>
                    {m.completed_by_admin ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold">{m.title}</h4>
                    {m.completed_by_admin && <p className="text-[11px] text-emerald-300/80 mt-0.5">✓ تم إكمال هذا الجزء</p>}
                  </div>
                  {m.online_url && (
                    <a href={m.online_url} target="_blank" rel="noopener" className="text-xs px-3 h-9 rounded-lg bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 flex items-center gap-1">
                      <PlayCircle className="w-3.5 h-3.5" /> رابط المحاضرة
                    </a>
                  )}
                </div>

                {(items[m.id]?.length ?? 0) > 0 && (
                  <ul className="mt-4 space-y-1.5 ms-12">
                    {items[m.id].map((it: any) => (
                      <li key={it.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm">
                        {it.kind === "note" ? <StickyNote className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" /> :
                         it.kind === "link" ? <LinkIcon className="w-4 h-4 mt-0.5 text-sky-300 shrink-0" /> :
                         <Paperclip className="w-4 h-4 mt-0.5 text-emerald-300 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{it.title}</p>
                          {it.content && <p className="text-xs text-white/60 whitespace-pre-wrap mt-1">{it.content}</p>}
                          {it.url && (it.kind === "file" ? (
                            <button onClick={async () => {
                              const { data, error } = await supabase.storage.from("course-files").createSignedUrl(it.url, 120);
                              if (error) return toast.error(error.message);
                              window.open(data.signedUrl, "_blank", "noopener");
                            }} className="text-xs text-[var(--gold)] hover:underline mt-1 block truncate text-start" dir="ltr">{it.title}</button>
                          ) : (
                            <a href={it.url} target="_blank" rel="noopener" className="text-xs text-[var(--gold)] hover:underline mt-1 block truncate" dir="ltr">{it.url}</a>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <AssignmentsSection courseId={c.id} />



      {/* Payments + Certificate */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-[var(--gold)]" /> المدفوعات</h3>
          {coursePrice > 0 && (
            <p className="text-xs text-white/60 mb-3">
              مدفوع <span className="text-[var(--gold)] font-semibold">{totalPaid.toLocaleString()} {c.currency}</span> من {coursePrice.toLocaleString()} {c.currency}
            </p>
          )}
          {payments.length === 0 ? <p className="text-xs text-white/40">لا توجد مدفوعات مسجلة بعد.</p> :
            <ul className="space-y-1.5">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between text-xs bg-white/5 rounded px-2.5 py-2">
                  <span className="font-semibold">{Number(p.amount).toLocaleString()} {p.currency}</span>
                  <span className="text-white/40">{new Date(p.paid_at).toLocaleDateString("ar-EG")}</span>
                </li>
              ))}
            </ul>
          }
          {installments.length > 0 && (
            <>
              <p className="text-xs text-white/50 mt-4 mb-2">الأقساط</p>
              <ul className="space-y-1.5">
                {installments.map((i) => (
                  <li key={i.id} className="flex justify-between items-center text-xs bg-white/5 rounded px-2.5 py-2">
                    <span className="font-semibold">{Number(i.amount).toLocaleString()} {i.currency}</span>
                    <span className="text-white/40">{i.due_date ?? "—"}</span>
                    <span className={i.paid ? "text-emerald-300" : "text-amber-300"}>{i.paid ? "مدفوع" : "مستحق"}</span>
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

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: "emerald" | "amber" | "sky" | "gold" }) {
  const tone = {
    emerald: "from-emerald-400/15 to-emerald-400/5 border-emerald-400/25 text-emerald-300",
    amber: "from-amber-400/15 to-amber-400/5 border-amber-400/25 text-amber-300",
    sky: "from-sky-400/15 to-sky-400/5 border-sky-400/25 text-sky-300",
    gold: "from-[var(--gold)]/20 to-[var(--gold)]/5 border-[var(--gold)]/30 text-[var(--gold)]",
  }[accent];
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${tone} p-4 flex items-center gap-3`}>
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-[11px] text-white/60 mt-1">{label}</p>
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
  const [nameAr, setNameAr] = useState(enrollment.name_ar ?? "");
  const [nameEn, setNameEn] = useState(enrollment.name_en ?? "");
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const namesSaved = !!(enrollment.name_ar && enrollment.name_en);
  const issued = enrollment.certificate_issued && (enrollment.certificate_url_ar || enrollment.certificate_url_en || enrollment.certificate_url);
  const requested = !!enrollment.certificate_requested_at && !issued;

  async function saveNames() {
    if (!nameAr.trim() || !nameEn.trim()) return toast.error("اكتب الاسم بالعربي والإنجليزي");
    setSaving(true);
    const { error } = await supabase.from("enrollments")
      .update({ name_ar: nameAr.trim(), name_en: nameEn.trim() })
      .eq("id", enrollment.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الاسم");
    onRefresh();
  }

  async function requestCertificate() {
    if (!allModulesDone) return toast.error("لازم تكمل كل الدروس الأول");
    if (!namesSaved) return toast.error("اكتب اسمك بالعربي والإنجليزي الأول");
    setRequesting(true);
    const { error } = await supabase.from("enrollments")
      .update({ certificate_requested_at: new Date().toISOString() })
      .eq("id", enrollment.id);
    setRequesting(false);
    if (error) return toast.error(error.message);
    toast.success("تم إرسال طلب الشهادة للأدمن ✅");
    onRefresh();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-[var(--gold)]" /> الشهادة</h3>

      {issued ? (
        <div className="space-y-2.5">
          <p className="text-xs text-emerald-300 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> شهادتك جاهزة — اختر اللغة للتحميل
          </p>
          {enrollment.certificate_url_ar && (
            <button onClick={() => onDownloadCert(enrollment.certificate_url_ar!)}
              className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
              <Download className="w-4 h-4" /> تحميل النسخة العربية
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
              <Download className="w-4 h-4" /> تحميل الشهادة
            </button>
          )}
          <a href={buildLinkedInShareUrl(course.title, Number(course.total_hours ?? 0))}
            target="_blank" rel="noopener"
            className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 bg-[#0a66c2] hover:bg-[#0958a8] text-white transition">
            <Linkedin className="w-4 h-4" /> شارك إنجازك على LinkedIn
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {!namesSaved && (
            <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 space-y-2">
              <p className="text-xs text-[var(--gold)] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> اكتب اسمك بالضبط زي ما تحبه يظهر على الشهادة
              </p>
              <input value={nameAr} onChange={(e) => setNameAr(e.target.value)}
                placeholder="الاسم بالعربي" dir="rtl"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                placeholder="Full name in English" dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
              <button onClick={saveNames} disabled={saving}
                className="w-full h-10 rounded-lg text-xs font-semibold bg-[var(--gold)] text-[#0b1736] disabled:opacity-50">
                {saving ? "..." : "حفظ الاسم"}
              </button>
            </div>
          )}

          {namesSaved && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/70 space-y-1">
              <p>الاسم على الشهادة:</p>
              <p className="text-white font-semibold">{enrollment.name_ar}</p>
              <p className="text-white font-semibold" dir="ltr">{enrollment.name_en}</p>
            </div>
          )}

          {requested ? (
            <div className="rounded-xl bg-amber-300/10 border border-amber-300/30 p-3 text-xs text-amber-200 flex items-center gap-2">
              <Hourglass className="w-3.5 h-3.5" /> طلبك مُرسل للأدمن، هتوصلك الشهادة قريب
            </div>
          ) : (
            <>
              {!allModulesDone && totalModules > 0 && (
                <p className="text-[11px] text-white/55 text-center">
                  متبقى {totalModules - completedModules} درس قبل ما تقدر تطلب الشهادة
                </p>
              )}
              <button onClick={requestCertificate} disabled={!allModulesDone || !namesSaved || requesting}
                className="w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: allModulesDone && namesSaved ? "linear-gradient(135deg, var(--gold), #b8923f)" : "rgba(255,255,255,0.05)", color: allModulesDone && namesSaved ? "#0b1736" : "rgba(255,255,255,0.5)" }}>
                <Send className="w-4 h-4" /> {requesting ? "جاري الإرسال..." : "طلب إصدار الشهادة"}
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} dir="rtl"
        className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[rgba(11,23,54,0.96)] p-8 text-white shadow-2xl">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border border-[var(--gold)]/40 mx-auto"
          style={{ background: "linear-gradient(135deg, rgba(212,178,89,0.25), transparent)" }}>
          <Upload className="w-7 h-7 text-[var(--gold)]" />
        </div>
        <h3 className="text-2xl font-bold text-center">رفع ملفات الاختبار</h3>
        <p className="text-white/70 text-center mt-3 leading-relaxed text-sm">
          ارفع الملفات المطلوبة منك كاختبار على مجلد Google Drive المخصص. سيتم مراجعتها وإخطارك بالنتيجة.
        </p>
        <a href={DRIVE_URL} target="_blank" rel="noopener"
          className="mt-6 w-full h-12 rounded-xl flex items-center justify-center gap-2 font-semibold transition hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
          فتح مجلد الرفع <ExternalLink className="w-4 h-4" />
        </a>
        <button onClick={onClose} className="mt-3 w-full text-xs text-white/60 hover:text-white py-2">إغلاق</button>
      </div>
    </div>
  );
}

// ============= ASSIGNMENTS (trainee view) =============
type Assignment = {
  id: string; module_id: string; course_id: string;
  title: string; instructions: string | null;
  due_date: string | null; max_score: number;
};
type Submission = {
  id: string; assignment_id: string; user_id: string;
  content: string | null; link: string | null;
  score: number | null; feedback: string | null;
  submitted_at: string; graded_at: string | null;
};

function AssignmentsSection({ courseId }: { courseId: string }) {
  const { user } = useAuth();
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

  // realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`assignments-${courseId}-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: `course_id=eq.${courseId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignment_submissions", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [courseId, user?.id]);

  if (loading) return null;
  if (assignments.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-[var(--gold)]" /> التكليفات</h2>
      <div className="space-y-3">
        {assignments.map((a) => (
          <AssignmentCard key={a.id} a={a} sub={subs[a.id]} userId={user!.id} onChange={load} />
        ))}
      </div>
    </section>
  );
}

function AssignmentCard({ a, sub, userId, onChange }: { a: Assignment; sub: Submission | undefined; userId: string; onChange: () => void }) {
  const [content, setContent] = useState(sub?.content ?? "");
  const [link, setLink] = useState(sub?.link ?? "");
  const [saving, setSaving] = useState(false);
  const overdue = a.due_date && new Date(a.due_date) < new Date() && !sub;
  const graded = sub && sub.score !== null;

  async function submit() {
    if (!content.trim() && !link.trim()) return toast.error("اكتب إجابة أو ضع رابط");
    setSaving(true);
    if (sub) {
      const { error } = await supabase.from("assignment_submissions")
        .update({ content: content || null, link: link || null, submitted_at: new Date().toISOString() })
        .eq("id", sub.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { error } = await supabase.from("assignment_submissions")
        .insert({ assignment_id: a.id, user_id: userId, content: content || null, link: link || null });
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    toast.success("تم إرسال التسليم");
    setSaving(false);
    onChange();
  }

  return (
    <div className={`rounded-2xl border p-5 ${graded ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--gold)]" /> {a.title}</h4>
          {a.instructions && <p className="text-sm text-white/65 mt-2 whitespace-pre-wrap">{a.instructions}</p>}
          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-white/55">
            {a.due_date && <span className={overdue ? "text-rose-300" : ""}><Calendar className="inline w-3 h-3 me-1" />{new Date(a.due_date).toLocaleDateString("ar-EG")}</span>}
            <span>درجة قصوى: <span className="text-[var(--gold)]">{a.max_score}</span></span>
          </div>
        </div>
        {graded && (
          <div className="text-center px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
            <p className="text-2xl font-bold text-emerald-300">{sub.score}<span className="text-xs text-white/50">/{a.max_score}</span></p>
            <p className="text-[10px] text-emerald-300/70 mt-1">تم التقييم</p>
          </div>
        )}
      </div>

      {graded && sub.feedback && (
        <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
          <p className="text-white/50 mb-1">ملاحظات المدرّب:</p>
          <p className="text-white/85 whitespace-pre-wrap">{sub.feedback}</p>
        </div>
      )}

      {!graded && (
        <div className="mt-4 space-y-2">
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب إجابتك أو وصف تسليمك..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
          <input value={link} onChange={(e) => setLink(e.target.value)}
            placeholder="رابط (Drive / GitHub / ...)" dir="ltr"
            className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-white/50">
              {sub ? `آخر تسليم: ${new Date(sub.submitted_at).toLocaleString("ar-EG")} — يمكنك تعديله حتى يتم التقييم` : "لم تسلّم بعد"}
            </p>
            <button onClick={submit} disabled={saving}
              className="px-4 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50">
              <Send className="w-3.5 h-3.5" /> {sub ? "تحديث" : "إرسال"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
