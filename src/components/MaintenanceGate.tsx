import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MaintenancePage } from "./MaintenancePage";

type Config = {
  enabled: boolean;
  message_ar: string;
  message_en: string;
  until: string | null;
};

const ALLOWED_PREFIXES = ["/admin", "/auth", "/portal", "/onboarding", "/verify"];
// A signed-in course-only account (assigned by the admin with email + password) reaches only its course and the login/portal pages while the site is under maintenance.
const COURSE_ONLY_PREFIXES = ["/auth", "/portal", "/course-", "/c/"];

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  // null = unknown yet. Unknown is treated as restricted so a course-only account never sees the closed site flash.
  const [courseOnly, setCourseOnly] = useState<boolean | null>(null);
  const location = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let alive = true;
    (async () => {
      let data: { content: unknown } | null = null;
      let failed = true;
      // Fail closed: a failed read must never open a site that is under maintenance. Retry, then keep the maintenance page.
      for (let i = 0; i < 3 && failed; i++) {
        const res = await supabase
          .from("site_content")
          .select("content")
          .eq("section_key", "site.maintenance")
          .maybeSingle();
        if (!res.error) { data = res.data; failed = false; } else if (i < 2) { await new Promise((r) => setTimeout(r, 800)); }
      }
      if (!alive) return;
      if (failed) {
        setConfig({ enabled: true, message_ar: "", message_en: "", until: null });
        return;
      }
      const c = ((data as { content?: unknown } | null)?.content ?? {}) as Partial<Config>;
      setConfig({
        enabled: !!c.enabled,
        message_ar: c.message_ar || "",
        message_en: c.message_en || "",
        until: c.until || null,
      });
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (alive) setSignedIn(!error && !!data.session?.user);
      } catch {
        if (alive) setSignedIn(false); // a broken or stale session must not open a maintenance site
      }
      if (alive) setSessionChecked(true);
    };
    sync();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (alive) setSignedIn(!!session?.user);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!signedIn) { setCourseOnly(false); return; }
    setCourseOnly(null);
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) { if (alive) setCourseOnly(false); return; }
      const { data, error } = await (supabase as any).from("course_only_accounts").select("user_id").eq("user_id", uid).maybeSingle();
      if (alive) setCourseOnly(error ? true : !!data);
    })();
    return () => { alive = false; };
  }, [signedIn]);

  const allowedPath = ALLOWED_PREFIXES.some((p) => location === p || location.startsWith(p + "/"));
  if ((!config || !sessionChecked) && !allowedPath) {
    // Until the maintenance setting and the session are known, keep the page hidden so visitors never see it flash.
    return (
      <>
        <div aria-hidden style={{ visibility: "hidden" }}>{children}</div>
        <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#07112a" }} />
      </>
    );
  }
  if (!config) return <>{children}</>;
  if (!config.enabled) return <>{children}</>;
  if (signedIn && courseOnly === false) return <>{children}</>;
  if (signedIn) {
    // Course-only (or still checking): only the course, login and portal pages open.
    if (COURSE_ONLY_PREFIXES.some((p) => location === p || location.startsWith(p))) return <>{children}</>;
  }
  if (ALLOWED_PREFIXES.some((p) => location === p || location.startsWith(p + "/"))) {
    return <>{children}</>;
  }

  const lang = typeof document !== "undefined" ? document.documentElement.getAttribute("lang") : "ar";
  const message = lang === "en" ? (config.message_en || config.message_ar) : (config.message_ar || config.message_en);
  return <MaintenancePage message={message} until={config.until} />;
}
