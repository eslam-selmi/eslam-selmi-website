import { describe, it, expect } from "vitest";
import { createWatchTracker } from "./watch-tracker";
import { unitDoneFor, itemWatchPercent } from "./unit-progress";

const play = (w: ReturnType<typeof createWatchTracker>, a: number, b: number) => { w.seek(); for (let t = a; t <= b; t += 0.25) w.tick(t, true); };

describe("unit page completion display", () => {
  it("unit is done only when it has items and every item has a learner completion; admin mark is not an input", () => {
    expect(unitDoneFor([], [])).toBe(false);
    expect(unitDoneFor([{ id: "a" }], [{ item_id: "a", completed_at: null }])).toBe(false);
    expect(unitDoneFor([{ id: "a" }, { id: "b" }], [{ item_id: "a", completed_at: "t" }])).toBe(false);
    expect(unitDoneFor([{ id: "a" }, { id: "b" }], [{ item_id: "a", completed_at: "t" }, { item_id: "b", completed_at: "t" }])).toBe(true);
  });
  it("percent: partial, seek-to-end, full playback", () => {
    const dur = 120.4;
    const part = createWatchTracker(dur); play(part, 0, 50);
    const pPart = itemWatchPercent(part.snapshot(), dur);
    expect(pPart).toBeGreaterThan(35); expect(pPart).toBeLessThan(45); expect(part.done()).toBe(false);
    const seek = createWatchTracker(dur); play(seek, 0, 10); seek.seek(); play(seek, 110, 120.4);
    expect(seek.done()).toBe(false); expect(itemWatchPercent(seek.snapshot(), dur)).toBeLessThan(25);
    const full = createWatchTracker(dur); play(full, 0, 120.4);
    expect(full.done()).toBe(true); expect(itemWatchPercent(full.snapshot(), dur)).toBe(100);
  });
  it("pause exactly at the end still counts every second (so a flush on pause/end sees ratio 1)", () => {
    const dur = 61.2; const w = createWatchTracker(dur); play(w, 0, 61.2); w.tick(61.2, false);
    expect(w.ratio()).toBeGreaterThanOrEqual(1);
  });
  it("percent is 0 without a trusted duration or seconds", () => {
    expect(itemWatchPercent([1, 2], null)).toBe(0);
    expect(itemWatchPercent(null, 100)).toBe(0);
  });
});
