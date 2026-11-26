import { describe, it, expect } from "vitest";
import { createGuest, resetGuestPassword, setGuestEnabled, guestLogin, sessionValid, guestCourses, guestOpenCourse, guestSummary, generatePassword, makeSession, requireUpdated, type GuestStore, type GuestRow } from "./guest-access-service";

const SECRET = "test-secret";
const now = new Date(); // real clock: later calls in the service use the current time too
function mem() {
  let g: GuestRow | null = null;
  const s: GuestStore = {
    async getGuest() { return g ? { ...g } : null; },
    async create(email, hash) { g = { id: "g1", email, password_hash: hash, version: 1, enabled: true, failed_count: 0, locked_until: null }; },
    async setPassword(hash) { g!.password_hash = hash; g!.version++; g!.failed_count = 0; g!.locked_until = null; },
    async setEnabled(e) { g!.enabled = e; g!.version++; },
    async recordFailure(max, lockMs) { g!.failed_count++; if (g!.failed_count >= max) { g!.failed_count = 0; g!.locked_until = new Date(now.getTime() + lockMs).toISOString(); } },
    async clearFailures() { g!.failed_count = 0; g!.locked_until = null; },
    async listActiveCourses() { return [{ id: "c1", title: "A", description: "" }]; },
    async loadCourseContent(id) { return { title: id, description: "", modules: [] }; },
  };
  return { s, row: () => g! };
}

describe("guest login (server-only session)", () => {
  it("creates one guest, shows the password once, stores only a hash", async () => {
    const { s, row } = mem();
    expect((await createGuest(s, "a", "nope")).ok).toBe(false);
    const r: any = await createGuest(s, "a", " Guest@Example.com ");
    expect(r.ok).toBe(true); expect(row().password_hash).not.toContain(r.password); expect(row().password_hash.startsWith("scrypt$")).toBe(true);
    expect((await createGuest(s, "a", "x@y.com")) as any).toMatchObject({ ok: false, reason: "exists" });
    expect(JSON.stringify(await guestSummary(s))).not.toMatch(/scrypt|password/i);
  });
  it("right login gives a session that lists courses; wrong email or password gets the same answer", async () => {
    const { s } = mem(); const r: any = await createGuest(s, "a", "g@e.com");
    const bad1: any = await guestLogin(s, "g@e.com", "wrong", SECRET, now), bad2: any = await guestLogin(s, "other@e.com", r.password, SECRET, now);
    expect(bad1).toEqual(bad2); expect(bad1.ok).toBe(false);
    const ok: any = await guestLogin(s, "G@E.com", r.password, SECRET, now);
    expect(ok.ok).toBe(true);
    expect((await guestCourses(s, ok.token, SECRET)).ok).toBe(true);
    expect((await guestOpenCourse(s, ok.token, SECRET, "c1")).ok).toBe(true);
    expect((await guestOpenCourse(s, ok.token, SECRET, "archived")) as any).toMatchObject({ reason: "not_found" });
  });
  it("sessions: tampered, wrong secret, expired, empty all fail", async () => {
    const { s } = mem(); const r: any = await createGuest(s, "a", "g@e.com");
    const ok: any = await guestLogin(s, "g@e.com", r.password, SECRET);
    expect(await sessionValid(s, ok.token + "x", SECRET)).toBe(false);
    expect(await sessionValid(s, ok.token, "other")).toBe(false);
    expect(await sessionValid(s, makeSession(1, SECRET, new Date("2020-01-01")), SECRET)).toBe(false);
    expect(await sessionValid(s, null, SECRET)).toBe(false);
    expect(await sessionValid(s, makeSession(1, SECRET), "")).toBe(false);
  });
  it("turn-off and password reset revoke existing sessions at once", async () => {
    const { s } = mem(); const r: any = await createGuest(s, "a", "g@e.com");
    const t1: any = await guestLogin(s, "g@e.com", r.password, SECRET);
    await setGuestEnabled(s, false);
    expect(await sessionValid(s, t1.token, SECRET)).toBe(false);
    expect((await guestLogin(s, "g@e.com", r.password, SECRET)).ok).toBe(false);
    await setGuestEnabled(s, true);
    expect(await sessionValid(s, t1.token, SECRET)).toBe(false);
    const t2: any = await guestLogin(s, "g@e.com", r.password, SECRET);
    const rr: any = await resetGuestPassword(s);
    expect(await sessionValid(s, t2.token, SECRET)).toBe(false);
    expect((await guestLogin(s, "g@e.com", r.password, SECRET)).ok).toBe(false);
    expect((await guestLogin(s, "g@e.com", rr.password, SECRET)).ok).toBe(true);
  });
  it("five failures lock logins for a minute, even for the right password", async () => {
    const { s } = mem(); const r: any = await createGuest(s, "a", "g@e.com");
    for (let i = 0; i < 5; i++) await guestLogin(s, "g@e.com", "wrong", SECRET, now);
    expect(await guestLogin(s, "g@e.com", r.password, SECRET, now)).toMatchObject({ ok: false, reason: "locked" });
    expect((await guestLogin(s, "g@e.com", r.password, SECRET, new Date(now.getTime() + 61_000))).ok).toBe(true);
  });
  it("generated passwords are long and from the safe alphabet", () => {
    const a = generatePassword(); expect(a).toMatch(/^[a-zA-Z2-9]{18}$/); expect(a).not.toMatch(/[0O1lI]/); expect(a).not.toBe(generatePassword());
  });
});

describe("update races and secrets", () => {
  it("a zero-row or double-row update is an error, one row is fine", () => {
    expect(() => requireUpdated([], "x")).toThrow(/changed at the same time/);
    expect(() => requireUpdated(null, "x")).toThrow();
    expect(() => requireUpdated([{ id: 1 }, { id: 2 }], "x")).toThrow();
    expect(() => requireUpdated([{ id: 1 }], "x")).not.toThrow();
  });
  it("a store that rejects the reset means no password is returned", async () => {
    const { s } = mem(); await createGuest(s, "a", "g@e.com");
    s.setPassword = async () => { throw new Error("password reset: guest changed at the same time, try again"); };
    await expect(resetGuestPassword(s)).rejects.toThrow();
    s.setEnabled = async () => { throw new Error("toggle: guest changed at the same time, try again"); };
    await expect(setGuestEnabled(s, false)).rejects.toThrow();
  });
  it("an empty secret can never mint or accept a session", async () => {
    expect(() => makeSession(1, "")).toThrow();
    const { s } = mem(); const r: any = await createGuest(s, "a", "g@e.com");
    await expect(guestLogin(s, "g@e.com", r.password, "")).rejects.toThrow();
  });
  it("if the failure counter cannot be written, a wrong password errors out instead of passing silently", async () => {
    const { s } = mem(); await createGuest(s, "a", "g@e.com");
    s.recordFailure = async () => { throw new Error("guest lock unavailable"); };
    await expect(guestLogin(s, "g@e.com", "wrong-password-x", "sec")).rejects.toThrow(/lock unavailable/);
  });
});
