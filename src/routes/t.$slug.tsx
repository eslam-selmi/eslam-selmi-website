import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { tdb, isDbMissing } from "@/lib/tenants";

// Trainer public page. Deliberately its own layout and styling (sand paper, oversized type, offset blocks),
// not a variant of the owner's homepage. Content comes from the trainer's own tenant_landing row.
export const Route = createFileRoute("/t/$slug")({
  ssr: false,
  head: ({ params }) => ({ meta: [{ title: `${params.slug}` }, { name: "robots", content: "index,follow" }] }),
  component: TenantLanding,
});

type PublicTenant = { id: string; slug: string; name: string; feature_landing: boolean };
type Landing = { headline: string | null; subtitle: string | null; about: string | null; brand_color: string | null; logo_url: string | null; published: boolean };

function safeColor(c?: string | null) {
  return c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#c2410c";
}

function TenantLanding() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
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

  if (q.isLoading) return <div className="tl-wrap"><p>…</p></div>;
  if (q.error) {
    return <div className="tl-wrap"><p>{isDbMissing(q.error as any) ? "Not available yet." : "Something went wrong."}</p></div>;
  }
  if (!q.data || !q.data.landing?.published) return <div className="tl-wrap"><p>Page not found.</p></div>;
  const { tenant, landing, courses } = q.data;
  const accent = safeColor(landing.brand_color);

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
        if (data.session) { await join(); setMsg("Welcome. You are registered with " + tenant.name + "."); }
        else setMsg("Check your email to confirm, then sign in here to finish joining.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        await join();
        setMsg("Signed in. You are registered with " + tenant.name + ".");
      }
      qc.invalidateQueries();
    } catch (err: any) { setMsg(err.message || "Failed"); }
    setBusy(false);
  }

  return (
    <div className="tl-root" style={{ ["--tl-accent" as any]: accent }}>
      <style>{CSS}</style>
      <header className="tl-top">
        <span className="tl-mark">{landing.logo_url ? <img src={landing.logo_url} alt="" /> : tenant.name.slice(0, 1)}</span>
        <b>{tenant.name}</b>
        <a href="#courses">Courses</a><a href="#join" className="tl-pill">Join</a>
      </header>
      <section className="tl-hero">
        <p className="tl-kicker">Learning with {tenant.name}</p>
        <h1>{landing.headline || tenant.name}</h1>
        <p className="tl-sub">{landing.subtitle}</p>
        <a href="#join" className="tl-cta">Register as a learner</a>
        <div className="tl-block" aria-hidden />
      </section>
      {landing.about && <section className="tl-about"><p>{landing.about}</p></section>}
      <section id="courses" className="tl-courses">
        <h2>Courses</h2>
        {courses.length === 0 && <p className="tl-muted">No courses published yet.</p>}
        <ol>
          {courses.map((c, i) => (
            <li key={c.id}><span className="tl-num">{String(i + 1).padStart(2, "0")}</span>
              <div><h3>{c.cover_emoji} {c.title}</h3><p>{c.description}</p></div>
              <em>{c.total_hours ? `${c.total_hours}h` : ""}</em></li>
          ))}
        </ol>
      </section>
      <section id="join" className="tl-join">
        <h2>{user ? "You are signed in" : mode === "signup" ? "Create your learner account" : "Sign in"}</h2>
        {user ? (
          <button className="tl-cta" onClick={async () => { try { await join(); setMsg("Registered with " + tenant.name + "."); } catch (e: any) { setMsg(e.message); } }}>Register with {tenant.name}</button>
        ) : (
          <form onSubmit={submit}>
            {mode === "signup" && <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required type="password" minLength={8} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button className="tl-cta" disabled={busy}>{mode === "signup" ? "Register" : "Sign in"}</button>
            <button type="button" className="tl-link" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Already registered? Sign in" : "New here? Register"}</button>
          </form>
        )}
        {msg && <p className="tl-msg" role="status">{msg}</p>}
      </section>
    </div>
  );
}

const CSS = `
.tl-root{min-height:100vh;background:#f4ede1;color:#1f1a14;font-family:'IBM Plex Sans Arabic',system-ui,sans-serif;--a:var(--tl-accent)}
.tl-wrap{min-height:60vh;display:grid;place-items:center}
.tl-top{display:flex;align-items:center;gap:18px;padding:18px 6vw;border-bottom:2px solid #1f1a14}
.tl-top b{margin-inline-end:auto;font-size:1.05rem}.tl-top a{color:inherit;text-decoration:none;font-weight:600}
.tl-mark{width:38px;height:38px;border-radius:10px;background:var(--a);color:#fff;display:grid;place-items:center;font-weight:800;overflow:hidden}.tl-mark img{width:100%;height:100%;object-fit:cover}
.tl-pill{border:2px solid #1f1a14;padding:6px 16px;border-radius:999px}
.tl-hero{position:relative;padding:9vh 6vw 8vh;overflow:hidden}
.tl-kicker{letter-spacing:.14em;text-transform:uppercase;font-size:.78rem;color:var(--a);font-weight:700}
.tl-hero h1{font-size:clamp(2.6rem,9vw,6.4rem);line-height:.98;font-weight:800;max-width:14ch;margin:.3em 0}
.tl-sub{max-width:46ch;font-size:1.15rem;color:#4a4136}
.tl-cta{display:inline-block;margin-top:24px;background:var(--a);color:#fff;border:0;border-radius:0;padding:14px 26px;font-weight:700;font-size:1rem;cursor:pointer;box-shadow:6px 6px 0 #1f1a14;text-decoration:none}
.tl-block{position:absolute;inset-inline-end:-40px;top:12vh;width:min(34vw,340px);aspect-ratio:1;background:var(--a);opacity:.9;transform:rotate(8deg);z-index:0}
.tl-hero>*:not(.tl-block){position:relative;z-index:1}
.tl-about{background:#1f1a14;color:#f4ede1;padding:7vh 6vw;font-size:1.25rem;line-height:1.7}.tl-about p{max-width:62ch}
.tl-courses{padding:8vh 6vw}.tl-courses h2,.tl-join h2{font-size:2rem;margin-bottom:20px}
.tl-courses ol{list-style:none;padding:0;margin:0;border-top:2px solid #1f1a14}
.tl-courses li{display:grid;grid-template-columns:70px 1fr auto;gap:18px;padding:22px 0;border-bottom:2px solid #1f1a14;align-items:start}
.tl-num{font-size:2rem;font-weight:800;color:var(--a)}.tl-courses h3{font-size:1.3rem;font-weight:700}.tl-courses p,.tl-muted{color:#4a4136}
.tl-join{padding:7vh 6vw 12vh;border-top:2px solid #1f1a14;max-width:640px}
.tl-join form{display:grid;gap:12px}.tl-join input{padding:13px;border:2px solid #1f1a14;background:#fff;font:inherit}
.tl-link{background:none;border:0;text-decoration:underline;cursor:pointer;font:inherit;justify-self:start}.tl-msg{margin-top:14px;font-weight:600}
`;
