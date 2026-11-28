// Which enrollment the portal may open as a course view.
// Pending enrollments open the locked preview (titles only, the server limits what comes back).
// Suspended (blocked) enrollments never open it, not even through a ?view= link.
export type ViewableEnrollment = { id: string; blocked?: boolean | null };

export function resolveViewing<T extends ViewableEnrollment>(enrollments: T[], viewingId: string | null | undefined): T | null {
  if (!viewingId) return null;
  const e = enrollments.find((x) => x.id === viewingId);
  if (!e || e.blocked) return null;
  return e;
}

type Enr = { id: string; course_id: string; status: string; blocked?: boolean | null; certificate_issued?: boolean | null; certificate_requested_at?: string | null };
type Mod = { course_id: string; completed_by_admin?: boolean | null };

// First approved, not suspended course that still has unfinished content.
export function pickContinueTarget<E extends Enr, M extends Mod>(enrollments: E[], modules: M[]) {
  for (const e of enrollments) {
    if (e.status !== "approved" || e.blocked) continue;
    const ms = modules.filter((m) => m.course_id === e.course_id);
    if (ms.length === 0 || ms.every((m) => m.completed_by_admin)) continue;
    const done = ms.filter((m) => m.completed_by_admin).length;
    return { en: e, progress: Math.round((done / ms.length) * 100), done, total: ms.length };
  }
  return null;
}

// First approved, not suspended course with no certificate issued or requested.
export function pickReadyForCert<E extends Enr>(enrollments: E[]): E | null {
  return enrollments.filter((e) => e.status === "approved").find((e) => !e.certificate_issued && !e.certificate_requested_at && !e.blocked) ?? null;
}

// Keep ?view= in the URL only while the portal is the current page and the value really differs.
// Without the path check, clicking a link to another page (e.g. /tools?t=exam) re-ran the sync
// effect from the still-mounted portal and replaced the URL back to /portal.
export function shouldSyncViewParam(pathname: string, currentView: string | null | undefined, viewingId: string | null | undefined): boolean {
  if (pathname !== "/portal" && pathname !== "/portal/") return false;
  return (currentView || null) !== (viewingId || null);
}
