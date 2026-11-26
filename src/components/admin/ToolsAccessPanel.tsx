import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/portal-auth";
import { invalidateSiteContent } from "@/lib/site-content";
import { TOOLS, TOOL_IDS, adminListGrants, adminSetGrant, type ToolId } from "@/lib/tools";

type Person = { id: string; full_name: string | null; email: string | null; activation_status: string };
type Flag = { id: string; section_key: string; is_visible: boolean };

export function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  const { lang } = useI18n();
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" role="switch" className="sr-only peer" checked={on} disabled={disabled} aria-label={label} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative w-10 h-6 rounded-full bg-white/10 border border-white/30 peer-checked:bg-emerald-500/80 peer-checked:border-emerald-300/70 transition after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4" />
      <span className={`text-xs font-semibold min-w-[44px] ${on ? "text-emerald-300" : "text-white/75"}`}>{on ? (lang === "ar" ? "مفعّل" : "On") : (lang === "ar" ? "معطّل" : "Off")}</span>
    </label>
  );
}

export function ToolsAccessPanel() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [grants, setGrants] = useState<Set<string>>(new Set());
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  async function loadFlags() {
    const keys = TOOL_IDS.flatMap((id) => [TOOLS[id].siteKeys.home, TOOLS[id].siteKeys.nav]);
    const { data } = await supabase.from("site_content").select("id,section_key,is_visible").in("section_key", keys);
    setFlags((data as Flag[]) || []);
  }
  async function loadGrants() {
    const g = await adminListGrants();
    setGrants(new Set(g.map((x) => `${x.user_id}:${x.tool}`)));
    const ids = Array.from(new Set(g.map((x) => x.user_id)));
    if (ids.length) {
      const { data } = await supabase.from("profiles").select("id,full_name,email,activation_status").in("id", ids);
      setPeople((prev) => { const m = new Map(prev.map((p) => [p.id, p])); ((data as Person[]) || []).forEach((p) => m.set(p.id, p)); return [...m.values()]; });
    }
  }
  useEffect(() => { Promise.all([loadFlags(), loadGrants()]).catch(() => toast.error(t("تعذّر تحميل البيانات", "Could not load data"))).finally(() => setReady(true)); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const h = setTimeout(async () => {
      const safe = term.replace(/[%,()]/g, " ");
      const { data } = await supabase.from("profiles").select("id,full_name,email,activation_status").or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`).limit(10);
      setPeople((prev) => { const m = new Map(prev.map((p) => [p.id, p])); ((data as Person[]) || []).forEach((p) => m.set(p.id, p)); return [...m.values()]; });
    }, 350);
    return () => clearTimeout(h);
  }, [q]);

  async function setFlag(key: string, on: boolean) {
    const row = flags.find((f) => f.section_key === key);
    if (!row) return toast.error(t("القسم غير موجود في قاعدة البيانات بعد", "This flag does not exist yet"));
    setBusy(key);
    const { error } = await supabase.from("site_content").update({ is_visible: on }).eq("id", row.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateSiteContent();
    loadFlags();
  }
  async function setGrant(uid: string, tool: ToolId, on: boolean) {
    if (!user) return;
    setBusy(`${uid}:${tool}`);
    try { await adminSetGrant(uid, tool, on, user.id); await loadGrants(); toast.success(t("تم التحديث", "Updated")); }
    catch (e: any) { toast.error(e?.message || t("تعذّر الحفظ", "Could not save")); }
    finally { setBusy(null); }
  }

  const granted = useMemo(() => new Set(Array.from(grants).map((k) => k.split(":")[0])), [grants]);
  const term = q.trim().toLowerCase();
  const shown = people.filter((p) => granted.has(p.id) || (term.length >= 2 && ((p.email || "").toLowerCase().includes(term) || (p.full_name || "").toLowerCase().includes(term))));
  const vis = (key: string) => !!flags.find((f) => f.section_key === key)?.is_visible;

  if (!ready) return <div className="dash-card p-6"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  return (
    <div className="space-y-4">
      <div className="dash-card p-5 space-y-2">
        <h3 className="text-lg font-bold">{t("الأدوات: الظهور والصلاحيات", "Tools: visibility and access")}</h3>
        <p className="text-sm text-white/65">
          {t("الظهور: هل يظهر رابط الأداة في القائمة العلوية وفي الصفحة الرئيسية. صلاحية الوصول: هل يُسمح لهذا المستخدم فعلًا. إخفاء الرابط لا يلغي صلاحية أحد، وبدون صلاحية لا تُفتح الأداة حتى بالرابط المباشر.",
            "Visibility controls whether the link appears in the top menu and on the home page. Access controls who may open the tool. Hiding a link never revokes access, and without access the tool cannot be opened even by direct link.")}
        </p>
        <p className="text-xs text-white/50">{t("الصلاحيات تُمنح فقط للحسابات المفعّلة. الإدارة لا تقرأ بيانات المستخدمين داخل الأدوات.", "Access only works for activated accounts. Administrators cannot read users' data inside the tools.")}</p>
      </div>

      <div className="dash-card p-5 space-y-3">
        <h4 className="font-bold">{t("الظهور العام", "Public visibility")}</h4>
        {TOOL_IDS.map((id) => (
          <div key={id} className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/10 p-3">
            <div className="font-semibold text-sm flex-1 min-w-[180px]">{lang === "ar" ? TOOLS[id].ar : TOOLS[id].en}</div>
            <div className="flex items-center gap-2 text-xs">{t("القائمة العلوية", "Top menu")}<Switch on={vis(TOOLS[id].siteKeys.nav)} disabled={busy === TOOLS[id].siteKeys.nav} onChange={(v) => setFlag(TOOLS[id].siteKeys.nav, v)} label={`${TOOLS[id].ar}: ${t("القائمة العلوية", "Top menu")}`} /></div>
            <div className="flex items-center gap-2 text-xs">{t("الصفحة الرئيسية", "Home page")}<Switch on={vis(TOOLS[id].siteKeys.home)} disabled={busy === TOOLS[id].siteKeys.home} onChange={(v) => setFlag(TOOLS[id].siteKeys.home, v)} label={`${TOOLS[id].ar}: ${t("الصفحة الرئيسية", "Home page")}`} /></div>
          </div>
        ))}
      </div>

      <div className="dash-card p-5 space-y-3">
        <h4 className="font-bold">{t("صلاحيات المستخدمين", "User access")}</h4>
        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 opacity-50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ابحث بالاسم أو البريد لمنح صلاحية", "Search by name or email to grant access")} className="w-full h-11 ps-9 pe-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
        </div>
        {shown.length === 0 && <p className="text-sm text-white/55">{t("لا يوجد مستخدمون لديهم صلاحية بعد. ابحث لإضافة أول مستخدم.", "No users have access yet. Search to add the first one.")}</p>}
        <div className="space-y-2">
          {shown.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 p-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold text-sm">{p.full_name || "-"}</div>
                <div className="text-xs text-white/55" dir="ltr">{p.email}</div>
                {p.activation_status !== "active" && <div className="text-[11px] text-amber-300 mt-1">{t("الحساب غير مفعّل، لن تعمل الصلاحية حتى يُفعَّل", "Account not activated; access will not work until it is")}</div>}
              </div>
              {TOOL_IDS.map((id) => (
                <div key={id} className="flex items-center gap-2 text-xs">{lang === "ar" ? TOOLS[id].ar : TOOLS[id].en}
                  <Switch on={grants.has(`${p.id}:${id}`)} disabled={busy === `${p.id}:${id}`} onChange={(v) => setGrant(p.id, id, v)} label={`${p.full_name || p.email}: ${TOOLS[id].ar}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
