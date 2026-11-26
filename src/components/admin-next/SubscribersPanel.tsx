import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, Mail, Phone, Globe, MessageCircle, Loader2, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Prof = {
  id: string; full_name: string | null; email: string | null; phone: string | null; country: string | null;
  avatar_url: string | null; account_blocked: boolean; activation_status: string; created_at: string; activated_at: string | null;
};
type Enr = { id: string; user_id: string; course_id: string; status: string; certificate_issued: boolean; created_at: string; courses: { title: string | null } | null };
type Mod = { course_id: string; completed_by_admin: boolean | null };
type Filter = "all" | "approved" | "pending" | "none" | "blocked";

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
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [p, e, m] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,phone,country,avatar_url,account_blocked,activation_status,created_at,activated_at").order("created_at", { ascending: false }).limit(2000),
        supabase.from("enrollments").select("id,user_id,course_id,status,certificate_issued,created_at,courses(title)").order("created_at", { ascending: false }).limit(5000),
        supabase.from("course_modules").select("course_id,completed_by_admin").limit(5000),
      ]);
      setProfiles((p.data as Prof[]) ?? []);
      setEnrs((e.data as unknown as Enr[]) ?? []);
      setMods((m.data as Mod[]) ?? []);
      setLoading(false);
    })();
  }, []);

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

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return profiles.filter((p) => {
      const es = byUser.get(p.id) ?? [];
      if (filter === "approved" && !es.some((e) => e.status === "approved")) return false;
      if (filter === "pending" && !es.some((e) => e.status === "pending")) return false;
      if (filter === "none" && es.length > 0) return false;
      if (filter === "blocked" && !p.account_blocked) return false;
      if (!s) return true;
      return [p.full_name, p.email, p.phone, p.country, ...es.map((e) => e.courses?.title)].some((v) => (v ?? "").toLowerCase().includes(s));
    });
  }, [profiles, byUser, q, filter]);

  const statusLabel = (s: string) => (s === "approved" ? t("مقبول", "Approved") : s === "rejected" ? t("مرفوض", "Rejected") : t("قيد المراجعة", "Pending"));
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { dateStyle: "medium" }) : "—");

  if (openId) {
    const p = profiles.find((x) => x.id === openId);
    if (p) return <SubscriberDetail p={p} enrs={byUser.get(p.id) ?? []} units={units} onBack={() => setOpenId(null)} t={t} fmt={fmt} statusLabel={statusLabel} />;
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("الكل", "All") },
    { id: "approved", label: t("لديه كورس مقبول", "Approved course") },
    { id: "pending", label: t("بانتظار المراجعة", "Pending") },
    { id: "none", label: t("بدون اشتراك", "No enrollment") },
    { id: "blocked", label: t("موقوف", "Blocked") },
  ];

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
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
              className={`h-8 px-3 rounded-full text-xs font-semibold border transition ${filter === f.id ? "bg-[var(--nx-teal)] text-white border-transparent" : "border-current/20 opacity-80 hover:opacity-100"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="nx-card p-8 text-center text-sm opacity-70">{t("لا يوجد مشتركون مطابقون", "No matching subscribers")}</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((p) => {
            const es = byUser.get(p.id) ?? [];
            return (
              <li key={p.id}>
                <button onClick={() => setOpenId(p.id)} className="nx-card nx-card-hover w-full p-4 sm:p-5 text-start flex items-start gap-4">
                  <Avatar p={p} />
                  <span className="flex-1 min-w-0 grid gap-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:items-center">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-bold truncate">{p.full_name || t("بدون اسم", "No name")}</span>
                        {p.account_blocked && <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300">{t("موقوف", "Blocked")}</span>}
                      </span>
                      <span className="block text-xs opacity-70 truncate" dir="ltr" style={{ textAlign: "start" }}>{p.email || "—"}</span>
                      <span className="block text-xs opacity-70 truncate" dir="ltr" style={{ textAlign: "start" }}>{[p.phone, p.country].filter(Boolean).join(" · ") || "—"}</span>
                    </span>
                    <span className="min-w-0 space-y-1.5">
                      {es.length === 0 ? <span className="text-xs opacity-60">{t("لا توجد اشتراكات", "No enrollments")}</span> : es.slice(0, 3).map((e) => {
                        const u = units.get(e.course_id);
                        return (
                          <span key={e.id} className="flex items-center gap-2 text-xs min-w-0">
                            <span className="truncate flex-1">{e.courses?.title}</span>
                            {e.status === "approved" && u && u.total > 0 && <span className="opacity-70 tabular-nums" dir="ltr">{u.done}/{u.total}</span>}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] shrink-0 ${sc(e.status)}`}>{statusLabel(e.status)}</span>
                          </span>
                        );
                      })}
                      {es.length > 3 && <span className="text-[11px] opacity-60">+{es.length - 3}</span>}
                    </span>
                    <span className="text-[11px] opacity-60 lg:text-end">{t("انضم", "Joined")} {fmt(p.created_at)}</span>
                  </span>
                  <ChevronLeft className="w-4 h-4 opacity-40 mt-2 shrink-0 rtl:rotate-0 ltr:rotate-180" />
                </button>
              </li>
            );
          })}
        </ul>
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

function SubscriberDetail({ p, enrs, units, onBack, t, fmt, statusLabel }: {
  p: Prof; enrs: Enr[]; units: Map<string, { done: number; total: number }>; onBack: () => void;
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
          <h1 className="nx-display text-2xl sm:text-[28px] truncate">{p.full_name || t("بدون اسم", "No name")}</h1>
          <p className="text-xs opacity-70 mt-1">{t("انضم", "Joined")} {fmt(p.created_at)}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-[11px] px-2 py-1 rounded-md ${p.account_blocked ? sc("rejected") : sc("approved")}`}>{p.account_blocked ? t("موقوف", "Blocked") : t("نشط", "Active")}</span>
            <span className="text-[11px] px-2 py-1 rounded-md bg-black/5 dark:bg-white/10">{t("التفعيل", "Activation")}: {p.activation_status}</span>
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
            const pct = u && u.total ? Math.round((u.done / u.total) * 100) : null;
            return (
              <div key={e.id} className="rounded-xl border border-current/10 p-3 space-y-2">
                <div className="flex items-center gap-2"><span className="flex-1 min-w-0 text-sm font-semibold truncate">{e.courses?.title}</span><span className={`px-2 py-0.5 rounded-md text-[10px] ${sc(e.status)}`}>{statusLabel(e.status)}</span></div>
                <p className="text-[11px] opacity-60">{fmt(e.created_at)}{e.certificate_issued ? ` · ${t("شهادة صادرة", "Certificate issued")}` : ""}</p>
                {e.status === "approved" && pct !== null && (
                  <div><div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden"><div className="h-full bg-[var(--nx-teal)]" style={{ width: `${pct}%` }} /></div>
                    <p className="text-[11px] opacity-60 mt-1" dir="ltr" style={{ textAlign: "start" }}>{u!.done}/{u!.total} {t("وحدة مكتملة", "units completed")}</p></div>
                )}
              </div>
            );
          })}
          <p className="text-[11px] opacity-50">{t("تقدّم الوحدات يُسجّله المدرّب على مستوى الكورس.", "Unit progress is marked by the trainer per course.")}</p>
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
