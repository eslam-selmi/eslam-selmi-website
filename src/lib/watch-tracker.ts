// Counts distinct seconds actually played. A seek (jump) never adds credit, so seeking to the end is not "watched".
// User rule (2026-11-28): a recorded video counts only after its whole duration was actually played (no skipped credit).
export const WATCH_THRESHOLD = 1;
export function createWatchTracker(duration: number) {
  const seen = new Set<number>();
  let last: number | null = null;
  // Last playing sample that a pause/ended sample continues without a jump. Lets end() credit the final partial second of a video that really played to its end.
  let lastContinuous: number | null = null;
  return {
    // call on timeupdate while playing (not paused), with the current time
    tick(t: number, playing: boolean, rate = 1) {
      if (!playing || rate > 2) {
        if (last !== null && rate <= 2 && t - last >= 0 && t - last <= 1.5) lastContinuous = last;
        else if (lastContinuous !== null && (t < lastContinuous || t - lastContinuous > 0.6)) lastContinuous = null;
        last = null; return;
      }
      lastContinuous = null;
      if (last !== null && t - last > 0 && t - last <= 1.5) {
        for (let s = Math.floor(last); s < Math.floor(t) + 1 && s < duration; s++) seen.add(s);
      }
      last = t;
    },
    seek() { last = null; lastContinuous = null; },
    // Call when the media element fires "ended". Credits the remaining seconds only if playback was continuous up to the end (never after a seek).
    end() {
      if (lastContinuous !== null && duration - lastContinuous <= 0.6) for (let s = Math.floor(lastContinuous); s < duration; s++) seen.add(s);
      lastContinuous = null; last = null;
    },
    ratio() { return duration > 0 ? seen.size / Math.ceil(duration) : 0; },
    done() { return this.ratio() >= WATCH_THRESHOLD; },
    snapshot() { return [...seen]; },
  };
}
