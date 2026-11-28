import { describe, it, expect } from "vitest";
import { createWatchTracker } from "./watch-tracker";
const play = (w: ReturnType<typeof createWatchTracker>, from: number, to: number) => { w.seek(); for (let t = from; t <= to; t += 0.25) w.tick(t, true); };
describe("watch tracker", () => {
  it("seek to end is not watched", () => { const w = createWatchTracker(100); play(w, 0, 5); w.seek(); play(w, 99, 100); expect(w.done()).toBe(false); });
  it("full playback is watched", () => { const w = createWatchTracker(100); play(w, 0, 100); expect(w.done()).toBe(true); });
  it("paused time and fast rate do not count", () => { const w = createWatchTracker(100); for (let t = 0; t <= 100; t += 0.25) w.tick(t, false); for (let t = 0; t <= 100; t += 0.25) w.tick(t, true, 4); expect(w.ratio()).toBe(0); });
  it("replaying same part does not inflate", () => { const w = createWatchTracker(100); play(w, 0, 50); play(w, 0, 50); expect(w.done()).toBe(false); });
  it("partial last second: 116.04 s video needs 117 seconds and the real end credits the last one", () => {
    const w = createWatchTracker(116.04); w.seek(); for (let t = 0; t <= 115.9; t += 0.25) w.tick(t, true);
    expect(w.done()).toBe(false);
    w.tick(116.04, false); w.end();
    expect(w.done()).toBe(true);
  });
  it("seek to the very end then ended does not complete", () => { const w = createWatchTracker(116.04); w.seek(); for (let t = 0; t <= 60; t += 0.25) w.tick(t, true); w.tick(116.04, false); w.end(); expect(w.done()).toBe(false); });
  it("pause near the end, then seek to the end does not credit the last second", () => { const w = createWatchTracker(116.04); w.seek(); for (let t = 0; t <= 114.5; t += 0.25) w.tick(t, true); w.tick(114.5, false); w.tick(116.04, false); w.end(); expect(w.done()).toBe(false); });
});
