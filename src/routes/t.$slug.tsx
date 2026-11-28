import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { useI18n } from "@/lib/i18n";
import { tdb, isDbMissing } from "@/lib/tenants";
import { themeByKey, themeVars } from "@/lib/tenant-themes";
import { TenantLandingView, type PublicTenant, type Landing } from "@/components/tenants/TenantLandingView";

// Trainer public page route: loads the tenant's own data and hands it to the presentational view.
export const Route = createFileRoute("/t/$slug")({
  ssr: false,
  head: ({ params }) => ({ meta: [{ title: `${params.slug}` }, { name: "robots", content: "index,follow" }] }),
  component: TenantLanding,
});

function TenantLanding() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["tenant-public", slug],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: tn, error } = await tdb.rpc("get_public_tenant", { _slug: slug });
      if (error) throw error;
      const tenant = (tn as PublicTenant[])?.[0];
      if (!tenant) return null;
      const [l, c] = await Promise.all([
        tdb.from("tenant_landing").select("*").eq("tenant_id", tenant.id).maybeSingle(),
        tdb.rpc("get_public_tenant_courses", { _slug: slug }),
      ]);
      return { tenant, landing: (l.data as Landing | null) ?? null, courses: (c.data as any[]) ?? [] };
    },
  });

  if (q.isLoading) return <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>…</div>;
  if (q.error) return <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>{isDbMissing(q.error as any) ? "…" : "Something went wrong."}</div>;
  if (!q.data || !q.data.landing?.published) {
    const ar = lang === "ar";
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", textAlign: "center", padding: "2rem", fontFamily: "'Thmanyah Sans', system-ui, sans-serif" }}>
        <div>
          <h1 style={{ fontFamily: "'Thmanyah Serif Display', serif", fontSize: "2rem", margin: 0 }}>{ar ? "هذه الصفحة غير متاحة" : "This page is not available"}</h1>
          <p style={{ opacity: 0.7, marginTop: "0.75rem" }}>{ar ? "قد يكون الرابط غير صحيح أو أن الصفحة لم تُنشر بعد." : "The link may be wrong, or the page is not published yet."}</p>
          <a href="/" style={{ display: "inline-block", marginTop: "1rem", textDecoration: "underline" }}>{ar ? "العودة للرئيسية" : "Back to home"}</a>
        </div>
      </div>
    );
  }
  const { tenant, landing, courses } = q.data;

  async function join() {
    const { error } = await tdb.rpc("join_tenant_as_learner", { _slug: slug });
    if (error) throw error;
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.name } } });
        if (error) throw error;
        if (data.session) { await join(); setMsg("joined"); } else setMsg("confirm");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        await join();
        setMsg("joined");
      }
      qc.invalidateQueries();
    } catch (err: any) { setMsg("err:" + (err.message || "Failed")); }
    setBusy(false);
  }

  return (
    <TenantLandingView
      tenant={tenant} landing={landing} courses={courses} lang={lang === "ar" ? "ar" : "en"}
      signedIn={!!user} mode={mode} setMode={setMode} form={form} setForm={setForm} busy={busy} msg={msg}
      onSubmit={submit}
      onJoin={async () => { try { await join(); setMsg("joined"); } catch (e: any) { setMsg("err:" + e.message); } }}
      vars={themeVars(themeByKey(landing.theme))}
    />
  );
}
