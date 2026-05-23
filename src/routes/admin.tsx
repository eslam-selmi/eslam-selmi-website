import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/lib/portal-auth";
import { toast } from "sonner";
import {
  ShieldCheck, LogOut, Plus, Trash2, CheckCircle2, XCircle, Upload,
  Wallet, Loader2, Users, BookOpen, Award, FileText, X, ToggleLeft, ToggleRight,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة · أكاديمية إسلام سلمي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Course = { id: string; title: string; description: string | null; price: number | null; currency: string; active: boolean };
type EnrollmentRow = {
  id: string; user_id: string; course_id: string; status: "pending" | "approved" | "rejected";
  certificate_url: string | null; certificate_issued: boolean; notes: string | null; created_at: string;
  courses: { title: string } | null;
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
};

function AdminPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<"enrollments" | "courses">("enrollments");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [drawer, setDrawer] = useState<EnrollmentRow | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && role && role !== "admin") nav({ to: "/portal" });
  }, [user, role, loading, nav]);

  async function refresh() {
    const [c, e] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("enrollments").select("*, courses(title), profiles(full_name,email,phone)").order("created_at", { ascending: false }),
    ]);
    setCourses(c.data ?? []);
    setEnrollments((e.data as any) ?? []);
  }
  useEffect(() => { if (role === "admin") refresh(); }, [role]);

  if (loading || !user || role !== "admin") {
    return <div className="min-h-screen bg-[#0b1736] flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div>;
  }

  const pending = enrollments.filter((e) => e.status === "pending").length;
  const approved = enrollments.filter((e) => e.status === "approved").length;
  const issued = enrollments.filter((e) => e.certificate_issued).length;

  return (
    <div dir="rtl" className="min-h-screen bg-[#0b1736] text-white">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-aurora opacity-50 pointer-events-none" />

      <header className="relative border-b border-white/10 backdrop-blur-xl bg-[rgba(11,23,54,0.6)]">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <ShieldCheck className="w-5 h-5 text-[var(--gold)]" />
            <span className="font-semibold">لوحة الإدارة</span>
          </Link>
          <button onClick={() => { signOut(); nav({ to: "/auth" }); }} className="flex items-center gap-1.5 text-xs px-3 h-9 rounded-lg border border-white/15 hover:bg-white/5">
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-5 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="طلبات قيد المراجعة" value={pending} color="amber" />
          <StatCard icon={CheckCircle2} label="متدربون مقبولون" value={approved} color="emerald" />
          <StatCard icon={Award} label="شهادات صادرة" value={issued} color="gold" />
          <StatCard icon={BookOpen} label="إجمالي الكورسات" value={courses.length} color="lavender" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {[
            { id: "enrollments", label: "طلبات الانضمام والمتدربون" },
            { id: "courses", label: "إدارة الكورسات" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-3 text-sm font-semibold transition ${
                tab === t.id ? "text-[var(--gold)] border-b-2 border-[var(--gold)] -mb-px" : "text-white/60 hover:text-white"
              }`}
            >{t.label}</button>
          ))}
        </div>

        {tab === "enrollments" ? (
          <EnrollmentsTable enrollments={enrollments} onOpen={setDrawer} refresh={refresh} />
        ) : (
          <CoursesPanel courses={courses} refresh={refresh} />
        )}
      </main>

      {drawer && <EnrollmentDrawer enrollment={drawer} onClose={() => setDrawer(null)} refresh={refresh} />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const map: Record<string, string> = {
    amber: "text-amber-300", emerald: "text-emerald-300",
    gold: "text-[var(--gold)]", lavender: "text-[var(--lavender)]",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <Icon className={`w-5 h-5 ${map[color]}`} />
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-xs text-white/60 mt-1">{label}</p>
    </div>
  );
}

function EnrollmentsTable({
  enrollments, onOpen, refresh,
}: { enrollments: EnrollmentRow[]; onOpen: (e: EnrollmentRow) => void; refresh: () => void }) {
  async function setStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("enrollments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "تم القبول" : "تم الرفض");
    refresh();
  }

  if (enrollments.length === 0)
    return <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/50">لا توجد طلبات بعد.</div>;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs text-white/60 uppercase">
            <tr>
              <th className="px-4 py-3 text-right font-medium">المتدرب</th>
              <th className="px-4 py-3 text-right font-medium">الكورس</th>
              <th className="px-4 py-3 text-right font-medium">الحالة</th>
              <th className="px-4 py-3 text-right font-medium">الشهادة</th>
              <th className="px-4 py-3 text-right font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {enrollments.map((en) => (
              <tr key={en.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="font-medium">{en.profiles?.full_name || "—"}</div>
                  <div className="text-xs text-white/50">{en.profiles?.email}</div>
                  <div className="text-xs text-white/40">{en.profiles?.phone}</div>
                </td>
                <td className="px-4 py-3">{en.courses?.title}</td>
                <td className="px-4 py-3">
                  <StatusPill status={en.status} />
                </td>
                <td className="px-4 py-3 text-xs text-white/60">
                  {en.certificate_issued ? <span className="text-emerald-300">✓ صادرة</span> : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {en.status === "pending" && (
                      <>
                        <button onClick={() => setStatus(en.id, "approved")} className="text-xs px-2.5 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30">قبول</button>
                        <button onClick={() => setStatus(en.id, "rejected")} className="text-xs px-2.5 h-8 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30">رفض</button>
                      </>
                    )}
                    <button onClick={() => onOpen(en)} className="text-xs px-2.5 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">إدارة</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "قيد المراجعة", cls: "text-amber-300 bg-amber-300/10 border-amber-300/30" },
    approved: { label: "مقبول", cls: "text-emerald-300 bg-emerald-300/10 border-emerald-300/30" },
    rejected: { label: "مرفوض", cls: "text-rose-300 bg-rose-300/10 border-rose-300/30" },
  };
  const s = map[status];
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${s.cls}`}>{s.label}</span>;
}

function CoursesPanel({ courses, refresh }: { courses: Course[]; refresh: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", price: "", currency: "EGP" });
  const [busy, setBusy] = useState(false);

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("courses").insert({
      title: form.title, description: form.description || null,
      price: form.price ? Number(form.price) : 0, currency: form.currency, active: true,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تمت إضافة الكورس");
    setForm({ title: "", description: "", price: "", currency: "EGP" });
    refresh();
  }

  async function toggleActive(c: Course) {
    const { error } = await supabase.from("courses").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function del(id: string) {
    if (!confirm("حذف الكورس؟ سيتم حذف جميع الطلبات المرتبطة به.")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    refresh();
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
        {courses.length === 0 ? <div className="p-8 text-center text-white/50 text-sm">لا توجد كورسات.</div> :
          courses.map((c) => (
            <div key={c.id} className="p-5 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold">{c.title}</h4>
                  {!c.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">متوقف</span>}
                </div>
                {c.description && <p className="text-xs text-white/55 mt-1.5 line-clamp-2">{c.description}</p>}
                <p className="text-xs text-[var(--gold)] mt-2 font-semibold">
                  {Number(c.price) > 0 ? `${Number(c.price).toLocaleString()} ${c.currency}` : "مجاني"}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleActive(c)} className="p-2 rounded-lg hover:bg-white/5" title={c.active ? "إيقاف" : "تفعيل"}>
                  {c.active ? <ToggleRight className="w-5 h-5 text-emerald-300" /> : <ToggleLeft className="w-5 h-5 text-white/40" />}
                </button>
                <button onClick={() => del(c.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-300"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        }
      </div>

      <form onSubmit={addCourse} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3 h-fit">
        <h4 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-[var(--gold)]" /> إضافة كورس جديد</h4>
        <Input label="اسم الكورس" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <TextArea label="الوصف" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="السعر" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
          <Select label="العملة" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })}
            options={[{ v: "EGP", l: "جنيه" }, { v: "SAR", l: "ريال" }, { v: "USD", l: "دولار" }, { v: "AED", l: "درهم" }]} />
        </div>
        <button disabled={busy} type="submit" className="w-full h-11 rounded-xl font-semibold disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
          {busy ? "..." : "إضافة"}
        </button>
      </form>
    </div>
  );
}

function EnrollmentDrawer({
  enrollment, onClose, refresh,
}: { enrollment: EnrollmentRow; onClose: () => void; refresh: () => void }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [issued, setIssued] = useState(enrollment.certificate_issued);

  // Payment form
  const [payAmount, setPayAmount] = useState("");
  const [payCurr, setPayCurr] = useState(enrollment.courses ? "EGP" : "EGP");
  const [payNote, setPayNote] = useState("");

  // Installment form
  const [insAmount, setInsAmount] = useState("");
  const [insCurr, setInsCurr] = useState("EGP");
  const [insDate, setInsDate] = useState("");

  async function refreshLists() {
    const [p, i] = await Promise.all([
      supabase.from("payments").select("*").eq("enrollment_id", enrollment.id).order("paid_at", { ascending: false }),
      supabase.from("installments").select("*").eq("enrollment_id", enrollment.id).order("due_date"),
    ]);
    setPayments(p.data ?? []);
    setInstallments(i.data ?? []);
  }
  useEffect(() => { refreshLists(); }, [enrollment.id]);

  async function uploadCert(file: File) {
    setUploading(true);
    const path = `${enrollment.user_id}/${enrollment.id}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("certificates").upload(path, file);
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { error } = await supabase.from("enrollments")
      .update({ certificate_url: path, certificate_issued: true }).eq("id", enrollment.id);
    setUploading(false);
    if (error) return toast.error(error.message);
    setIssued(true);
    toast.success("تم رفع الشهادة وإصدارها");
    refresh();
  }

  async function toggleIssued() {
    const next = !issued;
    const { error } = await supabase.from("enrollments").update({ certificate_issued: next }).eq("id", enrollment.id);
    if (error) return toast.error(error.message);
    setIssued(next);
    toast.success(next ? "تم تفعيل إصدار الشهادة" : "تم إيقاف إصدار الشهادة");
    refresh();
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payAmount) return;
    const { error } = await supabase.from("payments").insert({
      enrollment_id: enrollment.id, amount: Number(payAmount), currency: payCurr, note: payNote || null,
    });
    if (error) return toast.error(error.message);
    setPayAmount(""); setPayNote("");
    refreshLists();
    toast.success("تمت إضافة الدفعة");
  }

  async function addInstallment(e: React.FormEvent) {
    e.preventDefault();
    if (!insAmount) return;
    const { error } = await supabase.from("installments").insert({
      enrollment_id: enrollment.id, amount: Number(insAmount), currency: insCurr, due_date: insDate || null,
    });
    if (error) return toast.error(error.message);
    setInsAmount(""); setInsDate("");
    refreshLists();
    toast.success("تمت إضافة القسط");
  }

  async function togglePaid(id: string, paid: boolean) {
    await supabase.from("installments").update({ paid: !paid, paid_at: !paid ? new Date().toISOString() : null }).eq("id", id);
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

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ms-auto w-full max-w-2xl h-full bg-[#0b1736] border-s border-white/10 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[rgba(11,23,54,0.95)] backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50">{enrollment.courses?.title}</p>
            <h3 className="text-lg font-bold">{enrollment.profiles?.full_name || enrollment.profiles?.email}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-7">
          {/* Trainee info */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-white/50">البريد</span><span dir="ltr">{enrollment.profiles?.email}</span></div>
            <div className="flex justify-between"><span className="text-white/50">الهاتف</span><span dir="ltr">{enrollment.profiles?.phone || "—"}</span></div>
            <div className="flex justify-between items-center"><span className="text-white/50">الحالة</span><StatusPill status={enrollment.status} /></div>
          </section>

          {/* Certificate */}
          <section>
            <h4 className="font-bold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-[var(--gold)]" /> الشهادة</h4>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <label className="block">
                <span className="text-xs text-white/60 mb-2 block">رفع ملف الشهادة (PDF / صورة)</span>
                <input type="file" accept=".pdf,image/*"
                  onChange={(e) => e.target.files?.[0] && uploadCert(e.target.files[0])}
                  className="block w-full text-xs file:me-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-[var(--gold)] file:text-[#0b1736] file:font-semibold file:cursor-pointer cursor-pointer" />
              </label>
              {uploading && <p className="text-xs text-amber-300 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> جاري الرفع...</p>}
              {enrollment.certificate_url && (
                <p className="text-xs text-white/50 break-all">المسار: {enrollment.certificate_url}</p>
              )}
              <button onClick={toggleIssued} disabled={!enrollment.certificate_url}
                className={`w-full h-10 rounded-lg text-xs font-semibold transition ${
                  issued ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 border border-white/15 text-white/70"
                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                {issued ? "✓ الشهادة مُصدرة للمتدرب" : "تفعيل إصدار الشهادة للمتدرب"}
              </button>
            </div>
          </section>

          {/* Payments */}
          <section>
            <h4 className="font-bold mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-[var(--gold)]" /> المدفوعات</h4>
            <form onSubmit={addPayment} className="rounded-2xl border border-white/10 bg-white/5 p-4 grid grid-cols-[1fr_110px_auto] gap-2 items-end mb-3">
              <Input label="المبلغ" type="number" value={payAmount} onChange={setPayAmount} />
              <Select label="العملة" value={payCurr} onChange={setPayCurr}
                options={[{ v: "EGP", l: "جنيه" }, { v: "SAR", l: "ريال" }, { v: "USD", l: "دولار" }, { v: "AED", l: "درهم" }]} />
              <button type="submit" className="h-11 px-4 rounded-xl font-semibold" style={{ background: "var(--gold)", color: "#0b1736" }}>إضافة</button>
              <div className="col-span-3">
                <Input label="ملاحظة (اختياري)" value={payNote} onChange={setPayNote} />
              </div>
            </form>
            <ul className="space-y-1.5">
              {payments.length === 0 ? <li className="text-xs text-white/40">لا توجد مدفوعات</li> :
                payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                    <span className="font-semibold">{Number(p.amount).toLocaleString()} {p.currency}</span>
                    <span className="text-xs text-white/50">{p.note}</span>
                    <span className="text-xs text-white/40">{new Date(p.paid_at).toLocaleDateString("ar-EG")}</span>
                    <button onClick={() => delPay(p.id)} className="text-rose-300/70 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
            </ul>
          </section>

          {/* Installments */}
          <section>
            <h4 className="font-bold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--gold)]" /> الأقساط</h4>
            <form onSubmit={addInstallment} className="rounded-2xl border border-white/10 bg-white/5 p-4 grid grid-cols-[1fr_110px_140px_auto] gap-2 items-end mb-3">
              <Input label="المبلغ" type="number" value={insAmount} onChange={setInsAmount} />
              <Select label="العملة" value={insCurr} onChange={setInsCurr}
                options={[{ v: "EGP", l: "جنيه" }, { v: "SAR", l: "ريال" }, { v: "USD", l: "دولار" }, { v: "AED", l: "درهم" }]} />
              <Input label="تاريخ الاستحقاق" type="date" value={insDate} onChange={setInsDate} />
              <button type="submit" className="h-11 px-4 rounded-xl font-semibold" style={{ background: "var(--gold)", color: "#0b1736" }}>إضافة</button>
            </form>
            <ul className="space-y-1.5">
              {installments.length === 0 ? <li className="text-xs text-white/40">لا توجد أقساط</li> :
                installments.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/10 gap-3">
                    <span className="font-semibold">{Number(i.amount).toLocaleString()} {i.currency}</span>
                    <span className="text-xs text-white/50">{i.due_date || "—"}</span>
                    <button onClick={() => togglePaid(i.id, i.paid)} className={`text-xs px-2 py-1 rounded-md ${i.paid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {i.paid ? "مدفوع" : "مستحق"}
                    </button>
                    <button onClick={() => delInst(i.id)} className="text-rose-300/70 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs text-white/60 mb-1">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/60" />
    </label>
  );
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-white/60 mb-1">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/60" />
    </label>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="block">
      <span className="block text-xs text-white/60 mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[var(--gold)]/60">
        {options.map((o) => <option key={o.v} value={o.v} className="bg-[#0b1736]">{o.l}</option>)}
      </select>
    </label>
  );
}
