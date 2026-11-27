import { describe, it, expect } from "vitest";
import { createWatchTracker } from "./watch-tracker";
import { evaluateEligibility, recordOpened, recordWatched, type ProgressStore } from "./learner-progress";

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
    expect(st.db.get("u1file1").completed_at).toBeTruthy();
    const w1 = createWatchTracker(100); play(w1, 0, 50);
    expect((await recordWatched(st, "u1", "vid1", 100, w1.snapshot())).completed).toBe(false);
    const wSeek = createWatchTracker(100); play(wSeek, 99, 100);
    expect((await recordWatched(st, "u1", "vid1", 100, wSeek.snapshot())).completed).toBe(false);
    const w2 = createWatchTracker(100); play(w2, 50, 100);
    expect((await recordWatched(st, "u1", "vid1", 100, w2.snapshot())).completed).toBe(true);
    expect(st.db.get("u1vid1").completed_at).toBeTruthy();
  });
  it("debt blocks first, then content, graduation, names; all clear is ok", () => {
    expect(evaluateEligibility({ unpaid_due: true, items_left: 3 }, noGrad, false)).toEqual({ ok: false, reason: "debt" });
    expect(evaluateEligibility({ unpaid_due: false, items_left: 1 }, noGrad, true)).toEqual({ ok: false, reason: "content" });
    expect(evaluateEligibility({ unpaid_due: false, items_left: 0 }, { required: true, approved: false }, true)).toEqual({ ok: false, reason: "graduation" });
    expect(evaluateEligibility({ unpaid_due: false, items_left: 0 }, noGrad, false)).toEqual({ ok: false, reason: "names" });
    expect(evaluateEligibility({ unpaid_due: false, items_left: 0 }, { required: true, approved: true }, true)).toEqual({ ok: true });
  });
  it("flag off: nothing is written", async () => {
    const st: any = fakeStore(); delete st.__test; let writes = 0; const o = st.save; st.save = async (r: any) => { writes++; return o(r); };
    await recordOpened(st, "u1", "f"); await recordWatched(st, "u1", "v", 100, [1, 2]);
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
  });
});
