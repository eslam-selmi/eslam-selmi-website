import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { tdb, isDbMissing, type Tenant, type TenantRequest, type TenantDomain } from "@/lib/tenants";

// Owner (platform admin) view: approve trainer requests, set limits and switches, suspend, activate domains.
export function TrainersPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["owner-tenants"] });

  const q = useQuery({
    queryKey: ["owner-tenants"],
    staleTime: 15_000,
    queryFn: async () => {
      const [r, tn, d] = await Promise.all([
        tdb.from("tenant_requests").select("*").order("created_at", { ascending: false }),
        tdb.from("tenants").select("*").eq("kind", "trainer").order("created_at", { ascending: false }),
        tdb.from("tenant_domains").select("*").order("created_at", { ascending: false }),
      ]);
      const err = r.error || tn.error || d.error;
      if (err) throw err;
      return { requests: r.data as TenantRequest[], tenants: tn.data as Tenant[], domains: d.data as TenantDomain[] };
    },
  });

  if (q.isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
  if (q.error) {
    return (
      <div className="rounded-xl border p-6 text-sm">
        {isDbMissing(q.error as any)
          ? t("جداول المدربين لم تُطبّق على قاعدة البيانات بعد.", "Trainer tables have not been applied to the database yet.")
          : (q.error as Error).message}
      </div>
    );
  }
  const { requests, tenants, domains } = q.data!;
  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">{t("طلبات التسجيل كمدرب", "Trainer signup requests")} ({pending.length})</h2>
        {pending.length === 0 && <p className="text-sm text-muted-foreground">{t("لا توجد طلبات.", "No pending requests.")}</p>}
        <div className="space-y-3">
          {pending.map((r) => <RequestCard key={r.id} r={r} onDone={refresh} t={t} />)}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("المدربون", "Trainers")} ({tenants.length})</h2>
        <div className="space-y-3">
          {tenants.map((tn) => (
            <TenantCard key={tn.id} tn={tn} domains={domains.filter((d) => d.tenant_id === tn.id)} onDone={refresh} t={t} />
          ))}
        </div>
      </section>
    </div>
  );
}

