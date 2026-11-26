import { describe, it, expect } from "vitest";
import { createGuest, resetGuestPassword, setGuestEnabled, setGuestCourses, removeGuest, guestLogin, sessionValid, guestCourses, guestOpenCourse, guestSummary, generatePassword, makeSession, requireUpdated, type GuestStore, type GuestRow } from "./guest-access-service";

const SECRET = "test-secret";
const now = new Date();
const COURSES = [{ id: "c1", title: "A", description: "" }, { id: "c2", title: "B", description: "" }, { id: "c3", title: "C", description: "" }];
function mem(inactive: string[] = []) {
  const gs = new Map<string, GuestRow>(); const links = new Map<string, Set<string>>(); let n = 0;
  const s: GuestStore = {
    async getGuest(id) { const g = gs.get(id); return g ? { ...g } : null; },
    async getGuestByEmail(e) { const g = [...gs.values()].find((x) => x.email === e); return g ? { ...g } : null; },
    async listGuests() { return [...gs.values()].map((g) => ({ ...g, course_ids: [...(links.get(g.id) ?? [])] })); },
    async create(email, name, hash) { const id = "g" + ++n; gs.set(id, { id, email, name, password_hash: hash, version: 1, enabled: true, failed_count: 0, locked_until: null }); return id; },
    async setPassword(id, hash) { const g = gs.get(id)!; g.password_hash = hash; g.version++; g.failed_count = 0; g.locked_until = null; },
    async setEnabled(id, e) { const g = gs.get(id)!; g.enabled = e; g.version++; },
    async setCourses(id, ids) { links.set(id, new Set(ids)); },
    async remove(id) { gs.delete(id); links.delete(id); },
    async recordFailure(id, max, lockMs) { const g = gs.get(id)!; g.failed_count++; if (g.failed_count >= max) { g.failed_count = 0; g.locked_until = new Date(now.getTime() + lockMs).toISOString(); } },
    async clearFailures(id) { const g = gs.get(id)!; g.failed_count = 0; g.locked_until = null; },
    async listCoursesFor(id) { return COURSES.filter((c) => links.get(id)?.has(c.id) && !inactive.includes(c.id)); },
    async listAssignableCourses() { return COURSES; },
    async loadCourseContent(id) { return { title: id, description: "", modules: [] }; },
  };
  return { s, row: (id: string) => gs.get(id)! };
}

