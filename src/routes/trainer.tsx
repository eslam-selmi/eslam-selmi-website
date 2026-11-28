import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { useI18n } from "@/lib/i18n";
import { TENANT_THEMES, themeByKey, themeVars } from "@/lib/tenant-themes";
import { TrainerFinance } from "@/components/tenants/TrainerFinance";
import { TrainerTools } from "@/components/tenants/TrainerTools";
import { tdb, HOST_RE, isDbMissing, type Tenant, type TenantDomain } from "@/lib/tenants";

export const Route = createFileRoute("/trainer")({
  ssr: false,
  head: () => ({ meta: [{ title: "Trainer dashboard" }, { name: "robots", content: "noindex" }] }),
  component: TrainerDashboard,
});

function TrainerDashboard() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [host, setHost] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [land, setLand] = useState({ headline: "", subtitle: "", about: "", theme: "terracotta", published: false });

  const q = useQuery({
    enabled: !!user,
    queryKey: ["trainer-home", user?.id],
    queryFn: async () => {
      const { data: m, error } = await tdb.from("tenant_members").select("tenant_id").eq("user_id", user!.id).eq("role", "admin").limit(1);
      if (error) throw error;
      const tid = m?.[0]?.tenant_id as string | undefined;
      if (!tid) return null;
      const [tn, c, e, l, d] = await Promise.all([
        tdb.from("tenants").select("*").eq("id", tid).single(),
        supabase.from("courses").select("id,title,active,created_at").eq("tenant_id" as any, tid).order("created_at"),
        supabase.from("enrollments").select("id,status"),
        tdb.from("tenant_landing").select("*").eq("tenant_id", tid).maybeSingle(),
        tdb.from("tenant_domains").select("*").eq("tenant_id", tid),
      ]);
      if (l.data) setLand({ headline: l.data.headline ?? "", subtitle: l.data.subtitle ?? "", about: l.data.about ?? "", theme: l.data.theme ?? "terracotta", published: !!l.data.published });
      const { data: lm } = await tdb.from("tenant_members").select("user_id,status,created_at").eq("tenant_id", tid).eq("role", "learner").order("created_at");
      const ids = ((lm as any[]) ?? []).map((x) => x.user_id);
      const { data: pr } = ids.length ? await supabase.from("profiles").select("id,full_name").in("id", ids) : { data: [] as any[] };
      const names = new Map(((pr as any[]) ?? []).map((x) => [x.id, x.full_name as string | null]));
      const learners = ((lm as any[]) ?? []).map((x) => ({ user_id: x.user_id as string, status: x.status as string, name: names.get(x.user_id) ?? null }));
      return { learners, tenant: tn.data as Tenant, courses: (c.data as any[]) ?? [], enrollments: (e.data as any[]) ?? [], domains: (d.data as TenantDomain[]) ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["trainer-home"] });

  if (loading || q.isLoading) return null;
  if (!user) return <main className="p-6"><Link to="/auth" className="underline">{t("سجّل الدخول", "Sign in")}</Link></main>;
  if (q.error) return <main className="p-6">{isDbMissing(q.error as any) ? t("غير متاح بعد.", "Not available yet.") : (q.error as Error).message}</main>;
  if (!q.data) return <main className="p-6"><Link to="/become-trainer" className="underline">{t("ليس لديك منصة مدرب. قدّم طلبًا.", "No trainer platform yet. Send a request.")}</Link></main>;

  const { tenant, courses, enrollments, domains, learners } = q.data;
  async function setLearner(uid: string, status: "approved" | "blocked" | "pending") {
    const { error } = await tdb.rpc("set_tenant_learner_status", { _tenant: tenant.id, _user: uid, _status: status });
    if (error) setMsg(error.message); else refresh();
  }
  const full = tenant.max_courses != null && courses.length >= tenant.max_courses;

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("courses").insert({ title: title.trim(), tenant_id: tenant.id, active: false } as any);
    if (error) return toast.error(error.message);
    setTitle(""); refresh();
  }
  async function saveLanding() {
    const { error } = await tdb.from("tenant_landing").upsert({ tenant_id: tenant.id, ...land, updated_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    toast.success(t("تم الحفظ", "Saved")); refresh();
  }
  async function requestDomain(e: React.FormEvent) {
    e.preventDefault();
    const h = host.trim().toLowerCase();
    if (!HOST_RE.test(h)) return toast.error(t("اسم دومين غير صالح", "Invalid domain name"));
    const { error } = await tdb.from("tenant_domains").insert({ tenant_id: tenant.id, hostname: h });
    if (error) return toast.error(error.message);
    setHost(""); refresh();
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <p className="text-sm text-muted-foreground">{tenant.status === "suspended" ? t("حسابك موقوف مؤقتًا.", "Your account is suspended.") : <a className="underline" href={`/t/${tenant.slug}`}>/t/{tenant.slug}</a>}</p>
      </header>

      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border p-3"><div className="text-2xl font-bold" dir="ltr">{courses.length}{tenant.max_courses != null ? ` / ${tenant.max_courses}` : ""}</div><div className="text-xs">{tenant.max_courses != null ? t(`الكورسات (المستخدم من الحد: ${courses.length} من ${tenant.max_courses})`, `Courses (used of limit: ${courses.length} of ${tenant.max_courses})`) : t("الكورسات", "Courses")}</div></div>
        <div className="rounded-xl border p-3"><div className="text-2xl font-bold">{enrollments.length}</div><div className="text-xs">{t("تسجيلات المتدربين", "Learner enrollments")}</div></div>
        <div className="rounded-xl border p-3"><div className="text-2xl font-bold">{tenant.feature_tools_upload ? t("مفعّل", "On") : t("مغلق", "Off")}</div><div className="text-xs">{t("رفع الأدوات", "Tool upload")}</div></div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">{t("متدربوك", "Your learners")}</h2>
        <ul className="divide-y rounded-xl border">
          {learners.map((l) => (
            <li key={l.user_id} className="p-3 flex items-center justify-between gap-2">
              <span>{l.name || l.user_id.slice(0, 8)} <span className="text-xs text-muted-foreground">({l.status === "approved" ? t("مقبول", "approved") : l.status === "blocked" ? t("محظور", "blocked") : t("بانتظار القبول", "pending")})</span></span>
              <span className="flex gap-2">
                {l.status !== "approved" && <button className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm" onClick={() => setLearner(l.user_id, "approved")}>{t("قبول", "Approve")}</button>}
                {l.status !== "blocked" && <button className="px-3 py-1 rounded border text-sm" onClick={() => setLearner(l.user_id, "blocked")}>{t("حظر", "Block")}</button>}
              </span>
            </li>
          ))}
          {learners.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t("لا متدربين بعد.", "No learners yet.")}</li>}
        </ul>
        {msg && <p className="text-sm text-destructive" role="alert">{msg}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t("الكورسات", "Courses")}</h2>
        <ul className="divide-y rounded-xl border">{courses.map((c) => <li key={c.id} className="p-3 flex justify-between"><span>{c.title}</span><span className="text-xs text-muted-foreground">{c.active ? t("منشور", "Published") : t("مسودة", "Draft")}</span></li>)}
          {courses.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t("لا كورسات بعد، منصتك فاضية.", "No courses yet. Your platform is empty.")}</li>}</ul>
        <form onSubmit={addCourse} className="flex gap-2">
          <input required disabled={full} className="flex-1 border rounded px-3 py-2 bg-background" placeholder={t("اسم الكورس", "Course title")} value={title} onChange={(e) => setTitle(e.target.value)} />
          <button disabled={full} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">{t("إضافة", "Add")}</button>
        </form>
        {full && <p className="text-xs text-destructive">{t("وصلت للحد الأقصى من الكورسات.", "You reached your course limit.")}</p>}
      </section>

      <TrainerTools tenant={tenant} t={t} />

      <TrainerFinance tenant={tenant} courses={courses} t={t} />

      {tenant.feature_landing ? (
        <section className="space-y-2">
          <h2 className="font-semibold">{t("صفحتك العامة", "Your public page")}</h2>
          <input className="w-full border rounded px-3 py-2 bg-background" placeholder={t("العنوان الرئيسي", "Headline")} value={land.headline} onChange={(e) => setLand({ ...land, headline: e.target.value })} />
          <input className="w-full border rounded px-3 py-2 bg-background" placeholder={t("سطر تعريفي", "Subtitle")} value={land.subtitle} onChange={(e) => setLand({ ...land, subtitle: e.target.value })} />
          <textarea className="w-full border rounded px-3 py-2 bg-background" rows={3} placeholder={t("نبذة", "About")} value={land.about} onChange={(e) => setLand({ ...land, about: e.target.value })} />
          <div>
            <div className="text-sm mb-2">{t("لون صفحتك (معاينة قبل الحفظ)", "Page colours (preview before saving)")}{!tenant.feature_theme && <span className="ms-2 text-xs text-muted-foreground">{t("تغيير الثيم غير مفعّل من المالك.", "Theme change is not enabled by the owner.")}</span>}</div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="theme">
              {TENANT_THEMES.map((th) => (
                <button type="button" key={th.key} role="radio" aria-checked={land.theme === th.key} disabled={!tenant.feature_theme} onClick={() => setLand({ ...land, theme: th.key })}
                  className={`rounded-lg border-2 p-1 disabled:opacity-40 ${land.theme === th.key ? "border-foreground" : "border-transparent"}`} title={lang === "ar" ? th.ar : th.en}>
                  <span className="flex h-8 w-16 overflow-hidden rounded" style={{ background: th.bg }}><span style={{ background: th.accent }} className="w-6" /><span style={{ background: th.panel }} className="w-4 ms-auto" /></span>
                  <span className="block text-[11px] mt-1">{lang === "ar" ? th.ar : th.en}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl p-4 text-sm" style={{ ...(themeVars(themeByKey(land.theme)) as React.CSSProperties), background: "var(--tl-bg)", color: "var(--tl-ink)", border: "2px solid var(--tl-ink)" }}>
              <b>{land.headline || tenant.name}</b>
              <div className="mt-2 flex gap-2 items-center"><span className="px-3 py-1" style={{ background: "var(--tl-accent)", color: "var(--tl-accent-ink)" }}>{t("سجّل", "Register")}</span><span className="px-3 py-1" style={{ background: "var(--tl-panel)", color: "var(--tl-panel-ink)" }}>{t("عن المدرب", "About")}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex gap-2"><input type="checkbox" checked={land.published} onChange={(e) => setLand({ ...land, published: e.target.checked })} />{t("نشر الصفحة", "Publish page")}</label>
            <button onClick={saveLanding} className="ms-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground">{t("حفظ", "Save")}</button>
          </div>
        </section>
      ) : <p className="text-sm text-muted-foreground">{t("الصفحة العامة غير مفعّلة من المالك.", "Public page is not enabled by the owner.")}</p>}

      {tenant.feature_custom_domain && (
        <section className="space-y-2">
          <h2 className="font-semibold">{t("دومين خاص", "Custom domain")}</h2>
          {domains.map((d) => <p key={d.id} className="text-sm" dir="ltr"><b>{d.hostname}</b> · {d.status} · TXT {d.verification_token}</p>)}
          <form onSubmit={requestDomain} className="flex gap-2"><input dir="ltr" className="flex-1 border rounded px-3 py-2 bg-background" placeholder="training.example.com" value={host} onChange={(e) => setHost(e.target.value)} /><button className="px-4 py-2 rounded-lg border">{t("طلب ربط", "Request")}</button></form>
          <p className="text-xs text-muted-foreground">{t("الطلب يُحفظ فقط. التحقق من الملكية وربط الدومين غير متاحين بعد.", "The request is only stored. Ownership verification and domain attach are not available yet.")}</p>
        </section>
      )}
    </main>
  );
}
