/**
 * Share-link use cases on top of course-share-core. Pure: all I/O goes through ShareStore,
 * so the rules are tested without a database. The server-function layer injects a
 * service-role store. Nothing here writes anywhere by itself.
 */
import {
  decideAccess, newToken, sha256, courseFinished, shouldClose,
  type ShareLinkRow, type Progress, type Item, type AccessDecision,
} from "./course-share-core";

export interface ShareStore {
  findByTokenHash(hash: string): Promise<ShareLinkRow | null>;
  insert(row: Omit<ShareLinkRow, "id"> & { created_by: string }): Promise<ShareLinkRow>;
  /** Atomic: set claim_hash only if it is still null. Returns false when someone else won. */
  claim(id: string, claimHash: string): Promise<boolean>;
  markClosed(id: string, at: string): Promise<void>;
  revoke(id: string, at: string): Promise<void>;
  loadCourseItems(courseId: string): Promise<{ items: Item[]; cueCounts: Record<string, number> }>;
  /** Admin list, newest first, with the course title. */
  list(): Promise<(ShareLinkRow & { course_title: string; created_at: string })[]>;
  /** Course content for a visitor. Storage paths must already be turned into short-lived signed URLs. */
  loadCourseContent(courseId: string): Promise<VisitorCourse>;
}

export type VisitorItem = { id: string; kind: string; title: string; url: string | null; content: string | null };
export type VisitorCourse = { title: string; description: string; modules: { id: string; title: string; items: VisitorItem[] }[] };

export type CreateInput = { courseId: string; adminId: string; expiresAt?: string | null; autoClose?: boolean; bindFirst?: boolean };

/** Returns the raw token ONCE; only its hash is stored. */
export async function createShareLink(store: ShareStore, input: CreateInput) {
  const token = newToken();
  const row = await store.insert({
    course_id: input.courseId, token_hash: sha256(token), expires_at: input.expiresAt ?? null,
    revoked_at: null, auto_close: !!input.autoClose, bind_first: !!input.bindFirst,
    claim_hash: null, closed_at: null, created_by: input.adminId,
  });
  return { id: row.id, token };
}

/** GET / link preview: never claims, never closes. */
export async function viewShareLink(store: ShareStore, token: string, claimCookie: string | null, now = new Date()) {
  const link = await store.findByTokenHash(sha256(token));
  const d = decideAccess(link, now, claimCookie);
  return d.ok ? { ...d, courseId: link!.course_id } : d;
}

/** Explicit start (POST after a click). The first browser to start keeps the link when bind_first is set. */
export async function startShareLink(store: ShareStore, token: string, claimCookie: string | null, now = new Date()) {
  const link = await store.findByTokenHash(sha256(token));
  const d = decideAccess(link, now, claimCookie);
  if (!d.ok) return d;
  if (!d.needsClaim) return { ...d, courseId: link!.course_id, claim: claimCookie };
  const claim = newToken();
  const won = await store.claim(link!.id, sha256(claim));
  if (!won) return { ok: false as const, reason: "claimed_elsewhere" as const };
  return { ok: true as const, needsClaim: false, courseId: link!.course_id, claim };
}

/** Progress report from the claimed browser; closes the link when auto_close and finished. */
export async function reportShareProgress(
  store: ShareStore, token: string, claimCookie: string | null, progress: Progress, now = new Date(),
): Promise<AccessDecision & { closed?: boolean; finished?: boolean }> {
  const link = await store.findByTokenHash(sha256(token));
  const d = decideAccess(link, now, claimCookie);
  if (!d.ok) return d;
  if (d.needsClaim) return { ok: false, reason: "claimed_elsewhere" };
  const { items, cueCounts } = await store.loadCourseItems(link!.course_id);
  const finished = courseFinished(items, progress, (i) => cueCounts[i.id] ?? 0);
  if (shouldClose(link!, finished)) {
    await store.markClosed(link!.id, now.toISOString());
    return { ...d, finished, closed: true };
  }
  return { ...d, finished, closed: false };
}

export async function revokeShareLink(store: ShareStore, id: string, now = new Date()) {
  await store.revoke(id, now.toISOString());
}

export type AdminLinkRow = { id: string; courseTitle: string; createdAt: string; expiresAt: string | null; autoClose: boolean; bindFirst: boolean; status: "open" | "closed" | "revoked" | "expired" };

/** Never returns tokens or hashes. */
export async function listShareLinks(store: ShareStore, now = new Date()): Promise<AdminLinkRow[]> {
  return (await store.list()).map((r) => ({
    id: r.id, courseTitle: r.course_title, createdAt: r.created_at, expiresAt: r.expires_at, autoClose: r.auto_close, bindFirst: r.bind_first,
    status: r.revoked_at ? "revoked" : r.closed_at ? "closed" : r.expires_at && new Date(r.expires_at) <= now ? "expired" : "open",
  }));
}

/** Course content for a visitor. Same gate as start: closed, revoked, expired, or another browser's claim get nothing. */
export async function openShareCourse(store: ShareStore, token: string, claimCookie: string | null, now = new Date()) {
  const link = await store.findByTokenHash(sha256(token));
  const d = decideAccess(link, now, claimCookie);
  if (!d.ok) return d;
  if (d.needsClaim) return { ok: false as const, reason: "claimed_elsewhere" as const };
  return { ok: true as const, course: await store.loadCourseContent(link!.course_id) };
}