describe("many guests, each with their own courses", () => {
  it("creates independent guests; the same email twice is refused; only a hash is stored", async () => {
    const { s, row } = mem();
    expect((await createGuest(s, "a", "nope")).ok).toBe(false);
    const r: any = await createGuest(s, "a", " Guest@Example.com ", "Sara", ["c1"]);
    expect(r.ok).toBe(true); expect(row(r.id).password_hash).not.toContain(r.password); expect(row(r.id).password_hash.startsWith("scrypt$")).toBe(true);
    expect((await createGuest(s, "a", "guest@example.com")) as any).toMatchObject({ ok: false, reason: "exists" });
    const r2: any = await createGuest(s, "a", "two@example.com", "", ["c2", "c3"]);
    expect(r2.ok).toBe(true);
    const sum = await guestSummary(s);
    expect(sum.guests).toHaveLength(2); expect(JSON.stringify(sum)).not.toMatch(/scrypt|password/i);
  });
  it("CROSS-GUEST ISOLATION: each guest lists and opens only their own courses", async () => {
    const { s } = mem();
    const a: any = await createGuest(s, "x", "a@e.com", "", ["c1"]); const b: any = await createGuest(s, "x", "b@e.com", "", ["c2", "c3"]);
    const ta: any = await guestLogin(s, "a@e.com", a.password, SECRET); const tb: any = await guestLogin(s, "b@e.com", b.password, SECRET);
    expect(((await guestCourses(s, ta.token, SECRET)) as any).courses.map((c: any) => c.id)).toEqual(["c1"]);
    expect(((await guestCourses(s, tb.token, SECRET)) as any).courses.map((c: any) => c.id)).toEqual(["c2", "c3"]);
    expect((await guestOpenCourse(s, ta.token, SECRET, "c1")).ok).toBe(true);
    expect(await guestOpenCourse(s, ta.token, SECRET, "c2")).toMatchObject({ ok: false, reason: "not_found" });
    expect(await guestOpenCourse(s, tb.token, SECRET, "c1")).toMatchObject({ ok: false, reason: "not_found" });
    expect((await guestOpenCourse(s, tb.token, SECRET, "c3")).ok).toBe(true);
  });
  it("one guest's password does not open another guest's account; a guest with no courses sees none", async () => {
    const { s } = mem();
    const a: any = await createGuest(s, "x", "a@e.com", "", ["c1"]); await createGuest(s, "x", "b@e.com", "", []);
    expect((await guestLogin(s, "b@e.com", a.password, SECRET)).ok).toBe(false);
    const b2: any = await resetGuestPassword(s, "g2");
    const tb: any = await guestLogin(s, "b@e.com", b2.password, SECRET);
    expect(((await guestCourses(s, tb.token, SECRET)) as any).courses).toEqual([]);
  });
  it("changing a guest's courses takes effect at once for that guest only", async () => {
    const { s } = mem();
    const a: any = await createGuest(s, "x", "a@e.com", "", ["c1"]); const b: any = await createGuest(s, "x", "b@e.com", "", ["c1"]);
    const ta: any = await guestLogin(s, "a@e.com", a.password, SECRET); const tb: any = await guestLogin(s, "b@e.com", b.password, SECRET);
    await setGuestCourses(s, a.id, ["c2"]);
    expect(await guestOpenCourse(s, ta.token, SECRET, "c1")).toMatchObject({ reason: "not_found" });
    expect((await guestOpenCourse(s, ta.token, SECRET, "c2")).ok).toBe(true);
    expect((await guestOpenCourse(s, tb.token, SECRET, "c1")).ok).toBe(true);
  });
  it("turning one guest off, resetting or deleting revokes only that guest's sessions", async () => {
    const { s } = mem();
    const a: any = await createGuest(s, "x", "a@e.com", "", ["c1"]); const b: any = await createGuest(s, "x", "b@e.com", "", ["c1"]);
    const ta: any = await guestLogin(s, "a@e.com", a.password, SECRET); const tb: any = await guestLogin(s, "b@e.com", b.password, SECRET);
    await setGuestEnabled(s, a.id, false);
    expect(await sessionValid(s, ta.token, SECRET)).toBe(false); expect(await sessionValid(s, tb.token, SECRET)).toBe(true);
    expect((await guestLogin(s, "a@e.com", a.password, SECRET)).ok).toBe(false);
    await removeGuest(s, b.id);
    expect(await sessionValid(s, tb.token, SECRET)).toBe(false);
  });
  it("a course that is no longer active disappears from the guest even if assigned", async () => {
    const { s } = mem(["c1"]);
    const a: any = await createGuest(s, "x", "a@e.com", "", ["c1", "c2"]); const t: any = await guestLogin(s, "a@e.com", a.password, SECRET);
    expect(((await guestCourses(s, t.token, SECRET)) as any).courses.map((c: any) => c.id)).toEqual(["c2"]);
    expect(await guestOpenCourse(s, t.token, SECRET, "c1")).toMatchObject({ reason: "not_found" });
  });
  it("wrong email and wrong password give the same answer; five misses lock only that guest", async () => {
    const { s } = mem(); const a: any = await createGuest(s, "x", "a@e.com", "", ["c1"]); const b: any = await createGuest(s, "x", "b@e.com", "", ["c1"]);
    expect(await guestLogin(s, "a@e.com", "wrong", SECRET, now)).toEqual(await guestLogin(s, "zz@e.com", a.password, SECRET, now));
    for (let i = 0; i < 5; i++) await guestLogin(s, "a@e.com", "wrong", SECRET, now);
    expect(await guestLogin(s, "a@e.com", a.password, SECRET, now)).toMatchObject({ ok: false, reason: "locked" });
    expect((await guestLogin(s, "b@e.com", b.password, SECRET, now)).ok).toBe(true);
    expect((await guestLogin(s, "a@e.com", a.password, SECRET, new Date(now.getTime() + 61_000))).ok).toBe(true);
  });
  it("sessions: tampered, wrong secret, expired, empty, or for a deleted guest all fail", async () => {
    const { s } = mem(); const r: any = await createGuest(s, "a", "g@e.com", "", ["c1"]);
    const ok: any = await guestLogin(s, "g@e.com", r.password, SECRET);
    expect(await sessionValid(s, ok.token + "x", SECRET)).toBe(false);
    expect(await sessionValid(s, ok.token, "other")).toBe(false);
    expect(await sessionValid(s, makeSession(r.id, 1, SECRET, new Date("2020-01-01")), SECRET)).toBe(false);
    expect(await sessionValid(s, null, SECRET)).toBe(false);
    expect(await sessionValid(s, makeSession("nope", 1, SECRET), SECRET)).toBe(false);
    expect(() => makeSession(r.id, 1, "")).toThrow();
  });
  it("generated passwords are long and from the safe alphabet", () => {
    const a = generatePassword(); expect(a).toMatch(/^[a-zA-Z2-9]{18}$/); expect(a).not.toMatch(/[0O1lI]/); expect(a).not.toBe(generatePassword());
  });
  it("update races are errors; a failing failure counter errors out instead of passing", async () => {
    expect(() => requireUpdated([], "x")).toThrow(/changed at the same time/);
    expect(() => requireUpdated([{ id: 1 }], "x")).not.toThrow();
    const { s } = mem(); await createGuest(s, "a", "g@e.com");
    s.recordFailure = async () => { throw new Error("guest lock unavailable"); };
    await expect(guestLogin(s, "g@e.com", "wrong-password-x", "sec")).rejects.toThrow(/lock unavailable/);
  });
});
