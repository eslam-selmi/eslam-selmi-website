import { describe, it, expect } from "vitest";
import { createWatchTracker } from "./watch-tracker";
const play = (w: ReturnType<typeof createWatchTracker>, from: number, to: number) => { w.seek(); for (let t = from; t <= to; t += 0.25) w.tick(t, true); };
describe("watch tracker", () => {
  it("seek to end is not watched", () => { const w = createWatchTracker(100); play(w, 0, 5); w.seek(); play(w, 99, 100); expect(w.done()).toBe(false); });
  it("full playback is watched", () => { const w = createWatchTracker(100); play(w, 0, 100); expect(w.done()).toBe(true); });
  it("paused time and fast rate do not count", () => { const w = createWatchTracker(100); for (let t = 0; t <= 100; t += 0.25) w.tick(t, false); for (let t = 0; t <= 100; t += 0.25) w.tick(t, true, 4); expect(w.ratio()).toBe(0); });
  it("replaying same part does not inflate", () => { const w = createWatchTracker(100); play(w, 0, 50); play(w, 0, 50); expect(w.done()).toBe(false); });
});
