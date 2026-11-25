import { describe, it, expect } from "vitest";
import { createGuest, resetGuestPassword, setGuestEnabled, guestCourses, guestOpenCourse, guestSummary, generatePassword, type GuestStore, type GuestRow } from "./guest-access-service";

function mem() {
  let g: GuestRow | null = null; const pw: Record<string, string> = {}; const calls: string[] = [];
  const s: GuestStore = {
    async getGuest() { return g; },
    async createGuestUser(email, password) { g = { user_id: "g1", email, enabled: true }; pw.g1 = password; calls.push("create"); return "g1"; },
    async setPassword(id, p) { pw[id] = p; calls.push("pw"); },
    async setEnabled(_id, e) { g!.enabled = e; calls.push("enabled"); },
    async listActiveCourses() { return [{ id: "c1", title: "A", description: "" }]; },
    async loadCourseContent(id) { return { title: id, description: "", modules: [] }; },
  };
  return { s, pw, calls };
}

describe("guest access", () => {
  it("creates one guest, returns the password once, rejects bad email and a second guest", async () => {
    const { s, pw } = mem();
    expect((await createGuest(s, "a", "not-an-email")).ok).toBe(false);
    const r: any = await createGuest(s, "a", " Guest@Example.com ");
    expect(r.ok).toBe(true); expect(r.email).toBe("guest@example.com"); expect(r.password).toBe(pw.g1);
    expect((await createGuest(s, "a", "x@y.com")) as any).toMatchObject({ ok: false, reason: "exists" });
    expect(JSON.stringify(await guestSummary(s))).not.toContain(r.password);
  });
  it("only the enabled guest user sees courses; others and a disabled guest get nothing", async () => {
    const { s } = mem(); await createGuest(s, "a", "g@e.com");
    expect((await guestCourses(s, "g1")).ok).toBe(true);
    expect((await guestCourses(s, "someone-else")).ok).toBe(false);
    await setGuestEnabled(s, false);
    expect((await guestCourses(s, "g1")).ok).toBe(false);
    expect((await guestOpenCourse(s, "g1", "c1")).ok).toBe(false);
  });
  it("opens only listed active courses", async () => {
    const { s } = mem(); await createGuest(s, "a", "g@e.com");
    expect((await guestOpenCourse(s, "g1", "c1")).ok).toBe(true);
    expect((await guestOpenCourse(s, "g1", "archived")) as any).toMatchObject({ ok: false, reason: "not_found" });
  });
  it("reset gives a new password; none when no guest", async () => {
    const { s } = mem();
    expect((await resetGuestPassword(s)).ok).toBe(false);
    const a: any = await createGuest(s, "a", "g@e.com"); const b: any = await resetGuestPassword(s);
    expect(b.password).not.toBe(a.password);
  });
  it("generated passwords are long, from the safe alphabet, and differ", () => {
    const a = generatePassword(), b = generatePassword();
    expect(a).toMatch(/^[a-zA-Z2-9]{18}$/); expect(a).not.toBe(b); expect(a).not.toMatch(/[0O1lI]/);
  });
});
