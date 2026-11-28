/** Maintenance gate decision. Pure, so it is unit-tested.
 *  Maintenance on: visitors see the maintenance page (except account/admin/auth paths); signed-in users pass,
 *  except the homepage "/", which only an admin may open (everyone else signed in goes to their portal). */
export const MAINTENANCE_ALLOWED_PREFIXES = ["/admin", "/auth", "/portal", "/onboarding", "/verify"];

export function isMaintenanceAllowedPath(pathname: string): boolean {
  return MAINTENANCE_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export type MaintenanceDecision = "show" | "hide" | "maintenance-page" | "to-portal";

export function maintenanceDecision(opts: {
  pathname: string;
  /** null = setting not read yet */
  enabled: boolean | null;
  session: "unknown" | "none" | "user";
  /** null = role not known yet */
  isAdmin: boolean | null;
}): MaintenanceDecision {
  const allowed = isMaintenanceAllowedPath(opts.pathname);
  if (opts.enabled === null || opts.session === "unknown") return allowed ? "show" : "hide";
  if (!opts.enabled) return "show";
  if (opts.session === "none") return allowed ? "show" : "maintenance-page";
  if (opts.pathname !== "/") return "show";
  if (opts.isAdmin === null) return "hide";
  return opts.isAdmin ? "show" : "to-portal";
}
