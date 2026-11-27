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
