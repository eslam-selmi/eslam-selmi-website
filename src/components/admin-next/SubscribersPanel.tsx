import { useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, ArrowRight, Search, Mail, Phone, Globe, MessageCircle, Loader2, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

type Prof = {
  id: string; full_name: string | null; email: string | null; phone: string | null; country: string | null;
  avatar_url: string | null; account_blocked: boolean; activation_status: string; created_at: string; activated_at: string | null;
};
type Enr = { id: string; user_id: string; course_id: string; status: string; certificate_issued: boolean; blocked: boolean; created_at: string; courses: { title: string | null } | null };
type Mod = { course_id: string; completed_by_admin: boolean | null };
type Inst = { enrollment_id: string; amount: number; paid: boolean; due_date: string | null; currency: string };

const sc = (s: string) =>
  s === "approved" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
  : s === "rejected" ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
  : "bg-amber-400/20 text-amber-700 dark:text-amber-200";

export function SubscribersPanel() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const t = (a: string, b: string) => (isAr ? a : b);
  const [profiles, setProfiles] = useState<Prof[]>([]);
  const [enrs, setEnrs] = useState<Enr[]>([]);
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [insts, setInsts] = useState<Inst[]>([]);
  const [fCourse, setFCourse] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fAcct, setFAcct] = useState("all");
  const [fPay, setFPay] = useState("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [openId, setOpenIdRaw] = useState<string | null>(null);
  const setOpenId = (v: string | null) => { setOpenIdRaw(v); requestAnimationFrame(() => window.scrollTo({ top: 0 })); };

  useEffect(() => {
    (async () => {
      const [p, e, m, ins] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,phone,country,avatar_url,account_blocked,activation_status,created_at,activated_at").order("created_at", { ascending: false }).limit(2000),
        supabase.from("enrollments").select("id,user_id,course_id,status,certificate_issued,blocked,created_at,courses(title)").order("created_at", { ascending: false }).limit(5000),
        supabase.from("course_modules").select("course_id,completed_by_admin").limit(5000),
        supabase.from("installments").select("enrollment_id,amount,paid,due_date,currency").limit(10000),
      ]);
      setInsts((ins.data as Inst[]) ?? []);
      setProfiles((p.data as Prof[]) ?? []);
      setEnrs((e.data as unknown as Enr[]) ?? []);
      setMods((m.data as Mod[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const toggleAccount = async (p: Prof) => {
    const next = !p.account_blocked;
    const name = p.full_name || p.email || "";
    const msg = next
      ? t(`إيقاف حساب «${name}» بالكامل؟\nلن يستطيع الدخول للمنصة، وتنتهي جلسته عند فتح الصفحة التالية. تنبيه: الإيقاف يُطبَّق حاليًا من واجهة المنصة فقط، والحماية على مستوى الخادم لسه غير مفعّلة. لا يتم حذف أي بيانات أو اشتراكات، ويمكنك إعادة التفعيل في أي وقت.`, `Suspend the whole account of "${name}"?\nThey will not be able to use the platform and their session ends on the next page load. Note: this is currently enforced by the app UI only; server-side enforcement is not active yet. No data or enrollments are deleted, and you can reactivate at any time.`)
      : t(`إعادة تفعيل حساب «${name}»؟`, `Reactivate the account of "${name}"?`);
    if (!window.confirm(msg)) return;
    const { data, error } = await supabase.from("profiles").update({ account_blocked: next }).eq("id", p.id).select("id,account_blocked");
    if (error || !data?.length || data[0].account_blocked !== next) { toast.error(error?.message ?? t("لم يتم الحفظ", "Not saved")); return; }
    setProfiles((a) => a.map((x) => (x.id === p.id ? { ...x, account_blocked: next } : x)));
    toast.success(next ? t("تم إيقاف الحساب", "Account suspended") : t("تمت إعادة تفعيل الحساب", "Account reactivated"));
  };
  const toggleCourse = async (e: Enr) => {
    const next = !e.blocked;
    const msg = next
      ? t(`إيقاف الوصول لكورس «${e.courses?.title}» فقط؟\nباقي الكورسات والحساب لا يتأثرون، ولا يتم حذف أي سجل. يمكنك إعادة الفتح في أي وقت.`, `Suspend access to "${e.courses?.title}" only?\nTheir other courses and the account are not affected and no record is deleted. You can restore it at any time.`)
      : t(`إعادة فتح الوصول لكورس «${e.courses?.title}»؟`, `Restore access to "${e.courses?.title}"?`);
    if (!window.confirm(msg)) return;
    const { data, error } = await supabase.from("enrollments").update({ blocked: next }).eq("id", e.id).select("id,blocked");
    if (error || !data?.length || data[0].blocked !== next) { toast.error(error?.message ?? t("لم يتم الحفظ", "Not saved")); return; }
    setEnrs((a) => a.map((x) => (x.id === e.id ? { ...x, blocked: next } : x)));
    toast.success(next ? t("تم إيقاف الوصول للكورس", "Course access suspended") : t("تمت إعادة فتح الكورس", "Course access restored"));
  };

  const byUser = useMemo(() => {
    const m = new Map<string, Enr[]>();
    for (const e of enrs) m.set(e.user_id, [...(m.get(e.user_id) ?? []), e]);
    return m;
  }, [enrs]);
  const units = useMemo(() => {
    const m = new Map<string, { done: number; total: number }>();
    for (const x of mods) {
      const c = m.get(x.course_id) ?? { done: 0, total: 0 };
      c.total++; if (x.completed_by_admin) c.done++;
      m.set(x.course_id, c);
    }
    return m;
  }, [mods]);

  const instByEnr = useMemo(() => {
    const m = new Map<string, Inst[]>();
    for (const i of insts) m.set(i.enrollment_id, [...(m.get(i.enrollment_id) ?? []), i]);
    return m;
  }, [insts]);
  const today = new Date().toISOString().slice(0, 10);
  // Recorded dues only: unpaid installment rows. No installment rows = "not recorded", never "paid" or "zero".
  const payState = (uid: string) => {
    const es = byUser.get(uid) ?? [];
    const all = es.flatMap((e) => instByEnr.get(e.id) ?? []);
    const unpaid = all.filter((i) => !i.paid);
    const overdue = unpaid.filter((i) => i.due_date && i.due_date.slice(0, 10) < today);
    return { recorded: all.length > 0, unpaid, overdue, owed: unpaid.reduce((n, i) => n + Number(i.amount), 0), cur: unpaid[0]?.currency ?? "" };
  };
  const courseOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of enrs) if (e.courses?.title) m.set(e.course_id, e.courses.title);
    return [...m.entries()];
  }, [enrs]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return profiles.filter((p) => {
      const es = byUser.get(p.id) ?? [];
      const ce = fCourse === "all" ? es : es.filter((e) => e.course_id === fCourse);
      if (fCourse !== "all" && ce.length === 0) return false;
      if (fStatus === "none" && es.length > 0) return false;
      if (["approved", "pending", "rejected"].includes(fStatus) && !ce.some((e) => e.status === fStatus)) return false;
      if (fAcct === "blocked" && !p.account_blocked) return false;
      if (fAcct === "active" && p.account_blocked) return false;
      if (fAcct === "course_blocked" && !es.some((e) => e.blocked)) return false;
      if (fFrom && p.created_at.slice(0, 10) < fFrom) return false;
      if (fTo && p.created_at.slice(0, 10) > fTo) return false;
      if (fPay !== "all") {
        const ps = payState(p.id);
        if (fPay === "owing" && ps.unpaid.length === 0) return false;
        if (fPay === "overdue" && ps.overdue.length === 0) return false;
        if (fPay === "clear" && !(ps.recorded && ps.unpaid.length === 0)) return false;
        if (fPay === "unrecorded" && !(es.some((e) => e.status === "approved") && !ps.recorded)) return false;
      }
      if (!s) return true;
      return [p.full_name, p.email, p.phone, p.country, ...es.map((e) => e.courses?.title)].some((v) => (v ?? "").toLowerCase().includes(s));
    });
  }, [profiles, byUser, q, fCourse, fStatus, fAcct, fPay, fFrom, fTo, instByEnr]);
  const anyFilter = fCourse !== "all" || fStatus !== "all" || fAcct !== "all" || fPay !== "all" || !!fFrom || !!fTo || !!q;
  const resetFilters = () => { setFCourse("all"); setFStatus("all"); setFAcct("all"); setFPay("all"); setFFrom(""); setFTo(""); setQ(""); };

  const statusLabel = (s: string) => (s === "approved" ? t("مقبول", "Approved") : s === "rejected" ? t("مرفوض", "Rejected") : t("قيد المراجعة", "Pending"));
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { dateStyle: "medium" }) : "—");

  if (openId) {
    const p = profiles.find((x) => x.id === openId);
    if (p) return <SubscriberDetail p={p} enrs={byUser.get(p.id) ?? []} units={units} onBack={() => setOpenId(null)} onAccount={() => toggleAccount(p)} onCourse={toggleCourse} t={t} fmt={fmt} statusLabel={statusLabel} />;
  }


  return (
    <section className="space-y-4" aria-label={t("المشتركون", "Subscribers")}>
      <div className="nx-card p-5 sm:p-6">
        <p className="text-sm font-semibold">
          {loading ? "…" : t(`${rows.length} من ${profiles.length} مشترك`, `${rows.length} of ${profiles.length} subscribers`)}
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <label className="relative flex-1">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 opacity-50" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="nx-input w-full h-11 ps-10 pe-3 rounded-xl" placeholder={t("ابحث بالاسم أو البريد أو الهاتف أو الكورس", "Search name, email, phone or course")} />
          </label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-[11px] font-semibold opacity-80 space-y-1"><span>{t("الكورس", "Course")}</span>
            <select value={fCourse} onChange={(e) => setFCourse(e.target.value)} className="nx-input h-10 rounded-xl px-3 text-sm w-full">
              <option value="all">{t("كل الكورسات", "All courses")}</option>
              {courseOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
            </select></label>
          <label className="text-[11px] font-semibold opacity-80 space-y-1"><span>{t("حالة الاشتراك", "Enrollment status")}</span>
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="nx-input h-10 rounded-xl px-3 text-sm w-full">
              <option value="all">{t("الكل", "All")}</option>
              <option value="approved">{t("مقبول", "Approved")}</option>
              <option value="pending">{t("قيد المراجعة", "Pending")}</option>
              <option value="rejected">{t("مرفوض", "Rejected")}</option>
              <option value="none">{t("بدون اشتراك", "No enrollment")}</option>
            </select></label>
          <label className="text-[11px] font-semibold opacity-80 space-y-1"><span>{t("الحساب والوصول", "Account and access")}</span>
            <select value={fAcct} onChange={(e) => setFAcct(e.target.value)} className="nx-input h-10 rounded-xl px-3 text-sm w-full">
              <option value="all">{t("الكل", "All")}</option>
              <option value="active">{t("حساب نشط", "Active account")}</option>
              <option value="blocked">{t("حساب موقوف", "Suspended account")}</option>
              <option value="course_blocked">{t("وصول كورس موقوف", "A course suspended")}</option>
            </select></label>
          <label className="text-[11px] font-semibold opacity-80 space-y-1"><span>{t("المستحقات (حسب الأقساط المسجّلة)", "Dues (recorded installments)")}</span>
            <select value={fPay} onChange={(e) => setFPay(e.target.value)} className="nx-input h-10 rounded-xl px-3 text-sm w-full">
              <option value="all">{t("الكل", "All")}</option>
              <option value="owing">{t("عليه أقساط غير مسددة", "Has unpaid installments")}</option>
              <option value="overdue">{t("أقساط متأخرة (تاريخها فات)", "Overdue installments")}</option>
              <option value="clear">{t("كل الأقساط المسجّلة مسددة", "All recorded installments paid")}</option>
              <option value="unrecorded">{t("اشتراك مقبول بدون أقساط مسجّلة", "Approved, no installments recorded")}</option>
            </select></label>
          <label className="text-[11px] font-semibold opacity-80 space-y-1"><span>{t("انضم من", "Joined from")}</span>
            <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="nx-input h-10 rounded-xl px-3 text-sm w-full" /></label>
          <label className="text-[11px] font-semibold opacity-80 space-y-1"><span>{t("انضم حتى", "Joined to")}</span>
            <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="nx-input h-10 rounded-xl px-3 text-sm w-full" /></label>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <span />
          {anyFilter && <button type="button" onClick={resetFilters} className="underline opacity-80 hover:opacity-100">{t("مسح الفلاتر", "Clear filters")}</button>}
        </div>
        <p className="mt-2 text-[11px] opacity-60">{t("المستحقات تعتمد على جدول الأقساط المسجّل فقط. غياب الدفع أو غياب الأقساط لا يعني مديونية.", "Dues use recorded installments only. A missing payment or missing installments is not treated as debt.")}</p>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="nx-card p-8 text-center text-sm opacity-70">{t("لا يوجد مشتركون مطابقون", "No matching subscribers")}</div>
      ) : (
        <div className="nx-card overflow-hidden p-0">
          <div className="hidden lg:grid sub-cols px-5 py-3 text-[11px] font-bold uppercase tracking-wide opacity-60 border-b border-current/10">
            <span>{t("المشترك", "Subscriber")}</span>
            <span>{t("التواصل", "Contact")}</span>
            <span>{t("الكورسات", "Courses")}</span>
            <span>{t("الحالة", "Status")}</span>
            <span>{t("تاريخ الانضمام", "Joined")}</span>
            <span className="text-end">{t("إجراء", "Action")}</span>
          </div>
          <ul className="divide-y divide-current/10">
            {rows.map((p) => {
              const es = (byUser.get(p.id) ?? []).slice(0, 3);
              const more = (byUser.get(p.id) ?? []).length - es.length;
              return (
                <li key={p.id}>
                  <div role="button" tabIndex={0} onKeyDown={(ev) => { if (ev.key === "Enter") setOpenId(p.id); }} onClick={() => setOpenId(p.id)} className="cursor-pointer w-full px-4 sm:px-5 py-3.5 text-start grid sub-cols items-center gap-x-4 gap-y-2 hover:bg-black/[.03] dark:hover:bg-white/[.04] transition">
                    <span className="flex items-center gap-3 min-w-0">
                      <Avatar p={p} />
                      <span className="min-w-0">
                        <span className="block font-bold truncate">{p.full_name || t("بدون اسم", "No name")}</span>
                        {(() => { const ps = payState(p.id); return ps.unpaid.length > 0 ? <span className={`inline-block me-1 mt-0.5 text-[10px] px-2 py-0.5 rounded-md ${ps.overdue.length ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" : "bg-amber-400/20 text-amber-700 dark:text-amber-200"}`}>{ps.overdue.length ? t("متأخر", "Overdue") : t("أقساط مستحقة", "Dues")} · {ps.owed.toLocaleString()} {ps.cur}</span> : null; })()}
                        {p.account_blocked && <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300">{t("موقوف", "Blocked")}</span>}
                      </span>
                    </span>
                    <span className="min-w-0 text-xs leading-5">
                      <span className="block truncate opacity-90" dir="ltr" style={{ textAlign: "start" }}>{p.email || "—"}</span>
                      <span className="block truncate opacity-60" dir="ltr" style={{ textAlign: "start" }}>{[p.phone, p.country].filter(Boolean).join(" · ") || "—"}</span>
                    </span>
                    <span className="min-w-0 text-xs">
                      {es.length === 0 ? <span className="opacity-50">—</span> : es.map((e) => <span key={e.id} className="block h-6 leading-6 truncate">{e.courses?.title}</span>)}
                      {more > 0 && <span className="block text-[11px] opacity-60">+{more}</span>}
                    </span>
                    <span className="text-xs">
                      {es.length === 0 ? <span className="opacity-60">{t("بدون اشتراك", "No enrollment")}</span> : es.map((e) => <span key={e.id} className="flex h-6 items-center"><span className={`px-2 py-0.5 rounded-md text-[10px] ${sc(e.status)}`}>{statusLabel(e.status)}</span></span>)}
                    </span>
                    <span className="text-xs opacity-70 whitespace-nowrap">{fmt(p.created_at)}</span>
                    <button type="button" disabled={!p.account_blocked} onClick={(ev) => { ev.stopPropagation(); toggleAccount(p); }} title={p.account_blocked ? t("إعادة تفعيل الحساب", "Reactivate account") : t("إيقاف الحساب بالكامل غير مفعّل بعد: الحماية من الخادم قيد التجهيز. استخدم إيقاف كورس محدد من صفحة المتدرب.", "Whole-account suspension is not enabled yet: server-side enforcement is being prepared. Use per-course suspension from the detail page.")} aria-label={p.account_blocked ? t("إعادة تفعيل الحساب", "Reactivate account") : t("إيقاف الحساب", "Suspend account")} className={`h-8 w-8 rounded-lg inline-flex items-center justify-center border border-current/15 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/10 ${p.account_blocked ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                      {p.account_blocked ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function Avatar({ p, big }: { p: Prof; big?: boolean }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    const a = p.avatar_url;
    if (!a) { setSrc(null); return; }
    if (/^https?:/.test(a)) { setSrc(a); return; }
    supabase.storage.from("avatars").createSignedUrl(a, 3600).then(({ data }) => { if (!off) setSrc(data?.signedUrl ?? null); });
    return () => { off = true; };
  }, [p.avatar_url]);
  const size = big ? "w-16 h-16 text-xl" : "w-11 h-11";
  return src ? <img src={src} alt="" className={`${size} rounded-full object-cover shrink-0`} />
    : <span className={`${size} rounded-full shrink-0 flex items-center justify-center font-bold bg-[var(--nx-teal)]/15 text-[var(--nx-teal)]`}>{(p.full_name || "?").slice(0, 1)}</span>;
}

function SubscriberDetail({ p, enrs, units, onBack, onAccount, onCourse, t, fmt, statusLabel }: {
  p: Prof; enrs: Enr[]; units: Map<string, { done: number; total: number }>; onBack: () => void; onAccount: () => void; onCourse: (e: Enr) => void;
  t: (a: string, b: string) => string; fmt: (d?: string | null) => string; statusLabel: (s: string) => string;
}) {
  const [pay, setPay] = useState<any[] | null>(null);
  const [subs, setSubs] = useState<any[] | null>(null);
  useEffect(() => {
    (async () => {
      const ids = enrs.map((e) => e.id);
      const [a, b] = await Promise.all([
        ids.length ? supabase.from("payments").select("id,amount,currency,status,paid_at,payment_method_name").in("enrollment_id", ids).order("paid_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
        supabase.from("assignment_submissions").select("id,score,submitted_at,assignments(title,max_score)").eq("user_id", p.id).order("submitted_at", { ascending: false }),
      ]);
      setPay((a.data as any[]) ?? []); setSubs((b.data as any[]) ?? []);
    })();
  }, [p.id]);
  const wa = p.phone?.replace(/[^\d]/g, "");
  const approvedTotal = (pay ?? []).filter((x) => x.status === "approved").reduce((s, x) => s + Number(x.amount), 0);
  const cur = pay?.[0]?.currency ?? "";
  return (
    <section className="space-y-4">
      <button onClick={onBack} className="nx-btn-ghost h-10 px-4 rounded-xl inline-flex items-center gap-2 text-sm font-semibold"><ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />{t("كل المشتركين", "All subscribers")}</button>
      <div className="nx-card p-5 sm:p-7 flex flex-wrap items-center gap-4">
        <Avatar p={p} big />
        <div className="min-w-0 flex-1">
          <h1 className="nx-display text-2xl sm:text-[28px] break-words">{p.full_name || t("بدون اسم", "No name")}</h1>
          <p className="text-xs opacity-70 mt-1">{t("انضم", "Joined")} {fmt(p.created_at)}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-[11px] px-2 py-1 rounded-md ${p.account_blocked ? sc("rejected") : sc("approved")}`}>{p.account_blocked ? t("موقوف", "Blocked") : t("نشط", "Active")}</span>
            <span className="text-[11px] px-2 py-1 rounded-md bg-black/5 dark:bg-white/10">{t("التفعيل", "Activation")}: {p.activation_status}</span>
            <button type="button" disabled={!p.account_blocked} onClick={onAccount} className={`disabled:opacity-50 disabled:cursor-not-allowed text-[11px] px-3 py-1 rounded-md font-semibold inline-flex items-center gap-1.5 ${p.account_blocked ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"}`}>{p.account_blocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}{p.account_blocked ? t("إعادة تفعيل الحساب", "Reactivate account") : t("إيقاف الحساب بالكامل (غير مفعّل بعد)", "Whole-account suspend (not enabled yet)")}</button>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="nx-card p-5 space-y-3 text-sm">
          <h2 className="font-bold">{t("بيانات التواصل", "Contact")}</h2>
          <Line icon={Mail} v={p.email} /><Line icon={Phone} v={p.phone} /><Line icon={Globe} v={p.country} />
          <div className="flex flex-wrap gap-2 pt-1">
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="nx-btn-ghost h-10 px-4 rounded-xl inline-flex items-center gap-2 text-sm font-semibold"><MessageCircle className="w-4 h-4" />{t("واتساب", "WhatsApp")}</a>}
            {p.email && <a href={`mailto:${p.email}`} className="nx-btn-ghost h-10 px-4 rounded-xl inline-flex items-center gap-2 text-sm font-semibold"><Mail className="w-4 h-4" />{t("بريد", "Email")}</a>}
          </div>
        </div>
        <div className="nx-card p-5 space-y-3">
          <h2 className="font-bold">{t("الاشتراكات", "Enrollments")} ({enrs.length})</h2>
          {enrs.length === 0 && <p className="text-sm opacity-60">{t("لا توجد اشتراكات", "No enrollments")}</p>}
          {enrs.map((e) => {
            const u = units.get(e.course_id);
            return (
              <div key={e.id} className="rounded-xl border border-current/10 p-3 space-y-2">
                <div className="flex items-center gap-2"><span className="flex-1 min-w-0 text-sm font-semibold truncate">{e.courses?.title}</span><span className={`px-2 py-0.5 rounded-md text-[10px] ${sc(e.status)}`}>{statusLabel(e.status)}</span>{e.blocked && <span className="px-2 py-0.5 rounded-md text-[10px] bg-rose-500/15 text-rose-700 dark:text-rose-300">{t("الوصول موقوف", "Access suspended")}</span>}</div>
                <button type="button" onClick={() => onCourse(e)} className="nx-btn-ghost h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5">{e.blocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}{e.blocked ? t("إعادة فتح هذا الكورس", "Restore this course") : t("إيقاف الوصول لهذا الكورس فقط", "Suspend this course only")}</button>
                <p className="text-[11px] opacity-60">{fmt(e.created_at)}{e.certificate_issued ? ` · ${t("شهادة صادرة", "Certificate issued")}` : ""}</p>
                {e.status === "approved" && u && u.total > 0 && (
                  <p className="text-[11px] opacity-70">{t("محتوى الكورس (ليس تقدّم هذا المتدرب):", "Course content (not this trainee's progress):")} <span dir="ltr">{u.done}/{u.total}</span> {t("وحدة أنهاها المدرّب", "units marked complete by the trainer")}</p>
                )}
              </div>
            );
          })}
          <p className="text-[11px] opacity-50">{t("لا يوجد تتبّع لتقدّم كل متدرب على حدة؛ الأرقام تخص محتوى الكورس.", "Per-trainee progress is not tracked; the figures describe the course content.")}</p>
        </div>
        <div className="nx-card p-5 space-y-3">
          <div className="flex items-center justify-between"><h2 className="font-bold">{t("المدفوعات", "Payments")}</h2>{pay && pay.length > 0 && <span className="text-xs font-bold">{approvedTotal.toLocaleString()} {cur}</span>}</div>
          {pay === null ? <Loader2 className="w-4 h-4 animate-spin" /> : pay.length === 0 ? <p className="text-sm opacity-60">{t("لا توجد مدفوعات", "No payments")}</p> : pay.map((x) => (
            <div key={x.id} className="flex items-center gap-3 text-sm"><span className="flex-1">{Number(x.amount).toLocaleString()} {x.currency}<span className="block text-[11px] opacity-60">{fmt(x.paid_at)}{x.payment_method_name ? ` · ${x.payment_method_name}` : ""}</span></span><span className={`px-2 py-0.5 rounded-md text-[10px] ${sc(x.status)}`}>{x.status}</span></div>
          ))}
        </div>
        <div className="nx-card p-5 space-y-3">
          <h2 className="font-bold">{t("الواجبات", "Assignments")}</h2>
          {subs === null ? <Loader2 className="w-4 h-4 animate-spin" /> : subs.length === 0 ? <p className="text-sm opacity-60">{t("لا توجد تسليمات", "No submissions")}</p> : subs.map((x) => (
            <div key={x.id} className="flex items-center gap-3 text-sm"><span className="flex-1 min-w-0 truncate">{x.assignments?.title ?? "—"}<span className="block text-[11px] opacity-60">{fmt(x.submitted_at)}</span></span><span className="text-xs font-bold">{x.score != null ? `${x.score}/${x.assignments?.max_score ?? ""}` : t("بانتظار التقييم", "Ungraded")}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Line({ icon: Icon, v }: { icon: typeof Mail; v?: string | null }) {
  return <div className="flex items-center gap-2"><Icon className="w-4 h-4 opacity-50" /><span className="truncate" dir="ltr">{v || "—"}</span></div>;
}
