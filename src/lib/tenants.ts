import { supabase } from "@/integrations/supabase/client";

// The tenant tables come from migration 20261128100000_tenant_foundation (prepared, not applied yet).
// Generated Supabase types do not know them, so access goes through one loosely typed handle.
// Authorization is enforced by database policies, never by these helpers.
export const tdb = supabase as any;

export type Tenant = {
  id: string;
  slug: string;
  kind: "platform" | "trainer";
  name: string;
  status: "active" | "suspended";
  feature_tools_upload: boolean;
  feature_landing: boolean;
  feature_custom_domain: boolean;
  max_courses: number | null;
};

export type TenantRequest = {
  id: string;
  user_id: string;
  full_name: string;
  specialty: string | null;
  requested_slug: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type TenantDomain = {
  id: string;
  tenant_id: string;
  hostname: string;
  verification_token: string;
  status: "requested" | "verified" | "active" | "disabled";
};

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const HOST_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/;

export function normalizeSlug(v: string) {
  return v.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export function isDbMissing(error: { message?: string; code?: string } | null | undefined) {
  const m = error?.message || "";
  return error?.code === "42P01" || error?.code === "PGRST205" || /could not find the table|does not exist/i.test(m);
}
