/**
 * Guest logins: one email + password per person, each tied to its own set of courses, read only.
 * SERVER-ONLY SESSION: the guest is NOT a Supabase user. The server checks the password
 * (scrypt hash) and sets a signed cookie. There is no auth.users row, no signup trigger, no
 * JWT, so none of the database's own-row write policies can ever apply to a guest. Pure use
 * cases; all I/O goes through GuestStore.
 */
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import type { VisitorCourse } from "./course-share-service";

export type GuestRow = { id: string; email: string; name: string; password_hash: string; version: number; enabled: boolean; failed_count: number; locked_until: string | null };
export type GuestCourseRef = { id: string; title: string; description: string };
export type GuestSummaryRow = { id: string; email: string; name: string; enabled: boolean; courseIds: string[] };

export interface GuestStore {
  getGuest(id: string): Promise<GuestRow | null>;
  getGuestByEmail(email: string): Promise<GuestRow | null>;
  listGuests(): Promise<(GuestRow & { course_ids: string[] })[]>;
  create(email: string, name: string, passwordHash: string, adminId: string): Promise<string>;
  /** One UPDATE: new hash, version + 1 (drops that guest's sessions), failures cleared. */
  setPassword(id: string, passwordHash: string): Promise<void>;
  /** One UPDATE: enabled flag, version + 1 (drops that guest's sessions). */
  setEnabled(id: string, enabled: boolean): Promise<void>;
  /** Replaces the guest's course set exactly. */
  setCourses(id: string, courseIds: string[]): Promise<void>;
  remove(id: string): Promise<void>;
  /** Atomic in the database, per guest. */
  recordFailure(id: string, max: number, lockMs: number): Promise<void>;
  clearFailures(id: string): Promise<void>;
  /** Courses this guest may see: assigned AND still active, not archived, not coming soon. */
  listCoursesFor(id: string): Promise<GuestCourseRef[]>;
  /** Courses an admin may assign (active, not archived). */
  listAssignableCourses(): Promise<GuestCourseRef[]>;
  loadCourseContent(courseId: string): Promise<VisitorCourse>;
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generatePassword(len = 18, rand: (n: number) => number[] = (n) => Array.from(randomBytes(n))): string {
  const out: string[] = []; const max = 256 - (256 % ALPHABET.length);
  while (out.length < len) for (const b of rand(len * 2)) { if (b < max && out.length < len) out.push(ALPHABET[b % ALPHABET.length]); }
  return out.join("");
}

/** Light cost on purpose: the password is server-generated with ~100 bits, so brute force is not the risk, and Workers CPU limits are. */
const KDF = { N: 4096, r: 8, p: 1 } as const;
export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, 32, KDF).toString("hex")}`;
}
export function checkPassword(pw: string, stored: string | null): boolean {
  const parts = (stored ?? "scrypt$00000000000000000000000000000000$" + "0".repeat(64)).split("$");
  const salt = Buffer.from(parts[1] ?? "", "hex"); const want = Buffer.from(parts[2] ?? "", "hex");
  const got = scryptSync(pw, salt, 32, KDF); // always computed, so a missing guest costs the same time
  return !!stored && want.length === got.length && timingSafeEqual(want, got);
}

export const SESSION_TTL_MS = 12 * 3600_000;
export const MAX_FAILS = 5;
export const LOCK_MS = 60_000;
const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest("base64url");
export function makeSession(guestId: string, version: number, secret: string, now = new Date()): string {
  if (!secret) throw new Error("guest session secret is missing");
  const body = b64(JSON.stringify({ g: guestId, v: version, e: now.getTime() + SESSION_TTL_MS }));
  return `${body}.${sign(body, secret)}`;
}
function readSession(token: string | null | undefined, secret: string, now: Date): { g: string; v: number } | null {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const want = Buffer.from(sign(body, secret)); const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try { const j = JSON.parse(Buffer.from(body, "base64url").toString()); return typeof j.g === "string" && typeof j.v === "number" && typeof j.e === "number" && j.e > now.getTime() ? { g: j.g, v: j.v } : null; } catch { return null; }
}

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
const norm = (e: string) => e.trim().toLowerCase();

/** The password is returned once and only its hash is stored. Many guests, one per email. */
export async function createGuest(store: GuestStore, adminId: string, email: string, name = "", courseIds: string[] = []) {
  const e = norm(email);
  if (!emailOk(e)) return { ok: false as const, reason: "bad_email" as const };
  if (await store.getGuestByEmail(e)) return { ok: false as const, reason: "exists" as const };
  const password = generatePassword();
  const ids = [...new Set(courseIds.map(String))];
  const id = await store.create(e, name.trim().slice(0, 80), hashPassword(password), adminId);
  if (ids.length) await store.setCourses(id, ids);
  return { ok: true as const, id, email: e, password };
}
export async function resetGuestPassword(store: GuestStore, id: string) {
  const g = await store.getGuest(id);
  if (!g) return { ok: false as const, reason: "none" as const };
  const password = generatePassword();
  await store.setPassword(id, hashPassword(password));
  return { ok: true as const, email: g.email, password };
}
export async function setGuestEnabled(store: GuestStore, id: string, enabled: boolean) {
  if (!(await store.getGuest(id))) return { ok: false as const, reason: "none" as const };
  await store.setEnabled(id, enabled);
  return { ok: true as const };
}
export async function setGuestCourses(store: GuestStore, id: string, courseIds: string[]) {
  if (!(await store.getGuest(id))) return { ok: false as const, reason: "none" as const };
  await store.setCourses(id, [...new Set(courseIds.map(String))]);
  return { ok: true as const };
}
export async function removeGuest(store: GuestStore, id: string) {
  if (!(await store.getGuest(id))) return { ok: false as const, reason: "none" as const };
  await store.remove(id);
  return { ok: true as const };
}
/** Never includes the hash. */
export async function guestSummary(store: GuestStore): Promise<{ guests: GuestSummaryRow[]; courses: GuestCourseRef[] }> {
  const [gs, courses] = await Promise.all([store.listGuests(), store.listAssignableCourses()]);
  return { guests: gs.map((g) => ({ id: g.id, email: g.email, name: g.name, enabled: g.enabled, courseIds: g.course_ids })), courses };
}

/** Same answer for a wrong email and a wrong password. Five misses lock that guest for a minute. */
export async function guestLogin(store: GuestStore, email: string, password: string, secret: string, now = new Date()) {
  const g = await store.getGuestByEmail(norm(String(email ?? "")));
  if (g?.locked_until && new Date(g.locked_until) > now) return { ok: false as const, reason: "locked" as const };
  const pwOk = checkPassword(String(password ?? ""), g?.password_hash ?? null);
  if (!g || !g.enabled || !pwOk) {
    if (g) await store.recordFailure(g.id, MAX_FAILS, LOCK_MS);
    return { ok: false as const, reason: "bad_login" as const };
  }
  if (g.failed_count) await store.clearFailures(g.id);
  return { ok: true as const, token: makeSession(g.id, g.version, secret, now) };
}

/** The guest id the session belongs to, only while that guest is enabled and its version is unchanged. */
export async function sessionGuestId(store: GuestStore, token: string | null | undefined, secret: string, now = new Date()): Promise<string | null> {
  const s = readSession(token, secret, now);
  if (!s) return null;
  const g = await store.getGuest(s.g);
  return g && g.enabled && g.version === s.v ? g.id : null;
}
export async function sessionValid(store: GuestStore, token: string | null | undefined, secret: string, now = new Date()) {
  return (await sessionGuestId(store, token, secret, now)) !== null;
}
export async function guestCourses(store: GuestStore, token: string | null | undefined, secret: string) {
  const id = await sessionGuestId(store, token, secret);
  if (!id) return { ok: false as const, reason: "not_guest" as const };
  return { ok: true as const, courses: await store.listCoursesFor(id) };
}
export async function guestOpenCourse(store: GuestStore, token: string | null | undefined, secret: string, courseId: string) {
  const id = await sessionGuestId(store, token, secret);
  if (!id) return { ok: false as const, reason: "not_guest" as const };
  if (!(await store.listCoursesFor(id)).some((c) => c.id === courseId)) return { ok: false as const, reason: "not_found" as const };
  return { ok: true as const, course: await store.loadCourseContent(courseId) };
}

/** An optimistic UPDATE that matched no row means someone else changed the guest first. Never report that as success. */
export function requireUpdated(rows: unknown, what: string): void {
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error(`${what}: guest changed at the same time, try again`);
}
