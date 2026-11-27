import { useEffect, useState } from "react";
import { Link, useMatch, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSiteProfile } from "@/lib/site-profile";
import type { HomeLockLoad } from "@/lib/home-lock.functions";
import { HOME_LOCK_KEY, homeLockDecision, parseHomeLock, type HomeLockConfig } from "@/lib/home-lock";

/** Hides the homepage ("/") when the admin turns the lock on. Admins always see it; trainees go to their portal; visitors see a branded screen.
 *  Display lock only: the homepage data itself stays publicly readable. */
export function HomeLockGate({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // The "/" loader reads the setting on the server, so SSR already renders the right screen (no empty-HTML regression when unlocked).
  const loaded = useMatch({ from: "/", shouldThrow: false })?.loaderData as HomeLockLoad | undefined;
  const [config, setConfig] = useState<HomeLockConfig | null | "failed">(loaded && loaded.ok ? loaded.config : null);
  const [session, setSession] = useState<"unknown" | "none" | "user">("unknown");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname !== "/") return;
    if (loaded && loaded.ok) { setConfig(loaded.config); return; }
    let alive = true;
    (async () => {
      let failed = true;
      let content: unknown = null;
      for (let i = 0; i < 3 && failed; i++) {
        const res = await supabase.from("site_content").select("content").eq("section_key", HOME_LOCK_KEY).maybeSingle();
        if (!res.error) { content = (res.data as { content?: unknown } | null)?.content ?? null; failed = false; }
        else if (i < 2) await new Promise((r) => setTimeout(r, 800));
      }
      if (alive) setConfig(failed ? "failed" : parseHomeLock(content));
    })();
    return () => { alive = false; };
  }, [pathname, loaded]);

  useEffect(() => {
    if (pathname !== "/") return;
    let alive = true;
    const check = async (userId: string | null) => {
      if (!userId) { if (alive) { setSession("none"); setIsAdmin(false); } return; }
      if (alive) setSession("user");
      try {
        const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (alive) setIsAdmin(error ? false : data === true);
      } catch { if (alive) setIsAdmin(false); }
    };
    supabase.auth.getSession().then(({ data }) => check(data.session?.user?.id ?? null)).catch(() => alive && (setSession("none"), setIsAdmin(false)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setIsAdmin(null); void check(s?.user?.id ?? null); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [pathname]);

  const decision = homeLockDecision({ pathname, config, session, isAdmin });

  useEffect(() => {
    if (decision === "to-portal") void navigate({ to: "/portal", replace: true });
  }, [decision, navigate]);

  if (decision === "show") return <>{children}</>;
  if (decision === "locked-visitor") return <HomeLockScreen config={config === "failed" ? null : config} />;
  // "hide" and "to-portal": solid cover, nothing of the homepage is rendered
  return <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#07112a" }} />;
}

function HomeLockScreen({ config }: { config: HomeLockConfig | null }) {
  const { lang } = useI18n();
  const { profile } = useSiteProfile();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const custom = lang === "ar" ? config?.message_ar : config?.message_en;
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="relative min-h-screen overflow-hidden flex items-center justify-center px-5 py-12"
      style={{ background: "radial-gradient(ellipse 85% 55% at 12% -5%, oklch(0.55 0.18 258 / 0.45), transparent 60%), radial-gradient(ellipse 70% 50% at 88% -8%, oklch(0.72 0.13 180 / 0.22), transparent 60%), linear-gradient(180deg, #07112a 0%, #0a1635 40%, #08122a 100%)" }}>
      <div className="relative w-full max-w-md rounded-[28px] p-8 md:p-10 text-center text-white"
        style={{ background: "linear-gradient(160deg, oklch(1 0 0 / 0.06), transparent 45%), linear-gradient(180deg, #0d1a3d 0%, #0b1736 55%, #08122a 100%)", border: "1px solid oklch(0.78 0.14 90 / 0.28)", boxShadow: "0 50px 120px -30px oklch(0 0 0 / 0.8), inset 0 1px 0 oklch(1 0 0 / 0.08)" }}>
        <LockLogo src={profile.logoDark} />
        <h1 className="text-xl font-bold mb-2">{t("هذه المنطقة للمتدربين", "This area is for trainees")}</h1>
        <p className="text-sm text-white/65 leading-relaxed mb-7 whitespace-pre-line">
          {custom || t("سجّل دخولك للوصول إلى كورساتك وأدواتك وكل ما يخصك.", "Sign in to reach your courses, tools and everything that is yours.")}
        </p>
        <Link to="/auth" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl font-bold text-sm text-[#0b1736]" style={{ background: "var(--gold, #f2b94b)" }}>
          <LogIn className="w-4 h-4" />{t("تسجيل الدخول", "Sign in")}
        </Link>
      </div>
    </div>
  );
}

/** Logo with a clean text fallback, never a broken-image icon. */
function LockLogo({ src }: { src?: string | null }) {
  const [bad, setBad] = useState(false);
  if (src && !bad) return <img src={src} alt="Eslam Selmi" width={88} height={88} onError={() => setBad(true)} className="mx-auto mb-5 object-contain" />;
  return <div className="mx-auto mb-5 text-2xl font-extrabold tracking-wide" style={{ color: "var(--gold, #f2b94b)" }} dir="ltr">Eslam Selmi</div>;
}
