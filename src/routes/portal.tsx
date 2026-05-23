import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/lib/portal-auth";
import { toast } from "sonner";
import {
  GraduationCap, LogOut, Clock, CheckCircle2, XCircle, Download,
  Upload, BookOpen, Wallet, Loader2, ExternalLink, Sparkles,
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

type Course = { id: string; title: string; description: string | null; price: number | null; currency: string };
type Enrollment = {
  id: string; course_id: string; status: "pending" | "approved" | "rejected";
  certificate_url: string | null; certificate_issued: boolean; notes: string | null;
  courses: Course | null;
};
type Profile = { full_name: string | null; email: string | null; phone: string | null };

const DRIVE_URL = "https://drive.google.com/drive/folders/1_GB18CPhfYZQt06orG1pIgbGffUk8dXA?usp=sharing";

function PortalPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

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
    setCourses(c.data ?? []);
    setEnrollments((e.data as any) ?? []);
    setLoadingData(false);
  }

  useEffect(() => { if (user) refresh(); }, [user]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.course_id)), [enrollments]);
  const availableCourses = courses.filter((c) => !enrolledIds.has(c.id));

  async function enroll(courseId: string) {
    if (!user) return;
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
    if (error) return toast.error(error.message);
    toast.success("تم تقديم طلب الالتحاق. بانتظار موافقة الإدارة.");
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

  return (
    <div dir="rtl" className="min-h-screen bg-[#0b1736] text-white">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-aurora opacity-50 pointer-events-none" />

      <header className="relative border-b border-white/10 backdrop-blur-xl bg-[rgba(11,23,54,0.6)]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <GraduationCap className="w-5 h-5 text-[var(--gold)]" />
            <span className="font-semibold">بوابة المتدرب</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 hidden sm:inline">{profile?.full_name || profile?.email}</span>
            <button onClick={() => { signOut(); nav({ to: "/auth" }); }} className="flex items-center gap-1.5 text-xs px-3 h-9 rounded-lg border border-white/15 hover:bg-white/5 transition">
              <LogOut className="w-4 h-4" /> خروج
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-5 py-10 space-y-10">
        {/* Hero */}
        <section className="rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-7 sm:p-9 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs tracking-widest text-[var(--gold)] mb-2">مرحباً</p>
              <h1 className="text-3xl sm:text-4xl font-bold">{profile?.full_name || "متدرب جديد"}</h1>
              <p className="text-white/60 mt-2 max-w-xl">تابع تقدّمك، طلباتك، شهاداتك ومدفوعاتك من مكان واحد.</p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-5 h-12 rounded-xl font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}
            >
              <Upload className="w-4 h-4" />
              رفع ملفات الاختبار
            </button>
          </div>
        </section>

        {/* My enrollments */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[var(--gold)]" /> كورساتي</h2>
          {loadingData ? (
            <div className="text-white/50 text-sm">جاري التحميل...</div>
          ) : enrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">
              لا توجد طلبات بعد. اختر كورساً من الأسفل لتقديم طلب الالتحاق.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {enrollments.map((en) => <EnrollmentCard key={en.id} en={en} onDownload={downloadCert} />)}
            </div>
          )}
        </section>

        {/* Available courses */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[var(--gold)]" /> كورسات متاحة</h2>
          {availableCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">
              لا توجد كورسات جديدة حالياً.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCourses.map((c) => (
                <div key={c.id} className="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[var(--gold)]/40 transition">
                  <h3 className="font-bold text-lg">{c.title}</h3>
                  {c.description && <p className="text-sm text-white/60 mt-2 line-clamp-3">{c.description}</p>}
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
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}

function EnrollmentCard({ en, onDownload }: { en: Enrollment; onDownload: (url: string) => void }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("payments").select("*").eq("enrollment_id", en.id).then(({ data }) => setPayments(data ?? []));
    supabase.from("installments").select("*").eq("enrollment_id", en.id).order("due_date").then(({ data }) => setInstallments(data ?? []));
  }, [open, en.id]);

  const statusBadge = {
    pending: { label: "قيد المراجعة", icon: Clock, color: "text-amber-300 bg-amber-300/10 border-amber-300/30" },
    approved: { label: "مقبول", icon: CheckCircle2, color: "text-emerald-300 bg-emerald-300/10 border-emerald-300/30" },
    rejected: { label: "مرفوض", icon: XCircle, color: "text-rose-300 bg-rose-300/10 border-rose-300/30" },
  }[en.status];
  const SIcon = statusBadge.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-lg flex-1">{en.courses?.title}</h3>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs ${statusBadge.color}`}>
          <SIcon className="w-3 h-3" /> {statusBadge.label}
        </span>
      </div>

      {en.status === "pending" && (
        <p className="mt-3 text-sm text-amber-200/80 bg-amber-300/5 border border-amber-300/15 rounded-lg p-3">
          لم تتم الموافقة على انضمامك حتى الآن. سنخطرك بمجرد المراجعة.
        </p>
      )}

      {en.status === "approved" && (
        <>
          <div className="mt-4 flex gap-2 flex-wrap">
            {en.certificate_issued && en.certificate_url ? (
              <button onClick={() => onDownload(en.certificate_url!)} className="flex items-center gap-1.5 text-xs px-3 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">
                <Download className="w-4 h-4" /> تحميل الشهادة
              </button>
            ) : (
              <span className="text-xs text-white/50 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                الشهادة لم تُصدر بعد
              </span>
            )}
            <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs px-3 h-9 rounded-lg border border-white/15 hover:bg-white/5">
              <Wallet className="w-4 h-4" /> المدفوعات والأقساط
            </button>
          </div>

          {open && (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-white/50 mb-1.5">المدفوعات</p>
                {payments.length === 0 ? <p className="text-white/40 text-xs">لا توجد مدفوعات</p> :
                  <ul className="space-y-1">
                    {payments.map((p) => (
                      <li key={p.id} className="flex justify-between text-xs bg-white/5 rounded px-2.5 py-1.5">
                        <span>{Number(p.amount).toLocaleString()} {p.currency}</span>
                        <span className="text-white/40">{new Date(p.paid_at).toLocaleDateString("ar-EG")}</span>
                      </li>
                    ))}
                  </ul>}
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1.5">الأقساط</p>
                {installments.length === 0 ? <p className="text-white/40 text-xs">لا توجد أقساط</p> :
                  <ul className="space-y-1">
                    {installments.map((i) => (
                      <li key={i.id} className="flex justify-between items-center text-xs bg-white/5 rounded px-2.5 py-1.5">
                        <span>{Number(i.amount).toLocaleString()} {i.currency}</span>
                        <span className="text-white/40">{i.due_date ?? "—"}</span>
                        <span className={i.paid ? "text-emerald-300" : "text-amber-300"}>{i.paid ? "مدفوع" : "مستحق"}</span>
                      </li>
                    ))}
                  </ul>}
              </div>
            </div>
          )}
        </>
      )}

      {en.status === "rejected" && en.notes && (
        <p className="mt-3 text-sm text-rose-200/80">{en.notes}</p>
      )}
    </div>
  );
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
          ارفع الملفات المطلوبة منك كاختبار على مجلد Google Drive المخصص.
          سيتم مراجعتها وإخطارك بالنتيجة.
        </p>
        <a
          href={DRIVE_URL} target="_blank" rel="noopener"
          className="mt-6 w-full h-12 rounded-xl flex items-center justify-center gap-2 font-semibold transition hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}
        >
          فتح مجلد الرفع <ExternalLink className="w-4 h-4" />
        </a>
        <button onClick={onClose} className="mt-3 w-full text-xs text-white/60 hover:text-white py-2">إغلاق</button>
      </div>
    </div>
  );
}
