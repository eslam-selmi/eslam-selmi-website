import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MaintenancePage } from "./MaintenancePage";
import { maintenanceDecision } from "@/lib/maintenance-gate";

type Config = {
  enabled: boolean;
  message_ar: string;
  message_en: string;
  until: string | null;
};

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [adminCheck, setAdminCheck] = useState<{ id: string; admin: boolean } | null>(null);
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);
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
        if (alive) setUserId(!error ? data.session?.user?.id ?? null : null);
      } catch {
        if (alive) setUserId(null); // a broken or stale session must not open a maintenance site
      }
      if (alive) setSessionChecked(true);
    };
    sync();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (alive) setUserId(session?.user?.id ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  // Admin check, only to decide who may open the homepage while maintenance is on. A failed check means "not admin".
  // The result is tied to the user id, so a new session is "unknown" (page hidden) until its own check finishes.
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      let admin = false;
      try {
        const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
        admin = !error && data === true;
      } catch { admin = false; }
      if (alive) setAdminCheck({ id: userId, admin });
    })();
    return () => { alive = false; };
  }, [userId]);
  const isAdmin = !userId ? false : adminCheck?.id === userId ? adminCheck.admin : null;

  const decision = maintenanceDecision({
    pathname: location,
    enabled: config ? config.enabled : null,
    session: !sessionChecked ? "unknown" : userId ? "user" : "none",
    isAdmin,
  });

  useEffect(() => {
    if (decision === "to-portal") void navigate({ to: "/portal", replace: true });
  }, [decision, navigate]);

  if (decision === "show") return <>{children}</>;
  if (decision === "to-portal") return <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#07112a" }} />;
  if (decision === "hide") {
    // Until the maintenance setting, session and role are known, keep the page hidden so visitors never see it flash.
    return (
      <>
        <div aria-hidden style={{ visibility: "hidden" }}>{children}</div>
        <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#07112a" }} />
      </>
    );
  }

  const lang = typeof document !== "undefined" ? document.documentElement.getAttribute("lang") : "ar";
  const message = lang === "en" ? (config?.message_en || config?.message_ar) : (config?.message_ar || config?.message_en);
  return <MaintenancePage message={message ?? ""} until={config?.until ?? null} />;
}
