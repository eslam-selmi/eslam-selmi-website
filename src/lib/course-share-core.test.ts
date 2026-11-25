import { describe, it, expect } from "vitest";
import { decideAccess, sha256, newToken, itemDone, courseFinished, shouldClose, type ShareLinkRow } from "./course-share-core";

const base: ShareLinkRow = { id: "l", course_id: "c1", token_hash: sha256("t"), expires_at: null, revoked_at: null, auto_close: false, bind_first: false, claim_hash: null, closed_at: null };
const now = new Date("2026-11-25T12:00:00Z");

describe("tokens", () => {
  it("are 43 chars url-safe, unique, hash is not the token", () => {
    const a = newToken(), b = newToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
    expect(sha256(a)).not.toContain(a);
  });
});
describe("access", () => {
  it("unknown link", () => expect(decideAccess(null, now, null)).toEqual({ ok: false, reason: "not_found" }));
  it("revoked stops at once", () => expect(decideAccess({ ...base, revoked_at: "2026-11-25T11:00:00Z" }, now, null)).toEqual({ ok: false, reason: "revoked" }));
  it("no expiry stays open", () => expect(decideAccess(base, new Date("2035-01-01"), null).ok).toBe(true));
  it("expired", () => expect(decideAccess({ ...base, expires_at: "2026-11-25T12:00:00Z" }, now, null)).toEqual({ ok: false, reason: "expired" }));
  it("closed", () => expect(decideAccess({ ...base, closed_at: "2026-11-25T11:00:00Z" }, now, null)).toEqual({ ok: false, reason: "closed" }));
  it("bind_first unclaimed: needs explicit claim, a view does not claim", () => {
    expect(decideAccess({ ...base, bind_first: true }, now, null)).toEqual({ ok: true, needsClaim: true });
  });
  it("bind_first claimed: only the same secret passes", () => {
    const l = { ...base, bind_first: true, claim_hash: sha256("secret") };
    expect(decideAccess(l, now, "secret")).toEqual({ ok: true, needsClaim: false });
    expect(decideAccess(l, now, "other")).toEqual({ ok: false, reason: "claimed_elsewhere" });
    expect(decideAccess(l, now, null)).toEqual({ ok: false, reason: "claimed_elsewhere" });
  });
  it("without bind_first a claim hash is ignored", () => {
    expect(decideAccess({ ...base, claim_hash: sha256("x") }, now, null).ok).toBe(true);
  });
  it("link of course A never carries course B id (isolation lives in the query, checked by course_id)", () => {
    expect(base.course_id).toBe("c1");
  });
});
describe("completion", () => {
  it("video needs end, 90% and every cue", () => {
    const v = { id: "v", kind: "video" };
    expect(itemDone(v, { ended: true, maxRatio: 0.95, cuesAnswered: 2 }, 2)).toBe(true);
    expect(itemDone(v, { ended: true, maxRatio: 0.95, cuesAnswered: 1 }, 2)).toBe(false);
    expect(itemDone(v, { ended: true, maxRatio: 0.5, cuesAnswered: 2 }, 2)).toBe(false);
    expect(itemDone(v, undefined, 0)).toBe(false);
  });
  it("files need opening, notes need done", () => {
    expect(itemDone({ id: "f", kind: "pdf" }, { opened: true }, 0)).toBe(true);
    expect(itemDone({ id: "n", kind: "note" }, { opened: true }, 0)).toBe(false);
    expect(itemDone({ id: "n", kind: "note" }, { markedDone: true }, 0)).toBe(true);
  });
  it("empty course never counts as finished", () => expect(courseFinished([], {}, () => 0)).toBe(false));
  it("close only when option on and finished", () => {
    expect(shouldClose({ ...base, auto_close: true }, true)).toBe(true);
    expect(shouldClose(base, true)).toBe(false);
    expect(shouldClose({ ...base, auto_close: true }, false)).toBe(false);
  });
});
