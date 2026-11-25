/**
 * Guest login: one shared email+password that can browse every active course, read only.
 * Pure use cases; all I/O goes through GuestStore. The server functions inject a service-role store.
 */
import type { VisitorCourse } from "./course-share-service";

export type GuestRow = { user_id: string; email: string; enabled: boolean };
export type GuestCourseRef = { id: string; title: string; description: string };

export interface GuestStore {
  getGuest(): Promise<GuestRow | null>;
  /** Creates the auth user (already confirmed, no roles) and the guest_access row. */
  createGuestUser(email: string, password: string, adminId: string): Promise<string>;
  setPassword(userId: string, password: string): Promise<void>;
  setEnabled(userId: string, enabled: boolean): Promise<void>;
  listActiveCourses(): Promise<GuestCourseRef[]>;
  loadCourseContent(courseId: string): Promise<VisitorCourse>;
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generatePassword(len = 18, rand: (n: number) => number[] = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)))): string {
  // rejection sampling keeps the letters evenly distributed
  const out: string[] = []; const max = 256 - (256 % ALPHABET.length);
  while (out.length < len) for (const b of rand(len * 2)) { if (b < max && out.length < len) out.push(ALPHABET[b % ALPHABET.length]); }
  return out.join("");
}
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;

/** The password is returned once and never stored by us. */
export async function createGuest(store: GuestStore, adminId: string, email: string) {
  const e = email.trim().toLowerCase();
  if (!emailOk(e)) return { ok: false as const, reason: "bad_email" as const };
  if (await store.getGuest()) return { ok: false as const, reason: "exists" as const };
  const password = generatePassword();
  await store.createGuestUser(e, password, adminId);
  return { ok: true as const, email: e, password };
}

export async function resetGuestPassword(store: GuestStore) {
  const g = await store.getGuest();
  if (!g) return { ok: false as const, reason: "none" as const };
  const password = generatePassword();
  await store.setPassword(g.user_id, password);
  return { ok: true as const, email: g.email, password };
}

export async function setGuestEnabled(store: GuestStore, enabled: boolean) {
  const g = await store.getGuest();
  if (!g) return { ok: false as const, reason: "none" as const };
  await store.setEnabled(g.user_id, enabled);
  return { ok: true as const };
}

export async function guestSummary(store: GuestStore) {
  const g = await store.getGuest();
  return g ? { exists: true as const, email: g.email, enabled: g.enabled } : { exists: false as const };
}

/** True only for the enabled guest user. */
export async function isEnabledGuest(store: GuestStore, userId: string) {
  const g = await store.getGuest();
  return !!g && g.enabled && g.user_id === userId;
}

export async function guestCourses(store: GuestStore, userId: string) {
  if (!(await isEnabledGuest(store, userId))) return { ok: false as const, reason: "not_guest" as const };
  return { ok: true as const, courses: await store.listActiveCourses() };
}

/** Only active courses; anything else looks like "not found". */
export async function guestOpenCourse(store: GuestStore, userId: string, courseId: string) {
  if (!(await isEnabledGuest(store, userId))) return { ok: false as const, reason: "not_guest" as const };
  const list = await store.listActiveCourses();
  if (!list.some((c) => c.id === courseId)) return { ok: false as const, reason: "not_found" as const };
  return { ok: true as const, course: await store.loadCourseContent(courseId) };
}
