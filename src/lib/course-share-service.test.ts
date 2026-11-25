import { describe, it, expect } from "vitest";
import { createShareLink, viewShareLink, startShareLink, reportShareProgress, revokeShareLink, listShareLinks, openShareCourse, type ShareStore } from "./course-share-service";
import type { ShareLinkRow } from "./course-share-core";

function memStore(items = [{ id: "v1", kind: "video" }, { id: "f1", kind: "file" }], cues: Record<string, number> = { v1: 1 }) {
  const rows: ShareLinkRow[] = []; let n = 0; const calls: string[] = [];
  const s: ShareStore = {
    async findByTokenHash(h) { return rows.find((r) => r.token_hash === h) ?? null; },
    async insert(r) { const row = { ...r, id: `l${++n}` } as ShareLinkRow; rows.push(row); calls.push("insert"); return row; },
    async claim(id, h) { const r = rows.find((x) => x.id === id)!; if (r.claim_hash) return false; r.claim_hash = h; calls.push("claim"); return true; },
    async markClosed(id, at) { rows.find((x) => x.id === id)!.closed_at = at; calls.push("close"); },
    async revoke(id, at) { rows.find((x) => x.id === id)!.revoked_at = at; calls.push("revoke"); },
    async loadCourseItems() { return { items, cueCounts: cues }; },
    async list() { return rows.map((r) => ({ ...r, course_title: "T", created_at: "2026-11-25T00:00:00Z" })); },
    async loadCourseContent() { return { title: "T", description: "", modules: [] }; },
  };
  return { s, rows, calls };
}
const now = new Date("2026-11-25T12:00:00Z");
const done = { v1: { ended: true, maxRatio: 1, cuesAnswered: 1 }, f1: { opened: true } };

describe("share service", () => {
  it("stores only the hash, returns the token once", async () => {
    const { s, rows } = memStore();
    const { token } = await createShareLink(s, { courseId: "c", adminId: "a" });
    expect(rows[0].token_hash).not.toBe(token);
    expect(JSON.stringify(rows[0])).not.toContain(token);
  });
  it("viewing never claims or closes", async () => {
    const { s, calls } = memStore();
    const { token } = await createShareLink(s, { courseId: "c", adminId: "a", bindFirst: true, autoClose: true });
    const r = await viewShareLink(s, token, null, now);
    expect(r.ok).toBe(true);
    expect(calls).toEqual(["insert"]);
  });
  it("first start claims, second browser is refused, same browser continues", async () => {
    const { s } = memStore();
    const { token } = await createShareLink(s, { courseId: "c", adminId: "a", bindFirst: true });
    const a = await startShareLink(s, token, null, now);
    expect(a.ok).toBe(true);
    const b = await startShareLink(s, token, null, now);
    expect(b).toEqual({ ok: false, reason: "claimed_elsewhere" });
    const again = await startShareLink(s, token, (a as any).claim, now);
    expect(again.ok).toBe(true);
  });
  it("racing starts: exactly one wins", async () => {
    const { s } = memStore();
    const { token } = await createShareLink(s, { courseId: "c", adminId: "a", bindFirst: true });
    const rs = await Promise.all([startShareLink(s, token, null, now), startShareLink(s, token, null, now)]);
    expect(rs.filter((r) => r.ok).length).toBe(1);
  });
  it("auto-close happens only when every item is done, then the link is closed", async () => {
    const { s } = memStore();
    const { token } = await createShareLink(s, { courseId: "c", adminId: "a", autoClose: true });
    const part = await reportShareProgress(s, token, null, { v1: { ended: true, maxRatio: 1, cuesAnswered: 0 } }, now);
    expect(part).toMatchObject({ ok: true, finished: false, closed: false });
    const full = await reportShareProgress(s, token, null, done, now);
    expect(full).toMatchObject({ finished: true, closed: true });
    expect((await viewShareLink(s, token, null, now))).toEqual({ ok: false, reason: "closed" });
  });
  it("without auto_close finishing keeps the link open", async () => {
    const { s } = memStore();
    const { token } = await createShareLink(s, { courseId: "c", adminId: "a" });
    expect(await reportShareProgress(s, token, null, done, now)).toMatchObject({ finished: true, closed: false });
  });
  it("progress from an unclaimed or other browser is refused on a bound link", async () => {
    const { s } = memStore();
    const { token } = await createShareLink(s, { courseId: "c", adminId: "a", bindFirst: true });
    expect(await reportShareProgress(s, token, null, done, now)).toEqual({ ok: false, reason: "claimed_elsewhere" });
    const a = await startShareLink(s, token, null, now);
    expect(await reportShareProgress(s, token, "wrong", done, now)).toEqual({ ok: false, reason: "claimed_elsewhere" });
    expect((await reportShareProgress(s, token, (a as any).claim, done, now)).ok).toBe(true);
  });
  it("revoke stops access at once; expiry stops it by clock", async () => {
    const { s } = memStore();
    const { id, token } = await createShareLink(s, { courseId: "c", adminId: "a", expiresAt: "2026-11-25T13:00:00Z" });
    expect((await viewShareLink(s, token, null, now)).ok).toBe(true);
    expect(await viewShareLink(s, token, null, new Date("2026-11-25T13:00:01Z"))).toEqual({ ok: false, reason: "expired" });
    await revokeShareLink(s, id, now);
    expect(await viewShareLink(s, token, null, now)).toEqual({ ok: false, reason: "revoked" });
  });
  it("wrong token is not found", async () => {
    const { s } = memStore();
    expect(await viewShareLink(s, "nope", null, now)).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("list and open", () => {
  it("list shows status and no secrets; open follows the start gate", async () => {
    const { s } = memStore();
    const a = await createShareLink(s, { courseId: "c", adminId: "a", bindFirst: true });
    const list = await listShareLinks(s, now);
    expect(list[0].status).toBe("open");
    expect(JSON.stringify(list)).not.toMatch(/hash|token/i);
    expect((await openShareCourse(s, a.token, null, now)).ok).toBe(false);
    const st: any = await startShareLink(s, a.token, null, now);
    expect((await openShareCourse(s, a.token, st.claim, now)).ok).toBe(true);
    expect((await openShareCourse(s, a.token, "other", now)).ok).toBe(false);
    await revokeShareLink(s, a.id, now);
    expect((await openShareCourse(s, a.token, st.claim, now)).ok).toBe(false);
    expect((await listShareLinks(s, now))[0].status).toBe("revoked");
  });
});
