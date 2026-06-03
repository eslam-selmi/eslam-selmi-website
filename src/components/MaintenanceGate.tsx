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

const ALLOWED_PREFIXES = ["/admin", "/auth", "/portal", "/trainer", "/onboarding", "/verify"];

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const location = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "site.maintenance")
        .maybeSingle();
      if (!alive) return;
      const c = (data?.content ?? {}) as Partial<Config>;
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
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { if (alive) setIsAdmin(false); return; }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (alive) setIsAdmin(!!data);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getUser().then(async ({ data: u }) => {
        if (!alive) return;
        if (!u.user) { setIsAdmin(false); return; }
        const { data } = await supabase
          .from("user_roles").select("role")
          .eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
        if (alive) setIsAdmin(!!data);
      });
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  if (!config) return <>{children}</>;
  if (!config.enabled) return <>{children}</>;
  if (isAdmin) return <>{children}</>;
  if (ALLOWED_PREFIXES.some((p) => location === p || location.startsWith(p + "/"))) {
    return <>{children}</>;
  }

  const lang = typeof document !== "undefined" ? document.documentElement.getAttribute("lang") : "ar";
  const message = lang === "en" ? (config.message_en || config.message_ar) : (config.message_ar || config.message_en);
  return <MaintenancePage message={message} until={config.until} />;
}
