import type { CSSProperties, FormEvent } from "react";

export type PublicTenant = { id: string; slug: string; name: string; feature_landing: boolean };
export type Landing = { headline: string | null; subtitle: string | null; about: string | null; theme: string | null; logo_url: string | null; published: boolean };
export type LandingCourse = { id: string; title: string; description: string | null; total_hours: number | null; cover_emoji: string | null };

const COPY = {
  en: { kicker: "Learning with", courses: "Courses", join: "Join", register: "Register as a learner", none: "No courses published yet.",
    create: "Create your learner account", signin: "Sign in", signedIn: "You are signed in", name: "Full name", email: "Email", password: "Password",
    submitUp: "Register", submitIn: "Sign in", toIn: "Already registered? Sign in", toUp: "New here? Register", registerWith: "Register with",
    joined: "Done. You are registered with this trainer.", confirm: "Check your email to confirm, then sign in here to finish joining.", hours: "h" },
  ar: { kicker: "تعلّم مع", courses: "الكورسات", join: "انضم", register: "سجّل كمتدرب", none: "لا توجد كورسات منشورة بعد.",
    create: "أنشئ حساب المتدرب", signin: "تسجيل الدخول", signedIn: "أنت مسجّل الدخول", name: "الاسم الكامل", email: "البريد الإلكتروني", password: "كلمة المرور",
    submitUp: "تسجيل", submitIn: "دخول", toIn: "عندك حساب؟ سجّل الدخول", toUp: "جديد هنا؟ سجّل", registerWith: "سجّل عند",
    joined: "تم. أنت الآن مسجّل عند هذا المدرب.", confirm: "راجع بريدك لتأكيد الحساب، ثم سجّل الدخول هنا لإكمال الانضمام.", hours: "س" },
} as const;

type Props = {
  tenant: PublicTenant; landing: Landing; courses: LandingCourse[]; lang: "ar" | "en"; vars: Record<string, string>;
  signedIn: boolean; mode: "signup" | "login"; setMode: (m: "signup" | "login") => void;
  form: { name: string; email: string; password: string }; setForm: (f: { name: string; email: string; password: string }) => void;
  busy: boolean; msg: string | null; onSubmit: (e: FormEvent) => void; onJoin: () => void;
};

// Presentational trainer page. Own layout and styling (paper background, oversized type, offset block,
// numbered course list), deliberately not a variant of the owner's homepage. Colours come only from the theme vars.
export function TenantLandingView(p: Props) {
  const c = COPY[p.lang];
  const { tenant, landing, courses } = p;
  const msg = p.msg === "joined" ? c.joined : p.msg === "confirm" ? c.confirm : p.msg?.startsWith("err:") ? p.msg.slice(4) : p.msg;
  return (
    <div className="tl-root" dir={p.lang === "ar" ? "rtl" : "ltr"} lang={p.lang} style={p.vars as CSSProperties}>
      <style>{CSS}</style>
      <header className="tl-top">
        <span className="tl-mark">{landing.logo_url ? <img src={landing.logo_url} alt="" /> : tenant.name.slice(0, 1)}</span>
        <b>{tenant.name}</b>
        <a href="#courses">{c.courses}</a><a href="#join" className="tl-pill">{c.join}</a>
      </header>
      <section className="tl-hero">
        <p className="tl-kicker">{c.kicker} {tenant.name}</p>
        <h1>{landing.headline || tenant.name}</h1>
        <p className="tl-sub">{landing.subtitle}</p>
        <a href="#join" className="tl-cta">{c.register}</a>
        <div className="tl-block" aria-hidden />
      </section>
      {landing.about && <section className="tl-about"><p>{landing.about}</p></section>}
      <section id="courses" className="tl-courses">
        <h2>{c.courses}</h2>
        {courses.length === 0 && <p className="tl-muted">{c.none}</p>}
        <ol>
          {courses.map((x, i) => (
            <li key={x.id}><span className="tl-num">{String(i + 1).padStart(2, "0")}</span>
              <div><h3>{x.cover_emoji} {x.title}</h3><p>{x.description}</p></div>
              <em>{x.total_hours ? `${x.total_hours}${c.hours}` : ""}</em></li>
          ))}
        </ol>
      </section>
      <section id="join" className="tl-join">
        <h2>{p.signedIn ? c.signedIn : p.mode === "signup" ? c.create : c.signin}</h2>
        {p.signedIn ? (
          <button className="tl-cta" onClick={p.onJoin}>{c.registerWith} {tenant.name}</button>
        ) : (
          <form onSubmit={p.onSubmit}>
            {p.mode === "signup" && <input required placeholder={c.name} value={p.form.name} onChange={(e) => p.setForm({ ...p.form, name: e.target.value })} />}
            <input required type="email" dir="ltr" placeholder={c.email} value={p.form.email} onChange={(e) => p.setForm({ ...p.form, email: e.target.value })} />
            <input required type="password" dir="ltr" minLength={8} placeholder={c.password} value={p.form.password} onChange={(e) => p.setForm({ ...p.form, password: e.target.value })} />
            <button className="tl-cta" disabled={p.busy}>{p.mode === "signup" ? c.submitUp : c.submitIn}</button>
            <button type="button" className="tl-link" onClick={() => p.setMode(p.mode === "signup" ? "login" : "signup")}>{p.mode === "signup" ? c.toIn : c.toUp}</button>
          </form>
        )}
        {msg && <p className="tl-msg" role="status">{msg}</p>}
      </section>
    </div>
  );
}

