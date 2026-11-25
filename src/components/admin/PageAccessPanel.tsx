import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { invalidateSiteContent } from "@/lib/site-content";

const db = supabase as any;

// Every tab the top menu can show. Display only: the flag decides whether the link appears.
const TABS: { key: string; ar: string; en: string }[] = [
  { key: "nav.services", ar: "الخدمات", en: "Services" },
  { key: "nav.tna_tool", ar: "تحليل الاحتياجات التدريبية", en: "TNA tool" },
  { key: "nav.perf_tool", ar: "قياس الأداء قبل التدريب", en: "Pre-training performance" },
  { key: "nav.exam_tool", ar: "محاكي رخصة المدرب", en: "Trainer license practice" },
  { key: "nav.courses", ar: "الدورات", en: "Courses" },
  { key: "nav.trainings", ar: "التدريبات", en: "Trainings" },
  { key: "nav.success_cases", ar: "قصص النجاح", en: "Success cases" },
  { key: "nav.library", ar: "المكتبة", en: "Resources" },
  { key: "nav.empowerment", ar: "خريج جديد", en: "New grad" },
];
// Tabs whose content is already fetched from the server behind its own access check.
// Only these can honestly offer a people or password lock. Other tabs are public pages.
const LOCKABLE = new Set(["nav.tna_tool", "nav.perf_tool", "nav.exam_tool"]);
const pageKey = (k: string) => `page.${k.replace("nav.", "")}`;

type Flag = { id: string; section_key: string; is_visible: boolean };
type Mode = "open" | "people" | "password";
type Access = { page_key: string; mode: Mode; has_password: boolean; grants: number };
type Person = { id: string; full_name: string | null; email: string | null };

