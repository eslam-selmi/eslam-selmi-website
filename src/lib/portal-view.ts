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
