import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { useI18n } from "@/lib/i18n";
import { tdb } from "@/lib/tenants";
import { themeByKey, themeVars } from "@/lib/tenant-themes";
import { CourseDetail } from "@/components/portal/CourseDetail";
import { LearnerTools } from "@/components/tenants/LearnerTools";
import type { Enrollment } from "@/components/portal/types";

// Learner area of ONE trainer platform. Everything is scoped to this tenant: the course list, the enrollments and the
// branding. The owner's portal is not used here. Visibility is decided by database policies, not by this page.
export const Route = createFileRoute("/t_/$slug/learn")({
  ssr: false,
  head: ({ params }) => ({ meta: [{ title: `${params.slug}` }, { name: "robots", content: "noindex" }] }),
  component: TenantLearn,
});

function TenantLearn() {
  const { slug } = Route.useParams();
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<string | null>(null);
  const t = (a: string, b: string) => (ar ? a : b);

  const base = useQuery({
    queryKey: ["tenant-learn", slug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: tn } = await tdb.rpc("get_public_tenant", { _slug: slug });
      const tenant = (tn as { id: string; name: string }[] | null)?.[0];
      if (!tenant) return null;
      const [landing, mem, courses, enr] = await Promise.all([
        tdb.from("tenant_landing").select("theme,logo_url").eq("tenant_id", tenant.id).maybeSingle(),
        tdb.from("tenant_members").select("status,role").eq("tenant_id", tenant.id).eq("user_id", user!.id).maybeSingle(),
        tdb.from("courses").select("*").eq("tenant_id", tenant.id).eq("active", true).order("created_at"),
        tdb.from("enrollments").select("*, courses!inner(*)").eq("user_id", user!.id).eq("courses.tenant_id", tenant.id).order("created_at", { ascending: false }),
      ]);
      return {
        tenant, theme: (landing.data as { theme: string | null } | null)?.theme ?? null,
        member: (mem.data as { status: string; role: string } | null) ?? null,
        courses: (courses.data as any[]) ?? [], enrollments: (enr.data as Enrollment[]) ?? [],
      };
    },
  });

  async function apply(courseId: string) {
    const { error } = await tdb.from("enrollments").insert({ user_id: user!.id, course_id: courseId });
    if (error) return toast.error(error.message);
    toast.success(t("تم تقديم الطلب. ينتظر موافقة المدرب.", "Request sent. Waiting for the trainer."));
    qc.invalidateQueries({ queryKey: ["tenant-learn"] });
  }
  async function downloadCert(url: string) {
    const w = window.open("", "_blank");
    const { data, error } = await supabase.storage.from("certificates").createSignedUrl(url, 60);
    if (error || !data) { w?.close(); return toast.error(t("تعذّر تحميل الشهادة", "Could not download the certificate")); }
    if (w) w.location.href = data.signedUrl; else window.location.href = data.signedUrl;
  }

  const box: React.CSSProperties = { minHeight: "60vh", display: "grid", placeItems: "center" };
  if (loading || (user && base.isLoading)) return <div style={box}>…</div>;
  if (!user) return (
    <div style={box} data-testid="learn-signin"><p><a href={`/t/${slug}`} style={{ textDecoration: "underline" }}>{t("سجّل الدخول من صفحة المدرب", "Sign in from the trainer page")}</a></p></div>
  );
  const d = base.data;
  if (!d) return <div style={box}>{t("الصفحة غير متاحة", "Page not available")}</div>;
  const approved = d.member?.status === "approved" || d.member?.role === "admin";
  if (!approved) return (
    <div style={box} data-testid="learn-notmember"><p><a href={`/t/${slug}`} style={{ textDecoration: "underline" }}>{t("انضم أولاً عبر صفحة المدرب (أو انتظر موافقته)", "Join through the trainer page first (or wait for approval)")}</a></p></div>
  );

  const vars = themeVars(themeByKey(d.theme)) as React.CSSProperties;
  const enrolledIds = new Set(d.enrollments.map((e) => e.course_id));
  const current = viewing ? d.enrollments.find((e) => e.id === viewing && e.status === "approved") : null;
  return (
    <div dir={ar ? "rtl" : "ltr"} lang={lang} style={{ ...vars, minHeight: "100vh", background: "var(--tl-bg)", color: "var(--tl-ink)", fontFamily: "'Thmanyah Sans',system-ui,sans-serif" }}>
      <header style={{ display: "flex", gap: 16, alignItems: "center", padding: "18px 6vw", borderBottom: "2px solid var(--tl-ink)" }}>
        <b style={{ marginInlineEnd: "auto" }}>{d.tenant.name}</b>
        <a href={`/t/${slug}`} style={{ color: "inherit" }}>{t("الصفحة الرئيسية", "Home")}</a>
      </header>
      <main style={{ padding: "2rem 6vw", display: "grid", gap: "2rem" }}>
        {current ? (
          <div style={{ background: "#0b1736", color: "#fff", borderRadius: 16, padding: 16 }} data-testid="learn-course">
            <CourseDetail enrollment={current} onBack={() => setViewing(null)} onDownloadCert={downloadCert} onRefresh={() => qc.invalidateQueries({ queryKey: ["tenant-learn"] })} />
          </div>
        ) : (
          <section>
            <h2 style={{ fontSize: "1.6rem", marginBottom: 12 }}>{t("كورساتك عند", "Your courses with")} {d.tenant.name}</h2>
            {d.courses.length === 0 && <p>{t("لا توجد كورسات منشورة بعد.", "No courses published yet.")}</p>}
            <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
              {d.courses.map((c) => {
                const e = d.enrollments.find((x) => x.course_id === c.id);
                return (
                  <li key={c.id} style={{ border: "2px solid var(--tl-ink)", padding: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 180 }}><b>{c.title}</b><p style={{ opacity: 0.8 }}>{c.description}</p></div>
                    {!e && !enrolledIds.has(c.id) && <button onClick={() => apply(c.id)} style={{ padding: "8px 18px", background: "var(--tl-accent)", color: "var(--tl-accent-ink)", fontWeight: 700 }}>{t("تقديم طلب", "Apply")}</button>}
                    {e?.status === "pending" && <span>{t("بانتظار موافقة المدرب", "Waiting for approval")}</span>}
                    {e?.status === "approved" && <button onClick={() => setViewing(e.id)} style={{ padding: "8px 18px", background: "var(--tl-accent)", color: "var(--tl-accent-ink)", fontWeight: 700 }}>{t("ابدأ الدراسة", "Study")}</button>}
                    {e && e.status !== "pending" && e.status !== "approved" && <span>{t("غير متاح", "Not available")}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {!current && <LearnerTools tenantId={d.tenant.id} lang={ar ? "ar" : "en"} />}
      </main>
    </div>
  );
}