export function PageAccessPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [access, setAccess] = useState<Access[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  async function load() {
    const [f, a] = await Promise.all([
      supabase.from("site_content").select("id,section_key,is_visible").in("section_key", TABS.map((x) => x.key)),
      db.rpc("list_page_access"),
    ]);
    setFlags((f.data as Flag[]) || []);
    setAccess((a.data as Access[]) || []);
  }
  useEffect(() => { load().catch(() => toast.error(t("تعذّر التحميل", "Could not load"))).finally(() => setReady(true)); /* eslint-disable-next-line */ }, []);

  async function setVisible(key: string, on: boolean) {
    const row = flags.find((f) => f.section_key === key);
    if (!row) return toast.error(t("هذا الخيار غير موجود في قاعدة البيانات بعد", "This flag does not exist yet"));
    setBusy(key);
    const { error } = await supabase.from("site_content").update({ is_visible: on }).eq("id", row.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateSiteContent(); load();
  }
  async function setMode(key: string, mode: Mode, password?: string) {
    setBusy(pageKey(key));
    const { error } = await db.rpc("set_page_access", { p_key: pageKey(key), p_mode: mode, p_password: password ?? null });
    setBusy(null);
    if (error) return toast.error(error.message.includes("short") ? t("كلمة المرور 8 أحرف على الأقل", "Password must be at least 8 characters") : error.message);
    toast.success(t("تم الحفظ", "Saved")); load();
  }

  if (!ready) return <div className="dash-card p-6"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  return (
    <div className="space-y-4">
      <div className="dash-card p-5 space-y-2">
        <h3 className="text-lg font-bold">{t("التابات: الظهور والقفل", "Tabs: visibility and lock")}</h3>
        <p className="text-sm text-white/65">{t("الظهور يتحكم في ظهور الرابط في القائمة فقط، ولا يمنع فتح الصفحة بالرابط المباشر. القفل (أشخاص محددون أو كلمة مرور) يُطبَّق فعليًا على محتوى الأدوات المحمّل من الخادم فقط. الصفحات العامة العادية تُخفى من القائمة لكن نصها يبقى في ملفات الموقع، فلا نعرض لها قفلًا.",
          "Visibility only controls the menu link and does not block a direct URL. A lock (selected people or a password) is enforced only on tool content loaded from the server. Ordinary public pages can be hidden from the menu, but their text stays in the site files, so no lock is offered for them.")}</p>
      </div>
      {TABS.map((tab) => {
        const a = access.find((x) => x.page_key === pageKey(tab.key));
        const mode: Mode = a?.mode || "open";
        const vis = !!flags.find((f) => f.section_key === tab.key)?.is_visible;
        return (
          <div key={tab.key} className="dash-card p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <b className="text-sm">{lang === "ar" ? tab.ar : tab.en}</b>
              <button type="button" disabled={busy === tab.key} onClick={() => setVisible(tab.key, !vis)} className={`h-9 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border ${vis ? "border-emerald-400/50 text-emerald-300" : "border-white/20 text-white/60"}`} aria-pressed={vis}>
                {vis ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}{vis ? t("ظاهر في القائمة", "Shown in menu") : t("مخفي من القائمة", "Hidden from menu")}
              </button>
            </div>
            {LOCKABLE.has(tab.key) ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 items-center text-xs">
                  <span className="opacity-70">{t("من يستطيع الفتح:", "Who can open:")}</span>
                  {(["open", "people", "password"] as Mode[]).map((m) => (
                    <button key={m} type="button" disabled={busy === pageKey(tab.key) || (m === "password" && !a?.has_password)} onClick={() => setMode(tab.key, m)} className={`h-8 px-3 rounded-lg border ${mode === m ? "bg-[var(--gold)] text-black border-transparent" : "border-white/20"} disabled:opacity-40`}>
                      {m === "open" ? t("كل من له صلاحية", "Anyone with access") : m === "people" ? t("أشخاص محددون", "Selected people") : t("كلمة مرور", "Password")}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] opacity-60">{t("القفل يُضاف فوق صلاحية الأداة ولا يستبدلها. من ليست له صلاحية الأداة لا يدخل بأي حال.", "A lock is added on top of tool access and never replaces it. Without tool access nobody gets in.")}</p>
                <button type="button" onClick={() => setOpen(open === tab.key ? null : tab.key)} className="text-xs underline">{t("إعدادات القفل", "Lock settings")}</button>
                {open === tab.key && <LockSettings tabKey={tab.key} access={a} onMode={setMode} t={t} />}
              </div>
            ) : <p className="text-[11px] opacity-60">{t("صفحة عامة: الظهور فقط.", "Public page: visibility only.")}</p>}
          </div>
        );
      })}
    </div>
  );
}

function LockSettings({ tabKey, access, onMode, t }: { tabKey: string; access?: Access; onMode: (k: string, m: Mode, pw?: string) => void; t: (a: string, b: string) => string }) {
  const [pw, setPw] = useState("");
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Person[]>([]);
  const [granted, setGranted] = useState<Person[]>([]);
  const key = pageKey(tabKey);

  async function loadGranted() {
    const { data: g } = await db.from("page_access_grants").select("user_id").eq("page_key", key);
    const ids = ((g as { user_id: string }[]) || []).map((x) => x.user_id);
    if (!ids.length) return setGranted([]);
    const { data } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
    setGranted((data as Person[]) || []);
  }
  useEffect(() => { loadGranted(); /* eslint-disable-next-line */ }, [access?.grants]);
  useEffect(() => {
    const term = q.trim().replace(/[%,()]/g, " ");
    if (term.length < 2) { setFound([]); return; }
    const h = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id,full_name,email").or(`email.ilike.%${term}%,full_name.ilike.%${term}%`).limit(8);
      setFound((data as Person[]) || []);
    }, 350);
    return () => clearTimeout(h);
  }, [q]);
  async function grant(p: Person, on: boolean) {
    if (on) await db.from("page_access_grants").upsert({ page_key: key, user_id: p.id }, { onConflict: "page_key,user_id", ignoreDuplicates: true });
    else await db.from("page_access_grants").delete().eq("page_key", key).eq("user_id", p.id);
    // The grant row needs a page_access row to exist (foreign key), so make sure one exists.
    loadGranted();
  }
  async function ensureRow() { if (!access) await onMode(tabKey, "open"); }
  useEffect(() => { ensureRow(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="rounded-xl border border-white/10 p-3 space-y-3">
      <div className="space-y-1">
        <div className="text-xs font-semibold">{t("كلمة المرور", "Password")} {access?.has_password ? <span className="text-emerald-300">({t("محفوظة", "set")})</span> : <span className="text-white/50">({t("غير محددة", "not set")})</span>}</div>
        <div className="flex gap-2">
          <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("كلمة مرور جديدة (8 أحرف على الأقل)", "New password (min 8 characters)")} className="h-10 flex-1 rounded-xl bg-white/5 border border-white/10 px-3 text-sm" />
          <button type="button" disabled={pw.length < 8} onClick={() => { onMode(tabKey, access?.mode === "password" ? "password" : (access?.mode || "open"), pw); setPw(""); }} className="h-10 px-3 rounded-xl border border-white/20 text-sm disabled:opacity-40">{t("حفظ", "Save")}</button>
        </div>
        <p className="text-[11px] opacity-60">{t("لا تُعرض كلمة المرور بعد الحفظ، ويلغي تغييرها جميع عمليات الفتح السابقة.", "The password is never shown after saving, and changing it ends every earlier unlock.")}</p>
      </div>
      <div className="space-y-2">
        <div className="text-xs font-semibold">{t("الأشخاص المسموح لهم", "Allowed people")}</div>
        <div className="relative"><Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 opacity-50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ابحث بالاسم أو البريد", "Search by name or email")} className="w-full h-10 ps-9 pe-3 rounded-xl bg-white/5 border border-white/10 text-sm" /></div>
        {found.map((p) => <PersonRow key={p.id} p={p} on={granted.some((g) => g.id === p.id)} onToggle={(v) => grant(p, v)} t={t} />)}
        {granted.filter((g) => !found.some((f) => f.id === g.id)).map((p) => <PersonRow key={p.id} p={p} on onToggle={(v) => grant(p, v)} t={t} />)}
      </div>
    </div>
  );
}

function PersonRow({ p, on, onToggle, t }: { p: Person; on: boolean; onToggle: (v: boolean) => void; t: (a: string, b: string) => string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm border-t border-white/10 pt-2">
      <span>{p.full_name || "-"} <span className="text-xs opacity-60" dir="ltr">{p.email}</span></span>
      <button type="button" onClick={() => onToggle(!on)} aria-pressed={on} className={`h-8 px-3 rounded-lg text-xs border ${on ? "border-emerald-400/50 text-emerald-300" : "border-white/20 text-white/60"}`}>{on ? t("مسموح", "Allowed") : t("غير مسموح", "Not allowed")}</button>
    </div>
  );
}
