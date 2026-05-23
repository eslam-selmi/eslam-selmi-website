import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
// notifications surfaced via PortalShell
import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";
import { generateCertificatePdf } from "@/lib/certificate";
import { useI18n } from "@/lib/i18n";
import {
  Plus, Trash2, CheckCircle2, Upload, Wallet, Loader2, Users, BookOpen, Award,
  FileText, X, ToggleLeft, ToggleRight, Calendar, Layers, Link as LinkIcon,
  StickyNote, Paperclip, Pencil, Check, Clock, Settings2, Sparkles, Ticket, Percent,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: t("لوحة الإدارة · أكاديمية إسلام سلمي", "Admin Panel · Eslam Selmi Academy") },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Course = {
  id: string; title: string; description: string | null; price: number | null;
  currency: string; active: boolean; starts_at: string | null; ends_at: string | null;
  installments_count: number; online_url: string | null; cover_emoji: string | null;
  total_hours: number | null;
};
type EnrollmentRow = {
  id: string; user_id: string; course_id: string; status: "pending" | "approved" | "rejected";
  certificate_url: string | null; certificate_issued: boolean; notes: string | null; created_at: string;
  blocked: boolean;
  name_ar: string | null; name_en: string | null;
  certificate_url_ar: string | null; certificate_url_en: string | null;
  certificate_requested_at: string | null;
  courses: Course | null;
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
};

