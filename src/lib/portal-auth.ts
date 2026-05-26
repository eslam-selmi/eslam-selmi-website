import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "trainee" | "trainer" | null;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [forcePasswordReset, setForcePasswordReset] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => fetchRoleAndFlags(s.user.id), 0);
      } else {
        setRole(null);
        setForcePasswordReset(false);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchRoleAndFlags(data.session.user.id);
      } else {
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRoleAndFlags(uid: string) {
    const [roleRes, profRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
      supabase.from("profiles").select("force_password_reset").eq("id", uid).maybeSingle(),
    ]);
    setRole((roleRes.data?.role as Role) ?? "trainee");
    setForcePasswordReset(Boolean(profRes.data?.force_password_reset));
    setLoading(false);
  }

  return { session, user, role, loading, forcePasswordReset };
}

export async function signOut() {
  await supabase.auth.signOut();
}
