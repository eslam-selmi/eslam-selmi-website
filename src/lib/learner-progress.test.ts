import { describe, it, expect } from "vitest";
import { createWatchTracker } from "./watch-tracker";
import { evaluateEligibility, recordOpened, recordWatched, markItemDone, unitsDone, videosLeft, type ProgressStore } from "./learner-progress";

function fakeStore() {
  const db = new Map<string, any>();
  const s: any = {
    __test: true,
    async load(u: string, i: string) { return db.get(u + i) ?? null; },
    async save(r: any) { const k = r.user_id + r.item_id; const o = db.get(k) ?? { opened_at: null, watched_seconds: [], completed_at: null }; db.set(k, { ...o, ...Object.fromEntries(Object.entries(r).filter(([a]) => !["user_id", "item_id"].includes(a))) }); },
    db,
  };
  return s as ProgressStore & { db: Map<string, any> };
}
const play = (w: ReturnType<typeof createWatchTracker>, a: number, b: number) => { w.seek(); for (let t = a; t <= b; t += 0.25) w.tick(t, true); };
const noGrad = { required: false, approved: false };

describe("journey: learn -> persist -> eligibility -> debt gate (fake store, no database)", () => {
  it("file open persists as seen; video completes only after real watching, across sessions", async () => {
    const st = fakeStore();
    await recordOpened(st, "u1", "file1");
    expect(st.db.get("u1file1").opened_at).toBeTruthy();
    expect(st.db.get("u1file1").completed_at ?? null).toBeNull(); // opening is not completion
    // fake server: trusted duration 100s, completes only at 100% of distinct seconds (mirrors the prepared SQL)
    const orig = st.save; (st as any).save = async (r: any) => { await orig(r); const n = (r.watched_seconds ?? []).length; const done = n >= 100; if (done) st.db.get(r.user_id + r.item_id).completed_at = "t"; return { completed: done }; };
    const w1 = createWatchTracker(100); play(w1, 0, 50);
    expect((await recordWatched(st, "u1", "vid1", w1.snapshot())).completed).toBe(false);
    const wSeek = createWatchTracker(100); play(wSeek, 99, 100);
    expect((await recordWatched(st, "u1", "vid1", wSeek.snapshot())).completed).toBe(false);
    const w2 = createWatchTracker(100); play(w2, 50, 100);
    expect((await recordWatched(st, "u1", "vid1", w2.snapshot())).completed).toBe(true);
    expect(st.db.get("u1vid1").completed_at).toBeTruthy();
  });
  it("client sends no duration and no completion claim for video", async () => {
    const st = fakeStore(); const sent: any[] = []; const o = st.save; (st as any).save = async (r: any) => { sent.push(r); return o(r); };
    await recordWatched(st, "u1", "v", [1, 2, 3]);
    expect(Object.keys(sent[0]).sort()).toEqual(["item_id", "user_id", "watched_seconds"]);
  });
  it("debt blocks first, then graduation, names; eligibility helper only covers debt/graduation/names; content is decided by the server for recorded videos only; all clear is ok", () => {
    expect(evaluateEligibility({ unpaid_due: true, items_left: 3 }, noGrad, false)).toEqual({ ok: false, reason: "debt" });
    expect(evaluateEligibility({ unpaid_due: false, items_left: 1 }, noGrad, true)).toEqual({ ok: true });
    expect(evaluateEligibility({ unpaid_due: false, items_left: 0 }, { required: true, approved: false }, true)).toEqual({ ok: false, reason: "graduation" });
    expect(evaluateEligibility({ unpaid_due: false, items_left: 0 }, noGrad, false)).toEqual({ ok: false, reason: "names" });
    expect(evaluateEligibility({ unpaid_due: false, items_left: 0 }, { required: true, approved: true }, true)).toEqual({ ok: true });
  });
  it("capstone: none -> not a blocker; required+not approved -> graduation; approved -> ok; legacy names missing -> names", () => {
    const b = { unpaid_due: false, items_left: 0 };
    expect(evaluateEligibility(b, { required: false, approved: false }, true)).toEqual({ ok: true });
    expect(evaluateEligibility(b, { required: true, approved: false }, true)).toEqual({ ok: false, reason: "graduation" });
    expect(evaluateEligibility(b, { required: true, approved: true }, true)).toEqual({ ok: true });
    expect(evaluateEligibility(b, { required: true, approved: true }, false)).toEqual({ ok: false, reason: "names" });
  });
  it("flag off: nothing is written", async () => {
    const st: any = fakeStore(); delete st.__test; let writes = 0; const o = st.save; st.save = async (r: any) => { writes++; return o(r); };
    await recordOpened(st, "u1", "f"); await recordWatched(st, "u1", "v", [1, 2]);
    expect(writes).toBe(0);
  });
});

import { vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => {
  const modes: Record<string, any> = {};
  return { supabase: { rpc: async (n: string) => { const m = (globalThis as any).__rpc; if (m === "throw") throw new Error("x"); if (m === "error") return { data: null, error: { message: "missing function" } }; return { data: m, error: null }; } } };
});
describe("server gate fails closed", () => {
  it("missing function, thrown error, empty or unknown status are all 'unknown' (blocked), never ok", async () => {
    const { fetchGate, issueMyCertificate } = await import("./learner-progress");
    for (const v of ["error", "throw", null, { status: "maybe" }, {}]) { (globalThis as any).__rpc = v; expect(await fetchGate("e")).toBe("unknown"); expect(await issueMyCertificate("e")).toBe("unknown"); }
    (globalThis as any).__rpc = { status: "debt" }; expect(await issueMyCertificate("e")).toBe("debt");
    (globalThis as any).__rpc = { status: "ok" }; expect(await fetchGate("e")).toBe("ok");
    (globalThis as any).__rpc = { status: "finance_unknown" }; expect(await fetchGate("e")).toBe("finance_unknown");
  });
});

describe("explicit completion and recorded-video-only certificate condition (user 2026-11-28 14:21:59)", () => {
  it("file: open, then explicit mark; marking before opening is refused; videos cannot be marked by hand", async () => {
    const st = fakeStore();
    expect((await markItemDone(st, "u1", "f1", { measuredVideo: false })).ok).toBe(false);
    await recordOpened(st, "u1", "f1");
    expect((await markItemDone(st, "u1", "f1", { measuredVideo: false })).ok).toBe(true);
    expect(st.db.get("u1f1").completed_at).toBeTruthy();
    await recordOpened(st, "u1", "v1");
    expect((await markItemDone(st, "u1", "v1", { measuredVideo: true })).ok).toBe(false);
  });
  it("legacy admin marks are ignored: a unit is done only when every item has a learner completion", () => {
    const items = [{ id: "a", module_id: "m1", kind: "file" }, { id: "b", module_id: "m1", kind: "file" }, { id: "c", module_id: "m2", kind: "file" }];
    expect(unitsDone(["m1", "m2", "m3"], items, [{ item_id: "a", completed_at: "t" }])).toBe(0);
    expect(unitsDone(["m1", "m2", "m3"], items, [{ item_id: "a", completed_at: "t" }, { item_id: "b", completed_at: "t" }, { item_id: "c", completed_at: null }])).toBe(1);
  });
  it("all recorded videos count toward the certificate; files, links, live sessions never do", () => {
    const yt = { id: "y", module_id: "m", kind: "video", url: "https://www.youtube.com/watch?v=abcdefghijk" };
    const mp4 = { id: "p", module_id: "m", kind: "video", url: "https://x.test/a.mp4" };
    const others = [{ id: "f", module_id: "m", kind: "file", url: "https://x.test/a.pdf" }, { id: "l", module_id: "m", kind: "link", url: "https://zoom.us/j/1" }, { id: "n", module_id: "m", kind: "note", url: null }];
    expect(videosLeft([yt, mp4, ...others], [])).toBe(2);
    expect(videosLeft([yt, mp4, ...others], [{ item_id: "y", completed_at: "t" }])).toBe(1);
    expect(videosLeft([yt, mp4, ...others], [{ item_id: "y", completed_at: "t" }, { item_id: "p", completed_at: "t" }])).toBe(0);
    expect(videosLeft(others, [])).toBe(0);
    const vimeo = { id: "v", module_id: "m", kind: "video", url: "https://vimeo.com/123" };
    expect(videosLeft([vimeo], [])).toBe(1); // not silently exempted until measurable
  });
  it("watch tracker: 99% is not enough, full playback is", () => {
    const w = createWatchTracker(100); play(w, 0, 98); expect(w.done()).toBe(false);
    const w2 = createWatchTracker(100); play(w2, 0, 100); expect(w2.done()).toBe(true);
  });
});