function AdminPage() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<"enrollments" | "courses" | "coupons">("enrollments");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [drawer, setDrawer] = useState<EnrollmentRow | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && role && role !== "admin") nav({ to: "/portal" });
  }, [user, role, loading, nav]);

  async function refresh() {
    const [c, e] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("enrollments").select("*, courses(*)").order("created_at", { ascending: false }),
    ]);
    const enrollList = (e.data as any[]) ?? [];
    // Fetch profiles separately to avoid PostgREST embed issues (no direct FK previously)
    const userIds = Array.from(new Set(enrollList.map((x) => x.user_id)));
    let profileMap: Record<string, any> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", userIds);
      profileMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    }
    setCourses((c.data as Course[]) ?? []);
    setEnrollments(enrollList.map((r) => ({ ...r, profiles: profileMap[r.user_id] ?? null })));
  }
  useEffect(() => { if (role === "admin") refresh(); }, [role]);

  // Realtime refresh on new enrollments / payments
  useEffect(() => {
    if (role !== "admin") return;
    const ch = supabase
      .channel("admin-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [role]);

  // (Notifications are surfaced through the PortalShell bell — no duplicate subscription here.)

  if (loading || !user || role !== "admin") {
    return <div className="min-h-screen bg-[#0b1736] flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div>;
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
              <p className="font-bold text-amber-100">{pending} طلب{pending > 2 ? t("ات", "s") : ""} انضمام بانتظار مراجعتك</p>
              <p className="text-xs text-amber-200/70">{t("راجع الطلبات الجديدة في تبويب طلبات الانضمام بالأسفل.", "Review new requests in the enrollments tab below.")}</p>
            </div>
            <button onClick={() => setTab("enrollments")} className="text-xs px-3 h-9 rounded-lg bg-amber-300 text-amber-950 font-semibold">{t("عرض", "View")}</button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label={t("طلبات قيد المراجعة", "Pending requests")} value={pending} color="amber" />
          <StatCard icon={CheckCircle2} label={t("متدربون مقبولون", "Approved trainees")} value={approved} color="emerald" />
          <StatCard icon={Award} label={t("شهادات صادرة", "Certificates issued")} value={issued} color="gold" />
          <StatCard icon={BookOpen} label={t("إجمالي الكورسات", "Total courses")} value={courses.length} color="lavender" />
        </div>

        <div className="flex gap-2 border-b border-white/10 flex-wrap">
          {[
            { id: "enrollments", label: `طلبات وانضمامات (${enrollments.length})` },
            { id: "courses", label: `الكورسات (${courses.length})` },
            { id: "coupons", label: t("كوبونات الخصم", "Discount coupons") },
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
        ) : tab === "courses" ? (
          <CoursesPanel courses={courses} refresh={refresh} onEdit={setEditingCourse} />
        ) : (
          <CouponsPanel courses={courses} />
        )}
      </div>

      {drawer && <EnrollmentDrawer enrollment={drawer} onClose={() => setDrawer(null)} refresh={refresh} />}
      {editingCourse && <CourseEditor course={editingCourse} onClose={() => setEditingCourse(null)} refresh={refresh} />}
    </PortalShell>
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
    toast.success(status === "approved" ? t("تم قبول المتدرب", "Trainee approved") : t("تم رفض الطلب", "Request rejected"));
    refresh();
  }

  if (enrollments.length === 0)
    return <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/50">{t("لا توجد طلبات بعد.", "No requests yet.")}</div>;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs text-white/60 uppercase">
            <tr>
              <th className="px-4 py-3 text-right font-medium">{t("المتدرب", "Trainee")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("الكورس", "Course")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("الحالة", "Status")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("الشهادة", "Certificate")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("إجراء", "Action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {enrollments.map((en) => (
              <tr key={en.id} className={`hover:bg-white/[0.02] ${en.status === "pending" ? "bg-amber-300/[0.04]" : ""}`}>
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
                  {en.certificate_issued ? <span className="text-emerald-300">{t("✓ صادرة", "✓ Issued")}</span> : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {en.status === "pending" && (
                      <>
                        <button onClick={() => setStatus(en.id, "approved")} className="text-xs px-2.5 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30">{t("قبول", "Approve")}</button>
                        <button onClick={() => setStatus(en.id, "rejected")} className="text-xs px-2.5 h-8 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30">{t("رفض", "Reject")}</button>
                      </>
                    )}
                    <button onClick={() => onOpen(en)} className="text-xs px-2.5 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">{t("إدارة", "Manage")}</button>
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
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: t("قيد المراجعة", "Pending"), cls: "text-amber-300 bg-amber-300/10 border-amber-300/30" },
    approved: { label: t("مقبول", "Approved"), cls: "text-emerald-300 bg-emerald-300/10 border-emerald-300/30" },
    rejected: { label: t("مرفوض", "Rejected"), cls: "text-rose-300 bg-rose-300/10 border-rose-300/30" },
  };
  const s = map[status];
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${s.cls}`}>{s.label}</span>;
}

// ============= COURSES PANEL =============
function CoursesPanel({ courses, refresh, onEdit }: { courses: Course[]; refresh: () => void; onEdit: (c: Course) => void }) {
  const [form, setForm] = useState({
    title: "", description: "", price: "", currency: "EGP",
    starts_at: "", ends_at: "", installments_count: "1", online_url: "", cover_emoji: "🎓",
    total_hours: "",
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
      active: true,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("تمت إضافة الكورس", "Course added"));
    setForm({ title: "", description: "", price: "", currency: "EGP", starts_at: "", ends_at: "", installments_count: "1", online_url: "", cover_emoji: "🎓", total_hours: "" });
    refresh();
  }

  async function toggleActive(c: Course) {
    const { error } = await supabase.from("courses").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function del(id: string) {
    if (!confirm(t("حذف الكورس؟ سيتم حذف جميع الطلبات والمحتوى المرتبط به.", "Delete course? All related enrollments and content will be deleted."))) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحذف", "Deleted"));
    refresh();
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-3">
        {courses.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50 text-sm">{t("لا توجد كورسات. أضف أول كورس →", "No courses yet. Add your first course →")}</div> :
          courses.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[var(--gold)]/30 transition">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-2xl shrink-0">
                  {c.cover_emoji || "🎓"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-lg">{c.title}</h4>
                    {!c.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">{t("متوقف", "Inactive")}</span>}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">
                      {c.installments_count === 1 ? t("دفعة كاملة", "Full payment") : `${c.installments_count} ${t(`أقساط`, `installments`)}`}
                    </span>
                  </div>
                  {c.description && <p className="text-xs text-white/55 mt-1.5 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-4 mt-3 text-xs text-white/60 flex-wrap">
                    <span className="text-[var(--gold)] font-semibold">
                      {Number(c.price) > 0 ? `${Number(c.price).toLocaleString()} ${c.currency}` : t("مجاني", "Free")}
                    </span>
                    {c.starts_at && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.starts_at} → {c.ends_at || "—"}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => onEdit(c)} className="flex items-center gap-1.5 text-xs px-3 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">
                    <Settings2 className="w-3.5 h-3.5" /> إدارة المحتوى
                  </button>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => toggleActive(c)} className="p-2 rounded-lg hover:bg-white/5" title={c.active ? t("إيقاف", "Disable") : t("تفعيل", "Enable")}>
                      {c.active ? <ToggleRight className="w-5 h-5 text-emerald-300" /> : <ToggleLeft className="w-5 h-5 text-white/40" />}
                    </button>
                    <button onClick={() => del(c.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-300"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      <form onSubmit={addCourse} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3 h-fit sticky top-24">
        <h4 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-[var(--gold)]" /> {t("إضافة كورس", "Add course")}</h4>
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <Input label={t("إيموجي", "Emoji")} value={form.cover_emoji} onChange={(v) => setForm({ ...form, cover_emoji: v })} />
          <Input label={t("اسم الكورس", "Course name")} value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        </div>
        <TextArea label={t("الوصف", "Description")} value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("السعر", "Price")} type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
          <Select label={t("العملة", "Currency")} value={form.currency} onChange={(v) => setForm({ ...form, currency: v })}
            options={[{ v: "EGP", l: t("جنيه", "EGP") }, { v: "SAR", l: t("ريال", "SAR") }, { v: "USD", l: t("دولار", "USD") }, { v: "AED", l: t("درهم", "AED") }]} />
        </div>
        <Select label={t("نظام الدفع", "Payment plan")} value={form.installments_count} onChange={(v) => setForm({ ...form, installments_count: v })}
          options={[{ v: "1", l: t("دفعة كاملة", "Full payment") }, { v: "2", l: t("دفعتين", "2 installments") }, { v: "3", l: t("ثلاث دفعات", "3 installments") }, { v: "4", l: t("أربع دفعات", "4 installments") }]} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("تاريخ البدء", "Start date")} type="date" value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} />
          <Input label={t("تاريخ الانتهاء", "End date")} type="date" value={form.ends_at} onChange={(v) => setForm({ ...form, ends_at: v })} />
        </div>
        <Input label={t("رابط الكورس (المنصة)", "Course link (platform)")} value={form.online_url} onChange={(v) => setForm({ ...form, online_url: v })} />
        <Input label={t("عدد ساعات الكورس", "Total hours")} type="number" value={form.total_hours} onChange={(v) => setForm({ ...form, total_hours: v })} />
        <button disabled={busy} type="submit" className="w-full h-11 rounded-xl font-semibold disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
          {busy ? "..." : t("إضافة الكورس", "Add course")}
        </button>
      </form>
    </div>
  );
}

// ============= COURSE EDITOR (chapters/items/sessions/settings) =============
function CourseEditor({ course, onClose, refresh }: { course: Course; onClose: () => void; refresh: () => void }) {
  const [section, setSection] = useState<"content" | "assignments" | "sessions" | "settings">("content");
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
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 pt-4 flex gap-1 border-b border-white/10">
          {[
            { id: "content", label: t("المحتوى والأبواب", "Content & modules"), icon: Layers },
            { id: "assignments", label: t("التكليفات", "Assignments"), icon: Layers },
            { id: "sessions", label: t("المحاضرات والمواعيد", "Sessions & schedule"), icon: Calendar },
            { id: "settings", label: t("إعدادات", "Settings"), icon: Settings2 },
          ].map((t) => (
            <button key={t.id} onClick={() => setSection(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition ${
                section === t.id ? "text-[var(--gold)] border-b-2 border-[var(--gold)] -mb-px" : "text-white/55 hover:text-white"
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {section === "content" && <CourseContent courseId={course.id} />}
          {section === "assignments" && <CourseAssignmentsAdmin courseId={course.id} />}
          {section === "sessions" && <CourseSessions courseId={course.id} />}
          {section === "settings" && <CourseSettings course={course} onSaved={() => { refresh(); }} />}
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
    const { data } = await supabase.from("course_modules").select("*").eq("course_id", courseId).order("order_index");
    const mods = data ?? [];
    setModules(mods);
    if (mods.length) {
      const ids = mods.map((m: any) => m.id);
      const { data: its } = await supabase.from("module_items").select("*").in("module_id", ids).order("order_index");
      const grouped: Record<string, any[]> = {};
      (its ?? []).forEach((it: any) => { (grouped[it.module_id] ||= []).push(it); });
      setItems(grouped);
    } else { setItems({}); }
  }
  useEffect(() => { loadModules(); }, [courseId]);

  async function addModule() {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from("course_modules").insert({
      course_id: courseId, title: newTitle, order_index: modules.length,
    });
    if (error) return toast.error(error.message);
    setNewTitle("");
    loadModules();
  }

  async function toggleComplete(m: any) {
    const { error } = await supabase.from("course_modules").update({ completed_by_admin: !m.completed_by_admin }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(!m.completed_by_admin ? t("تم وضع علامة الإكمال", "Marked as complete") : t("تم إلغاء الإكمال", "Marked as incomplete"));
    loadModules();
  }

  async function delModule(id: string) {
    if (!confirm(t("حذف الباب وكل محتوياته؟", "Delete module and all its contents?"))) return;
    await supabase.from("course_modules").delete().eq("id", id);
    loadModules();
  }

  async function updateOnlineUrl(id: string, value: string) {
    await supabase.from("course_modules").update({ online_url: value || null }).eq("id", id);
    loadModules();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex gap-2">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t("عنوان باب جديد...", "New module title...")}
          className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
        <button onClick={addModule} className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> إضافة باب
        </button>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-8">{t("لا توجد أبواب بعد.", "No modules yet.")}</p>
      ) : (
        <div className="space-y-3">
          {modules.map((m, i) => (
            <ModuleCard key={m.id} m={m} index={i} items={items[m.id] ?? []}
              onToggle={() => toggleComplete(m)} onDelete={() => delModule(m.id)}
              onChangeOnlineUrl={(url: string) => updateOnlineUrl(m.id, url)}
              onItemsChanged={loadModules} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleCard({ m, index, items, onToggle, onDelete, onChangeOnlineUrl, onItemsChanged }: any) {
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
      module_id: m.id, kind: itemKind, title: itemTitle,
      content: itemKind === "note" ? itemContent : null,
      url: itemKind !== "note" ? url : null,
      order_index: items.length,
    });
    if (error) return toast.error(error.message);
    setItemTitle(""); setItemContent(""); setItemUrl("");
    setShowAddItem(false);
    onItemsChanged();
  }

  async function delItem(id: string) {
    await supabase.from("module_items").delete().eq("id", id);
    onItemsChanged();
  }

  return (
    <div className={`rounded-2xl border ${m.completed_by_admin ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="p-4 flex items-center gap-3">
        <button onClick={() => setOpen(!open)} className="w-8 h-8 rounded-lg bg-white/5 text-[var(--gold)] font-bold text-sm flex items-center justify-center shrink-0">
          {index + 1}
        </button>
        <div className="flex-1 min-w-0">
          <h5 className="font-bold">{m.title}</h5>
          {m.online_url && <p className="text-[11px] text-[var(--gold)]/80 mt-0.5 truncate" dir="ltr">{m.online_url}</p>}
        </div>
        <button onClick={onToggle}
          className={`flex items-center gap-1 text-xs px-2.5 h-8 rounded-lg ${m.completed_by_admin ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 border border-white/15 text-white/70"}`}>
          <Check className="w-3.5 h-3.5" /> {m.completed_by_admin ? t("مكتمل", "Complete") : t("وضع علامة الإكمال", "Mark complete")}
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-300"><Trash2 className="w-4 h-4" /></button>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5">
          <div className="pt-3 flex gap-2 items-center">
            <span className="text-xs text-white/50 shrink-0">{t("رابط المحاضرة:", "Session link:")}</span>
            {editingUrl ? (
              <>
                <input value={urlVal} onChange={(e) => setUrlVal(e.target.value)} dir="ltr"
                  className="flex-1 h-9 px-2.5 rounded-lg bg-white/5 border border-white/15 text-xs" placeholder="https://meet..." />
                <button onClick={() => { onChangeOnlineUrl(urlVal); setEditingUrl(false); }} className="text-xs px-3 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">{t("حفظ", "Save")}</button>
              </>
            ) : (
              <button onClick={() => setEditingUrl(true)} className="text-xs text-white/60 hover:text-white flex items-center gap-1">
                <Pencil className="w-3 h-3" /> {m.online_url ? t("تعديل", "Edit") : t("إضافة رابط", "Add link")}
              </button>
            )}
          </div>

          {items.length > 0 && (
            <ul className="space-y-1.5">
              {items.map((it: any) => (
                <li key={it.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm">
                  {it.kind === "note" ? <StickyNote className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" /> :
                   it.kind === "link" ? <LinkIcon className="w-4 h-4 mt-0.5 text-sky-300 shrink-0" /> :
                   <Paperclip className="w-4 h-4 mt-0.5 text-emerald-300 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{it.title}</p>
                    {it.content && <p className="text-xs text-white/55 whitespace-pre-wrap mt-0.5">{it.content}</p>}
                    {it.url && (it.kind === "file" ? (
                      <button onClick={async () => {
                        const { data, error } = await supabase.storage.from("course-files").createSignedUrl(it.url, 120);
                        if (error) return toast.error(error.message);
                        window.open(data.signedUrl, "_blank", "noopener");
                      }} className="text-xs text-[var(--gold)] truncate block mt-0.5 hover:underline" dir="ltr">{it.url}</button>
                    ) : (
                      <a href={it.url} target="_blank" rel="noopener" className="text-xs text-[var(--gold)] truncate block mt-0.5" dir="ltr">{it.url}</a>
                    ))}
                  </div>
                  <button onClick={() => delItem(it.id)} className="text-rose-300/60 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                </li>
              ))}
            </ul>
          )}

          {showAddItem ? (
            <div className="rounded-xl border border-[var(--gold)]/30 bg-white/[0.03] p-3 space-y-2">
              <div className="flex gap-1">
                {(["note", "link", "file"] as const).map((k) => (
                  <button key={k} onClick={() => setItemKind(k)}
                    className={`text-xs px-2.5 h-8 rounded-lg ${itemKind === k ? "bg-[var(--gold)] text-[#0b1736] font-semibold" : "bg-white/5 text-white/60"}`}>
                    {k === "note" ? t("ملاحظة", "Note") : k === "link" ? t("رابط", "Link") : t("ملف", "File")}
                  </button>
                ))}
              </div>
              <input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder={t("العنوان", "Title")}
                className="w-full h-9 px-2.5 rounded-lg bg-white/5 border border-white/15 text-xs" />
              {itemKind === "note" && (
                <textarea value={itemContent} onChange={(e) => setItemContent(e.target.value)} placeholder={t("المحتوى", "Content")}
                  rows={3} className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/15 text-xs" />
              )}
              {itemKind === "link" && (
                <input value={itemUrl} onChange={(e) => setItemUrl(e.target.value)} placeholder="https://..." dir="ltr"
                  className="w-full h-9 px-2.5 rounded-lg bg-white/5 border border-white/15 text-xs" />
              )}
              {itemKind === "file" && (
                <input type="file" onChange={(e) => { (window as any).__pendingFile = e.target.files?.[0]; }}
                  className="block w-full text-xs file:me-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-[var(--gold)] file:text-[#0b1736] file:font-semibold file:cursor-pointer cursor-pointer" />
              )}
              <div className="flex gap-2">
                <button onClick={addItem} className="text-xs px-3 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">{t("حفظ", "Save")}</button>
                <button onClick={() => setShowAddItem(false)} className="text-xs px-3 h-8 rounded-lg bg-white/5 text-white/60">{t("إلغاء", "Cancel")}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddItem(true)} className="text-xs text-[var(--gold)] hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> إضافة بند (ملاحظة / رابط / ملف)
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
  const [form, setForm] = useState({ title: "", starts_at: "", duration_minutes: "60", online_url: "" });

  async function load() {
    const { data } = await supabase.from("course_sessions").select("*").eq("course_id", courseId).order("starts_at");
    setSessions(data ?? []);
  }
  useEffect(() => { load(); }, [courseId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.starts_at) return toast.error(t("العنوان والتاريخ مطلوبين", "Title and date are required"));
    const { error } = await supabase.from("course_sessions").insert({
      course_id: courseId, title: form.title, starts_at: new Date(form.starts_at).toISOString(),
      duration_minutes: Number(form.duration_minutes), online_url: form.online_url || null,
    });
    if (error) return toast.error(error.message);
    toast.success(t("تمت إضافة المحاضرة وإشعار المتدربين", "Session added and trainees notified"));
    setForm({ title: "", starts_at: "", duration_minutes: "60", online_url: "" });
    load();
  }

  async function del(id: string) {
    await supabase.from("course_sessions").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <Input label={t("عنوان المحاضرة", "Session title")} value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("التاريخ والوقت", "Date & time")} type="datetime-local" value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} required />
          <Input label={t("المدة (دقيقة)", "Duration (min)")} type="number" value={form.duration_minutes} onChange={(v) => setForm({ ...form, duration_minutes: v })} />
        </div>
        <Input label={t("رابط الانضمام", "Join link")} value={form.online_url} onChange={(v) => setForm({ ...form, online_url: v })} />
        <button type="submit" className="w-full h-10 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
          إضافة المحاضرة
        </button>
      </form>

      {sessions.length === 0 ? <p className="text-xs text-white/40 text-center py-6">{t("لا توجد محاضرات.", "No sessions.")}</p> :
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-[var(--gold)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-white/55">
                  {new Date(s.starts_at).toLocaleString("ar-EG")} · {s.duration_minutes}د
                </p>
                {s.online_url && <a href={s.online_url} target="_blank" rel="noopener" className="text-[11px] text-[var(--gold)] truncate block" dir="ltr">{s.online_url}</a>}
              </div>
              <button onClick={() => del(s.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
            </li>
          ))}
        </ul>
      }
    </div>
  );
}

function CourseSettings({ course, onSaved }: { course: Course; onSaved: () => void }) {
  const [f, setF] = useState({
    title: course.title, description: course.description ?? "",
    price: String(course.price ?? 0), currency: course.currency,
    starts_at: course.starts_at ?? "", ends_at: course.ends_at ?? "",
    installments_count: String(course.installments_count), online_url: course.online_url ?? "",
    cover_emoji: course.cover_emoji ?? "🎓",
    total_hours: String(course.total_hours ?? 0),
  });

  async function save() {
    const { error } = await supabase.from("courses").update({
      title: f.title, description: f.description || null,
      price: Number(f.price) || 0, currency: f.currency,
      starts_at: f.starts_at || null, ends_at: f.ends_at || null,
      installments_count: Number(f.installments_count) || 1,
      online_url: f.online_url || null, cover_emoji: f.cover_emoji || "🎓",
      total_hours: Number(f.total_hours) || 0,
    }).eq("id", course.id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحفظ", "Saved"));
    onSaved();
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[80px_1fr] gap-3">
        <Input label={t("إيموجي", "Emoji")} value={f.cover_emoji} onChange={(v) => setF({ ...f, cover_emoji: v })} />
        <Input label={t("اسم الكورس", "Course name")} value={f.title} onChange={(v) => setF({ ...f, title: v })} />
      </div>
      <TextArea label={t("الوصف", "Description")} value={f.description} onChange={(v) => setF({ ...f, description: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t("السعر", "Price")} type="number" value={f.price} onChange={(v) => setF({ ...f, price: v })} />
        <Select label={t("العملة", "Currency")} value={f.currency} onChange={(v) => setF({ ...f, currency: v })}
          options={[{ v: "EGP", l: t("جنيه", "EGP") }, { v: "SAR", l: t("ريال", "SAR") }, { v: "USD", l: t("دولار", "USD") }, { v: "AED", l: t("درهم", "AED") }]} />
      </div>
      <Select label={t("نظام الدفع", "Payment plan")} value={f.installments_count} onChange={(v) => setF({ ...f, installments_count: v })}
        options={[{ v: "1", l: t("دفعة كاملة", "Full payment") }, { v: "2", l: t("دفعتين", "2 installments") }, { v: "3", l: t("ثلاث دفعات", "3 installments") }, { v: "4", l: t("أربع دفعات", "4 installments") }]} />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t("تاريخ البدء", "Start date")} type="date" value={f.starts_at} onChange={(v) => setF({ ...f, starts_at: v })} />
        <Input label={t("تاريخ الانتهاء", "End date")} type="date" value={f.ends_at} onChange={(v) => setF({ ...f, ends_at: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label={t("رابط الكورس", "Course link")} value={f.online_url} onChange={(v) => setF({ ...f, online_url: v })} />
        <Input label={t("عدد ساعات الكورس", "Total hours")} type="number" value={f.total_hours} onChange={(v) => setF({ ...f, total_hours: v })} />
      </div>
      <button onClick={save} className="w-full h-11 rounded-xl font-semibold" style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
        حفظ التعديلات
      </button>
    </div>
  );
}

// ============= ENROLLMENT DRAWER =============
function EnrollmentDrawer({ enrollment, onClose, refresh }: { enrollment: EnrollmentRow; onClose: () => void; refresh: () => void }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [issued, setIssued] = useState(enrollment.certificate_issued);

  const courseCur = enrollment.courses?.currency ?? "EGP";
  const [payAmount, setPayAmount] = useState("");
  const [payCurr, setPayCurr] = useState(courseCur);
  const [payNote, setPayNote] = useState("");

  const [insAmount, setInsAmount] = useState("");
  const [insCurr, setInsCurr] = useState(courseCur);
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

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const rawPrice = Number(enrollment.courses?.price ?? 0);
  const discount = Number((enrollment as any).discount_amount ?? 0);
  const coursePrice = Math.max(0, rawPrice - discount);
  const fullyPaid = coursePrice > 0 && totalPaid >= coursePrice;
  const couponCode = (enrollment as any).coupon_code as string | null;

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
    toast.success(t("تم رفع الشهادة وإشعار المتدرب", "Certificate uploaded and trainee notified"));
    refresh();
  }

  async function toggleIssued() {
    const next = !issued;
    const { error } = await supabase.from("enrollments").update({ certificate_issued: next }).eq("id", enrollment.id);
    if (error) return toast.error(error.message);
    setIssued(next);
    refresh();
  }

  const [autoIssuing, setAutoIssuing] = useState(false);
  async function autoIssueCertificate() {
    const nameAr = enrollment.name_ar;
    const nameEn = enrollment.name_en;
    if (!nameAr || !nameEn) return toast.error(t("المتدرب لم يدخل اسمه بالعربي والإنجليزي بعد", "Trainee hasn't entered their name in Arabic and English yet"));
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
      };
      const [pdfAr, pdfEn] = await Promise.all([
        generateCertificatePdf({ ...common, lang: "ar", studentName: nameAr }),
        generateCertificatePdf({ ...common, lang: "en", studentName: nameEn }),
      ]);
      const ts = Date.now();
      const pathAr = `${enrollment.user_id}/${enrollment.id}-${ts}-ar.pdf`;
      const pathEn = `${enrollment.user_id}/${enrollment.id}-${ts}-en.pdf`;
      const [up1, up2] = await Promise.all([
        supabase.storage.from("certificates").upload(pathAr, pdfAr, { contentType: "application/pdf", upsert: true }),
        supabase.storage.from("certificates").upload(pathEn, pdfEn, { contentType: "application/pdf", upsert: true }),
      ]);
      if (up1.error) throw up1.error;
      if (up2.error) throw up2.error;
      const { error } = await supabase.from("enrollments").update({
        certificate_url_ar: pathAr, certificate_url_en: pathEn,
        certificate_url: pathAr, certificate_issued: true,
      }).eq("id", enrollment.id);
      if (error) throw error;
      setIssued(true);
      toast.success(t("تم إصدار الشهادة (عربي + إنجليزي) وإشعار المتدرب 🎉", "Certificate issued (Arabic + English) and trainee notified 🎉"));
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
    const { error } = await supabase.from("payments").insert({
      enrollment_id: enrollment.id, amount: Number(payAmount), currency: payCurr, note: payNote || null,
    });
    if (error) return toast.error(error.message);
    setPayAmount(""); setPayNote("");
    refreshLists();
  }
  async function autoSplitInstallments() {
    const n = enrollment.courses?.installments_count ?? 1;
    if (n <= 1 || coursePrice <= 0) return;
    const each = Math.ceil(coursePrice / n);
    const rows = Array.from({ length: n }, (_, idx) => ({
      enrollment_id: enrollment.id, amount: idx === n - 1 ? coursePrice - each * (n - 1) : each,
      currency: courseCur, due_date: null, paid: false,
    }));
    await supabase.from("installments").insert(rows);
    toast.success(t("تم إنشاء جدول الأقساط", "Installment schedule created"));
    refreshLists();
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
  }
  async function togglePaid(id: string, paid: boolean) {
    await supabase.from("installments").update({ paid: !paid, paid_at: !paid ? new Date().toISOString() : null }).eq("id", id);
    refreshLists();
  }
  async function delInst(id: string) { await supabase.from("installments").delete().eq("id", id); refreshLists(); }
  async function delPay(id: string) { await supabase.from("payments").delete().eq("id", id); refreshLists(); }

  const [blocked, setBlocked] = useState(enrollment.blocked);
  async function toggleBlocked() {
    const next = !blocked;
    const { error } = await supabase.from("enrollments").update({ blocked: next }).eq("id", enrollment.id);
    if (error) return toast.error(error.message);
    setBlocked(next);
    toast.success(next ? t("تم قفل وصول المتدرب للكورس", "Trainee access locked") : t("تم استعادة وصول المتدرب للكورس", "Trainee access restored"));
    refresh();
  }

  // Account-level block (locks the trainee out of the whole platform)
  const [accountBlocked, setAccountBlocked] = useState(false);
  useEffect(() => {
    supabase.from("profiles").select("account_blocked").eq("id", enrollment.user_id).maybeSingle()
      .then(({ data }) => setAccountBlocked(Boolean((data as any)?.account_blocked)));
  }, [enrollment.user_id]);
  async function toggleAccountBlocked() {
    const next = !accountBlocked;
    const msg = next
      ? t("إيقاف حساب المتدرب من الدخول للمنصة بالكامل؟ سيتم إنهاء جلسته فوراً.", "Suspend this trainee's access to the entire platform? Their session will end immediately.")
      : t("إعادة تفعيل حساب المتدرب؟", "Reactivate trainee account?");
    if (!confirm(msg)) return;
    const { error } = await supabase.from("profiles").update({ account_blocked: next } as any).eq("id", enrollment.user_id);
    if (error) return toast.error(error.message);
    setAccountBlocked(next);
    toast.success(next ? t("تم إيقاف حساب المتدرب", "Trainee account suspended") : t("تم إعادة تفعيل الحساب", "Account reactivated"));
  }

  async function removeEnrollment() {
    if (!confirm(t("حذف هذا المتدرب من الكورس نهائياً؟ سيتم حذف كل بيانات الالتحاق والمدفوعات.", "Permanently remove this trainee from the course? All enrollment and payment data will be deleted."))) return;
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
            <h3 className="text-lg font-bold">{enrollment.profiles?.full_name || enrollment.profiles?.email}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-7">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-white/50">{t("البريد", "Email")}</span><span dir="ltr">{enrollment.profiles?.email}</span></div>
            <div className="flex justify-between"><span className="text-white/50">{t("الهاتف", "Phone")}</span><span dir="ltr">{enrollment.profiles?.phone || "—"}</span></div>
            <div className="flex justify-between items-center"><span className="text-white/50">{t("الحالة", "Status")}</span><StatusPill status={enrollment.status} /></div>
            {blocked && <div className="flex justify-between items-center"><span className="text-white/50">{t("الوصول", "Access")}</span><span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">{t("محظور مؤقتاً", "Temporarily blocked")}</span></div>}
            <div className="flex justify-between"><span className="text-white/50">{t("سعر الكورس", "Course price")}</span>
              <span className="text-[var(--gold)] font-semibold">
                {discount > 0 && <span className="text-white/40 line-through me-2 text-xs">{rawPrice.toLocaleString()}</span>}
                {coursePrice.toLocaleString()} {courseCur}
              </span>
            </div>
            {couponCode && (
              <div className="flex justify-between"><span className="text-white/50">{t("كوبون مطبّق", "Coupon applied")}</span>
                <span className="text-emerald-300 font-mono text-xs">{couponCode} (−{discount.toLocaleString()} {courseCur})</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-white/50">{t("المدفوع", "Paid")}</span>
              <span className={fullyPaid ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                {totalPaid.toLocaleString()} {courseCur} {fullyPaid && t("✓ مكتمل الدفع", "✓ Fully paid")}
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
            <div className="flex justify-between"><span className="text-white/50">{t("نظام الدفع", "Payment plan")}</span>
              <span>{enrollment.courses?.installments_count === 1 ? t("دفعة كاملة", "Full payment") : `${enrollment.courses?.installments_count} ${t(`أقساط`, `installments`)}`}</span>
            </div>
            {accountBlocked && (
              <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-rose-500/20">
                <span className="text-rose-300">{t("حالة الحساب", "Account status")}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">{t("⛔ موقوف من المنصة", "⛔ Suspended from platform")}</span>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-rose-300/20 bg-rose-300/5 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onClick={toggleBlocked} className={`h-10 rounded-lg text-xs font-semibold ${blocked ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"}`}>
              {blocked ? t("↩ إلغاء قفل الكورس", "↩ Unlock course") : t("⏸ قفل الوصول لهذا الكورس", "⏸ Lock access to this course")}
            </button>
            <button onClick={toggleAccountBlocked} className={`h-10 rounded-lg text-xs font-semibold ${accountBlocked ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}>
              {accountBlocked ? t("✓ إعادة تفعيل الحساب", "✓ Reactivate account") : t("⛔ إيقاف الحساب من المنصة", "⛔ Suspend account from platform")}
            </button>
            <button onClick={removeEnrollment} className="sm:col-span-2 h-10 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              🗑 حذف المتدرب من هذا الكورس نهائياً
            </button>
          </section>

          <section>
            <h4 className="font-bold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-[var(--gold)]" /> {t("الشهادة", "Certificate")}</h4>
            {!fullyPaid && coursePrice > 0 && (
              <div className="text-xs text-amber-200/80 bg-amber-300/5 border border-amber-300/15 rounded-lg p-3 mb-3">
                💡 يفضّل اكتمال الدفع قبل إصدار الشهادة. المتبقي: {(coursePrice - totalPaid).toLocaleString()} {courseCur}
              </div>
            )}
            <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4 space-y-3 mb-3">
              {enrollment.certificate_requested_at && !issued && (
                <p className="text-xs text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {t("المتدرب طلب الشهادة في", "Trainee requested certificate on")} {new Date(enrollment.certificate_requested_at).toLocaleString("ar-EG")}
                </p>
              )}
              <div className="text-xs space-y-1 text-white/80">
                <div className="flex justify-between"><span className="text-white/50">{t("الاسم (عربي):", "Name (Arabic):")}</span><span className="font-semibold">{enrollment.name_ar || t("— لم يُدخل بعد", "— not set")}</span></div>
                <div className="flex justify-between"><span className="text-white/50">{t("الاسم (إنجليزي):", "Name (English):")}</span><span className="font-semibold" dir="ltr">{enrollment.name_en || "— not set"}</span></div>
              </div>
              <button onClick={autoIssueCertificate} disabled={autoIssuing || !enrollment.name_ar || !enrollment.name_en}
                className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
                {autoIssuing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("جاري التوليد...", "Generating...")}</> : <><Sparkles className="w-4 h-4" /> {t("إصدار الشهادة تلقائياً (عربي + إنجليزي)", "Issue certificate automatically (Arabic + English)")}</>}
              </button>
              {(enrollment.certificate_url_ar || enrollment.certificate_url_en) && (
                <p className="text-xs text-emerald-300 text-center">{t("✓ تم إصدار الشهادة بنجاح", "✓ Certificate issued successfully")}</p>
              )}
            </div>
            <details className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <summary className="text-xs text-white/50 cursor-pointer">{t("رفع ملف يدوي (اختياري)", "Upload file manually (optional)")}</summary>
              <label className="block mt-3">
                <span className="text-xs text-white/60 mb-2 block">{t("رفع ملف الشهادة (PDF / صورة)", "Upload certificate file (PDF / image)")}</span>
                <input type="file" accept=".pdf,image/*"
                  onChange={(e) => e.target.files?.[0] && uploadCert(e.target.files[0])}
                  className="block w-full text-xs file:me-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-[var(--gold)] file:text-[#0b1736] file:font-semibold file:cursor-pointer cursor-pointer" />
              </label>
              {uploading && <p className="text-xs text-amber-300 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> {t("جاري الرفع...", "Uploading...")}</p>}
              <button onClick={toggleIssued} disabled={!enrollment.certificate_url}
                className={`w-full h-10 rounded-lg text-xs font-semibold transition ${
                  issued ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 border border-white/15 text-white/70"
                } disabled:opacity-50`}>
                {issued ? t("✓ الشهادة مُصدرة للمتدرب", "✓ Certificate issued to trainee") : t("تفعيل إصدار الشهادة", "Enable certificate issuance")}
              </button>
            </details>
          </section>

          <section>
            <h4 className="font-bold mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-[var(--gold)]" /> {t("المدفوعات", "Payments")}</h4>
            <form onSubmit={addPayment} className="rounded-2xl border border-white/10 bg-white/5 p-4 grid grid-cols-[1fr_110px_auto] gap-2 items-end mb-3">
              <Input label={t("المبلغ", "Amount")} type="number" value={payAmount} onChange={setPayAmount} />
              <Select label={t("العملة", "Currency")} value={payCurr} onChange={setPayCurr}
                options={[{ v: "EGP", l: t("جنيه", "EGP") }, { v: "SAR", l: t("ريال", "SAR") }, { v: "USD", l: t("دولار", "USD") }, { v: "AED", l: t("درهم", "AED") }]} />
              <button type="submit" className="h-11 px-4 rounded-xl font-semibold" style={{ background: "var(--gold)", color: "#0b1736" }}>{t("إضافة", "Add")}</button>
              <div className="col-span-3"><Input label={t("ملاحظة (اختياري)", "Note (optional)")} value={payNote} onChange={setPayNote} /></div>
            </form>
            <ul className="space-y-1.5">
              {payments.length === 0 ? <li className="text-xs text-white/40">{t("لا توجد مدفوعات", "No payments")}</li> :
                payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/10 gap-3">
                    <span className="font-semibold">{Number(p.amount).toLocaleString()} {p.currency}</span>
                    <span className="text-xs text-white/50 flex-1 truncate">{p.note}</span>
                    <span className="text-xs text-white/40">{new Date(p.paid_at).toLocaleDateString("ar-EG")}</span>
                    <button onClick={() => delPay(p.id)} className="text-rose-300/70 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--gold)]" /> {t("الأقساط", "Installments")}</h4>
              {installments.length === 0 && (enrollment.courses?.installments_count ?? 1) > 1 && coursePrice > 0 && (
                <button onClick={autoSplitInstallments} className="text-[11px] px-3 h-8 rounded-lg bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">
                  ⚡ توليد جدول تلقائي ({enrollment.courses?.installments_count} أقساط)
                </button>
              )}
            </div>
            <form onSubmit={addInstallment} className="rounded-2xl border border-white/10 bg-white/5 p-4 grid grid-cols-[1fr_110px_140px_auto] gap-2 items-end mb-3">
              <Input label={t("المبلغ", "Amount")} type="number" value={insAmount} onChange={setInsAmount} />
              <Select label={t("العملة", "Currency")} value={insCurr} onChange={setInsCurr}
                options={[{ v: "EGP", l: t("جنيه", "EGP") }, { v: "SAR", l: t("ريال", "SAR") }, { v: "USD", l: t("دولار", "USD") }, { v: "AED", l: t("درهم", "AED") }]} />
              <Input label={t("تاريخ الاستحقاق", "Due date")} type="date" value={insDate} onChange={setInsDate} />
              <button type="submit" className="h-11 px-4 rounded-xl font-semibold" style={{ background: "var(--gold)", color: "#0b1736" }}>{t("إضافة", "Add")}</button>
            </form>
            <ul className="space-y-1.5">
              {installments.length === 0 ? <li className="text-xs text-white/40">{t("لا توجد أقساط", "No installments")}</li> :
                installments.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/10 gap-3">
                    <span className="font-semibold">{Number(i.amount).toLocaleString()} {i.currency}</span>
                    <span className="text-xs text-white/50">{i.due_date || "—"}</span>
                    <button onClick={() => togglePaid(i.id, i.paid)} className={`text-xs px-2 py-1 rounded-md ${i.paid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {i.paid ? t("مدفوع", "Paid") : t("مستحق", "Due")}
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

  async function load() {
    const [mRes, aRes] = await Promise.all([
      supabase.from("course_modules").select("id,title").eq("course_id", courseId).order("order_index"),
      supabase.from("assignments").select("*").eq("course_id", courseId).order("created_at"),
    ]);
    setModules(mRes.data ?? []);
    const a = aRes.data ?? [];
    setAssignments(a);
    if (a.length) {
      const sRes = await supabase.from("assignment_submissions").select("*").in("assignment_id", a.map((x: any) => x.id));
      const sList = sRes.data ?? [];
      setSubs(sList);
      const ids = Array.from(new Set(sList.map((s: any) => s.user_id)));
      if (ids.length) {
        const pRes = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        const map: Record<string, any> = {};
        (pRes.data ?? []).forEach((p: any) => { map[p.id] = p; });
        setProfiles(map);
      }
    } else { setSubs([]); setProfiles({}); }
  }
  useEffect(() => { load(); }, [courseId]);

  async function addAssignment() {
    if (!moduleId || !title.trim()) return toast.error(t("اختر باب وأدخل عنوان", "Select a module and enter a title"));
    const { error } = await supabase.from("assignments").insert({
      course_id: courseId, module_id: moduleId, title, instructions: instructions || null,
      due_date: due ? new Date(due).toISOString() : null, max_score: maxScore,
    });
    if (error) return toast.error(error.message);
    toast.success(t("تم إنشاء التكليف", "Assignment created"));
    setTitle(""); setInstructions(""); setDue(""); setMaxScore(100);
    load();
  }

  async function delAssignment(id: string) {
    if (!confirm(t("حذف التكليف وكل تسليماته؟", "Delete assignment and all its submissions?"))) return;
    await supabase.from("assignments").delete().eq("id", id);
    load();
  }

  async function gradeSubmission(subId: string, score: number, feedback: string) {
    const { error } = await supabase.from("assignment_submissions")
      .update({ score, feedback: feedback || null, graded_at: new Date().toISOString() })
      .eq("id", subId);
    if (error) return toast.error(error.message);
    toast.success(t("تم التقييم", "Graded"));
    load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
        <p className="text-xs text-white/60 font-semibold">{t("إنشاء تكليف جديد", "Create new assignment")}</p>
        <select value={moduleId} onChange={(e) => setModuleId(e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm">
          <option value="">{t("— اختر الباب —", "— Select module —")}</option>
          {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("عنوان التكليف", "Assignment title")}
          className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm" />
        <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder={t("تعليمات / وصف", "Instructions / description")}
          rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm" />
        <div className="flex gap-2">
          <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm" />
          <input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))}
            placeholder={t("درجة قصوى", "Max score")} className="w-28 h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm" />
          <button onClick={addAssignment} className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm">
            <Plus className="w-4 h-4 inline" /> إضافة
          </button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-6">{t("لا توجد تكليفات بعد.", "No assignments yet.")}</p>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const aSubs = subs.filter((s) => s.assignment_id === a.id);
            return (
              <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold">{a.title}</h5>
                    {a.instructions && <p className="text-xs text-white/55 mt-1 whitespace-pre-wrap">{a.instructions}</p>}
                    <p className="text-[11px] text-white/45 mt-1">
                      {a.due_date ? `تسليم: ${new Date(a.due_date).toLocaleString("ar-EG")}` : t("بدون موعد", "No due date")} · درجة قصوى {a.max_score}
                    </p>
                  </div>
                  <button onClick={() => delAssignment(a.id)} className="text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 border-t border-white/5 pt-3">
                  <p className="text-[11px] text-white/50 mb-2">التسليمات ({aSubs.length})</p>
                  {aSubs.length === 0 ? <p className="text-[11px] text-white/40">{t("لم يسلّم أي متدرب بعد.", "No trainee has submitted yet.")}</p> : (
                    <div className="space-y-2">
                      {aSubs.map((s) => (
                        <SubmissionRow key={s.id} s={s} maxScore={a.max_score}
                          profile={profiles[s.user_id]} onGrade={gradeSubmission} />
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

function SubmissionRow({ s, maxScore, profile, onGrade }: { s: any; maxScore: number; profile: any; onGrade: (id: string, score: number, fb: string) => void }) {
  const [score, setScore] = useState<string>(s.score?.toString() ?? "");
  const [fb, setFb] = useState<string>(s.feedback ?? "");
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">{profile?.full_name || profile?.email || s.user_id.slice(0, 8)}</p>
          <p className="text-[10px] text-white/45 mt-0.5">{new Date(s.submitted_at).toLocaleString("ar-EG")}</p>
        </div>
        {s.score !== null && <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">مُقيّم: {s.score}/{maxScore}</span>}
      </div>
      {s.content && <p className="text-xs text-white/75 mt-2 whitespace-pre-wrap p-2 bg-white/5 rounded">{s.content}</p>}
      {s.link && <a href={s.link} target="_blank" rel="noopener" className="text-xs text-[var(--gold)] hover:underline block mt-1 truncate" dir="ltr">{s.link}</a>}
      <div className="flex gap-2 mt-2">
        <input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder={`/${maxScore}`}
          className="w-20 h-8 px-2 rounded bg-white/5 border border-white/15 text-xs" />
        <input value={fb} onChange={(e) => setFb(e.target.value)} placeholder={t("ملاحظات", "Feedback")}
          className="flex-1 h-8 px-2 rounded bg-white/5 border border-white/15 text-xs" />
        <button onClick={() => { const n = Number(score); if (!isNaN(n)) onGrade(s.id, n, fb); }}
          className="px-3 h-8 rounded bg-[var(--gold)] text-[#0b1736] text-xs font-semibold">
          حفظ
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
  useEffect(() => { load(); }, []);

  async function toggleActive(c: CouponRow) {
    const { error } = await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  }
  async function remove(id: string) {
    if (!confirm(t("هل أنت متأكد من حذف هذا الكوبون؟", "Are you sure you want to delete this coupon?"))) return;
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
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] text-sm font-semibold">
          <Plus className="w-4 h-4" /> كوبون جديد
        </button>
      </div>

      {loading ? (
        <p className="text-white/50 text-sm">{t("جاري التحميل...", "Loading...")}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">
          لا توجد كوبونات بعد. أنشئ كوبوناً جديداً للبدء.
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
                      {c.discount_type === "percent" ? `${c.discount_value}%` : `${c.discount_value} EGP`}
                    </td>
                    <td className="p-3 text-xs text-white/70">{course?.title ?? t("جميع الكورسات", "All courses")}</td>
                    <td className="p-3 text-xs">
                      {c.used_count} / {c.max_uses ?? "∞"}
                    </td>
                    <td className="p-3 text-xs text-white/60">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString("ar-EG") : "—"}
                    </td>
                    <td className="p-3">
                      {!c.active ? (
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60">{t("معطّل", "Disabled")}</span>
                      ) : expired ? (
                        <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300">{t("منتهي", "Expired")}</span>
                      ) : exhausted ? (
                        <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300">{t("مستنفد", "Exhausted")}</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">{t("نشط", "Active")}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => toggleActive(c)}
                          className="p-2 rounded hover:bg-white/10" title={c.active ? t("إيقاف", "Disable") : t("تفعيل", "Enable")}>
                          {c.active ? <ToggleRight className="w-4 h-4 text-emerald-300" /> : <ToggleLeft className="w-4 h-4 text-white/50" />}
                        </button>
                        <button onClick={() => remove(c.id)} className="p-2 rounded hover:bg-red-500/20 text-red-300">
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

      {showNew && <NewCouponModal courses={courses} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />}
    </div>
  );
}

function NewCouponModal({ courses, onClose, onSaved }: { courses: Course[]; onClose: () => void; onSaved: () => void }) {
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
    if (isNaN(val) || val <= 0) return toast.error(t("قيمة خصم غير صحيحة", "Invalid discount value"));
    if (discountType === "percent" && val > 100) return toast.error(t("النسبة يجب ألا تتجاوز 100%", "Percentage must not exceed 100%"));
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
    if (error) return toast.error(error.message.includes("duplicate") ? t("هذا الكود مستخدم بالفعل", "This code is already in use") : error.message);
    toast.success(t("تم إنشاء الكوبون", "Coupon created"));
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0b1736] border border-white/15 rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2"><Ticket className="w-5 h-5 text-[var(--gold)]" /> {t("كوبون خصم جديد", "New discount coupon")}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="text-xs text-white/60 block mb-1">{t("الكود", "Code")}</label>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER25"
            className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 font-mono uppercase tracking-wider" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/60 block mb-1">{t("نوع الخصم", "Discount type")}</label>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15">
              <option value="percent">{t("نسبة مئوية %", "Percentage %")}</option>
              <option value="fixed">{t("مبلغ ثابت EGP", "Fixed amount EGP")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">{t("القيمة", "Value")}</label>
            <div className="relative">
              <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full h-10 px-3 pr-9 rounded-lg bg-white/5 border border-white/15" />
              <Percent className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-white/60 block mb-1">{t("الكورس (اختياري)", "Course (optional)")}</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15">
            <option value="">{t("جميع الكورسات", "All courses")}</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/60 block mb-1">{t("حد الاستخدام (اختياري)", "Usage limit (optional)")}</label>
            <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder={t("غير محدود", "Unlimited")}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15" />
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">{t("تاريخ الانتهاء (اختياري)", "End date (optional)")}</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15" />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/60 block mb-1">{t("ملاحظة داخلية (اختياري)", "Internal note (optional)")}</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("مثال: حملة الصيف", "e.g. Summer campaign")}
            className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15" />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-lg bg-white/5 border border-white/15 text-sm">{t("إلغاء", "Cancel")}</button>
          <button onClick={save} disabled={saving}
            className="flex-1 h-11 rounded-lg bg-[var(--gold)] text-[#0b1736] text-sm font-semibold disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t("إنشاء الكوبون", "Create coupon")}
          </button>
        </div>
      </div>
    </div>
  );
}

