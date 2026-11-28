import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/portal-auth";
import { useI18n } from "@/lib/i18n";
import { tdb, normalizeSlug, SLUG_RE, isDbMissing, type TenantRequest } from "@/lib/tenants";

export const Route = createFileRoute("/become-trainer")({
  ssr: false,
  head: () => ({ meta: [{ title: "Register as a trainer" }] }),
  component: BecomeTrainer,
});

function BecomeTrainer() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [slug, setSlug] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const mine = useQuery({
    enabled: !!user,
    queryKey: ["my-tenant-request", user?.id],
    queryFn: async () => {
      const { data } = await tdb.from("tenant_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1);
      return (data as TenantRequest[])?.[0] ?? null;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = normalizeSlug(slug);
    if (!SLUG_RE.test(s)) return setMsg(t("الرابط: حروف إنجليزية صغيرة وأرقام وشرطة، من 3 إلى 40.", "Link: lowercase letters, digits and dashes, 3 to 40 characters."));
    const { error } = await tdb.from("tenant_requests").insert({ user_id: user!.id, full_name: name.trim(), specialty: specialty.trim() || null, requested_slug: s });
    if (error) return setMsg(isDbMissing(error) ? t("الخدمة غير متاحة بعد.", "Not available yet.") : error.message);
    setMsg(t("تم إرسال طلبك، بانتظار موافقة المالك.", "Request sent. Waiting for the owner's approval."));
    mine.refetch();
  }

  if (loading) return null;
  return (
    <main className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t("سجّل كمدرب", "Register as a trainer")}</h1>
      {!user ? (
        <p>{t("سجّل الدخول أو أنشئ حسابًا أولًا ثم ارجع لهذه الصفحة.", "Sign in or create an account first, then come back to this page.")} <Link to="/auth" className="underline">/auth</Link></p>
      ) : mine.data && mine.data.status !== "rejected" ? (
        <p className="rounded-xl border p-4">{mine.data.status === "pending" ? t("طلبك قيد المراجعة.", "Your request is under review.") : t("تمت الموافقة. افتح لوحة المدرب.", "Approved. Open your trainer dashboard.")} {mine.data.status === "approved" && <Link to="/trainer" className="underline">/trainer</Link>}</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input required className="w-full border rounded px-3 py-2 bg-background" placeholder={t("الاسم", "Name")} value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full border rounded px-3 py-2 bg-background" placeholder={t("التخصص", "Specialty")} value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
          <input required dir="ltr" className="w-full border rounded px-3 py-2 bg-background" placeholder="my-name" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <p className="text-xs text-muted-foreground" dir="ltr">/t/{normalizeSlug(slug) || "my-name"}</p>
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">{t("إرسال الطلب", "Send request")}</button>
        </form>
      )}
      {msg && <p role="status" className="text-sm">{msg}</p>}
    </main>
  );
}