const CSS = `
.tl-root{min-height:100vh;background:var(--tl-bg);color:var(--tl-ink);font-family:'Thmanyah Sans','Thmanyah Serif Display',system-ui,sans-serif;--a:var(--tl-accent)}
.tl-wrap{min-height:60vh;display:grid;place-items:center}
.tl-top{display:flex;align-items:center;gap:18px;padding:18px 6vw;border-bottom:2px solid var(--tl-ink)}
.tl-top b{margin-inline-end:auto;font-size:1.05rem}.tl-top a{color:inherit;text-decoration:none;font-weight:600}
.tl-mark{width:38px;height:38px;border-radius:10px;background:var(--a);color:var(--tl-accent-ink);display:grid;place-items:center;font-weight:800;overflow:hidden}.tl-mark img{width:100%;height:100%;object-fit:cover}
.tl-pill{border:2px solid var(--tl-ink);padding:6px 16px;border-radius:999px}
.tl-hero{position:relative;padding:5rem 6vw 6rem;overflow:hidden}
.tl-kicker{letter-spacing:.14em;text-transform:uppercase;font-size:.78rem;color:var(--a);font-weight:700}
.tl-root h1,.tl-root h2{font-family:'Thmanyah Serif Display','Thmanyah Sans',serif}
.tl-hero h1{font-size:clamp(2.6rem,9vw,6.4rem);line-height:.98;font-weight:800;max-width:14ch;margin:.3em 0}
.tl-sub{max-width:46ch;font-size:1.15rem;opacity:.82}
.tl-cta{display:inline-block;margin-top:24px;background:var(--a);color:var(--tl-accent-ink);border:0;border-radius:0;padding:14px 26px;font-weight:700;font-size:1rem;cursor:pointer;box-shadow:6px 6px 0 var(--tl-ink);text-decoration:none}
.tl-block{position:absolute;inset-inline-end:-70px;bottom:-110px;width:min(18vw,170px);aspect-ratio:1;background:var(--a);opacity:.9;transform:rotate(8deg);z-index:0}
.tl-hero>*:not(.tl-block){position:relative;z-index:1}
.tl-about{background:var(--tl-panel);color:var(--tl-panel-ink);padding:3.5rem 6vw;font-size:1.25rem;line-height:1.7}.tl-about p{max-width:62ch}
.tl-courses{padding:4rem 6vw}.tl-courses h2,.tl-join h2{font-size:2rem;margin-bottom:20px}
.tl-courses ol{list-style:none;padding:0;margin:0;border-top:2px solid var(--tl-ink)}
.tl-courses li{display:grid;grid-template-columns:70px 1fr auto;gap:18px;padding:22px 0;border-bottom:2px solid var(--tl-ink);align-items:start}
.tl-num{font-size:2rem;font-weight:800;color:var(--a)}.tl-courses h3{font-size:1.3rem;font-weight:700}.tl-courses p,.tl-muted{opacity:.82}
.tl-join{padding:3.5rem 6vw 5rem;border-top:2px solid var(--tl-ink);max-width:640px}
.tl-join form{display:grid;gap:12px}.tl-join input{padding:13px;border:2px solid var(--tl-ink);background:var(--tl-bg);color:var(--tl-ink);font:inherit}
.tl-link{background:none;border:0;text-decoration:underline;cursor:pointer;font:inherit;justify-self:start}.tl-msg{margin-top:14px;font-weight:600}
`;