function RequestCard({ r, onDone, t }: { r: TenantRequest; onDone: () => void; t: (a: string, b: string) => string }) {
  const [max, setMax] = useState(3);
  const [tools, setTools] = useState(false);
  const [landing, setLanding] = useState(true);
  const [domain, setDomain] = useState(false);
  const [theme, setTheme] = useState(false);
  const [unlimited, setUnlimited] = useState(false);
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    const { error } = await tdb.rpc("approve_tenant_request", {
      _request: r.id, _max_courses: unlimited ? null : max, _tools_upload: tools, _landing: landing, _custom_domain: domain, _theme: theme,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("تم قبول المدرب", "Trainer approved"));
    onDone();
  }
  async function reject() {
    setBusy(true);
    const { error } = await tdb.rpc("reject_tenant_request", { _request: r.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    onDone();
  }
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex justify-between gap-3 flex-wrap">
        <div>
          <div className="font-medium">{r.full_name}</div>
          <div className="text-xs text-muted-foreground">{r.specialty || "—"} · /t/{r.requested_slug}</div>
        </div>
        <div className="flex gap-2">
          <button disabled={busy} onClick={approve} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm inline-flex items-center gap-1"><Check className="w-4 h-4" />{t("قبول", "Approve")}</button>
          <button disabled={busy} onClick={reject} className="px-3 py-1.5 rounded-lg border text-sm inline-flex items-center gap-1"><X className="w-4 h-4" />{t("رفض", "Reject")}</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm items-center">
        <label className="flex items-center gap-2">{t("أقصى عدد كورسات", "Max courses")}
          <input type="number" min={0} value={max} disabled={unlimited} onChange={(e) => setMax(Math.max(0, Number(e.target.value) || 0))} className="w-16 border rounded px-2 py-1 bg-background disabled:opacity-40" />
        </label>
        <Toggle label={t("بدون حد", "Unlimited")} v={unlimited} set={setUnlimited} />
        <Toggle label={t("تغيير الثيم", "Change theme")} v={theme} set={setTheme} />
        <Toggle label={t("رفع الأدوات", "Tool upload")} v={tools} set={setTools} />
        <Toggle label={t("لاندنج بيدج", "Landing page")} v={landing} set={setLanding} />
        <Toggle label={t("دومين خاص", "Custom domain")} v={domain} set={setDomain} />
      </div>
    </div>
  );
}

function Toggle({ label, v, set }: { label: string; v: boolean; set: (b: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" role="switch" checked={v} onChange={(e) => set(e.target.checked)} />
      {label}
    </label>
  );
}

function TenantCard({ tn, domains, onDone, t }: { tn: Tenant; domains: TenantDomain[]; onDone: () => void; t: (a: string, b: string) => string }) {
  async function patch(p: Partial<Tenant>) {
    const { error } = await tdb.from("tenants").update(p).eq("id", tn.id);
    if (error) return toast.error(error.message);
    onDone();
  }
  async function setDomain(id: string, status: TenantDomain["status"]) {
    const { error } = await tdb.from("tenant_domains").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    onDone();
  }
  const suspended = tn.status === "suspended";
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex justify-between gap-3 flex-wrap">
        <div>
          <div className="font-medium">{tn.name} {suspended && <span className="text-xs text-destructive">({t("موقوف", "suspended")})</span>}</div>
          <a className="text-xs text-muted-foreground underline" href={`/t/${tn.slug}`} target="_blank" rel="noreferrer">/t/{tn.slug}</a>
        </div>
        <button onClick={() => patch({ status: suspended ? "active" : "suspended" })} className="px-3 py-1.5 rounded-lg border text-sm">
          {suspended ? t("إعادة التفعيل", "Reactivate") : t("إيقاف مؤقت", "Suspend")}
        </button>
      </div>
      <div className="flex flex-wrap gap-4 text-sm items-center">
        <label className="flex items-center gap-2">{t("أقصى عدد كورسات", "Max courses")}
          <input key={String(tn.max_courses)} type="number" min={0} disabled={tn.max_courses === null} defaultValue={tn.max_courses ?? 0} onBlur={(e) => patch({ max_courses: Math.max(0, Number(e.target.value) || 0) })} className="w-16 border rounded px-2 py-1 bg-background disabled:opacity-40" />
        </label>
        <Toggle label={t("بدون حد", "Unlimited")} v={tn.max_courses === null} set={(b) => patch({ max_courses: b ? null : 3 })} />
        <Toggle label={t("تغيير الثيم", "Change theme")} v={!!tn.feature_theme} set={(b) => patch({ feature_theme: b })} />
        <Toggle label={t("رفع الأدوات", "Tool upload")} v={tn.feature_tools_upload} set={(b) => patch({ feature_tools_upload: b })} />
        <Toggle label={t("لاندنج بيدج", "Landing page")} v={tn.feature_landing} set={(b) => patch({ feature_landing: b })} />
        <Toggle label={t("دومين خاص", "Custom domain")} v={tn.feature_custom_domain} set={(b) => patch({ feature_custom_domain: b })} />
        {Object.entries(tn.extra_features ?? {}).map(([k, v]) => (
          <Toggle key={k} label={k} v={!!v} set={(b) => patch({ extra_features: { ...(tn.extra_features ?? {}), [k]: b } })} />
        ))}
        <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const k = String(f.get("k") ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, ""); if (!k) return; patch({ extra_features: { ...(tn.extra_features ?? {}), [k]: false } }); e.currentTarget.reset(); }}>
          <input name="k" dir="ltr" placeholder={t("ميزة جديدة", "new feature key")} className="w-32 border rounded px-2 py-1 bg-background text-xs" />
          <button className="px-2 py-1 rounded border text-xs">+</button>
        </form>
      </div>
      {domains.length > 0 && (
        <div className="text-sm space-y-2 border-t pt-3">
          {domains.map((d) => (
            <div key={d.id} className="flex flex-wrap gap-2 items-center justify-between">
              <div><b dir="ltr">{d.hostname}</b> · {d.status}
                <div className="text-xs text-muted-foreground" dir="ltr">TXT _verify = {d.verification_token}</div>
              </div>
              <div className="flex gap-2">
                <button disabled title={t("غير متاح حتى يتم بناء التحقق من الملكية وربط الاستضافة", "Unavailable until ownership verification and hosting attach are built")} className="px-2 py-1 rounded border text-xs opacity-50 cursor-not-allowed">{t("التفعيل غير متاح بعد", "Activation unavailable yet")}</button>
                {d.status === "requested" && <button onClick={() => setDomain(d.id, "disabled")} className="px-2 py-1 rounded border text-xs">{t("رفض الطلب", "Decline")}</button>}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{t("التحقق من ملكية الدومين وربطه بالاستضافة غير منفذ بعد، والقاعدة ترفض تفعيل أي دومين الآن. الطلبات محفوظة فقط.", "Domain ownership verification and hosting attach are not built yet; the database refuses to activate any domain for now. Requests are only stored.")}</p>
        </div>
      )}
    </div>
  );
}
