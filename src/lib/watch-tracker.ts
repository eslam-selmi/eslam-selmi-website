// Counts distinct seconds actually played. A seek (jump) never adds credit, so seeking to the end is not "watched".
// PROPOSED rule (not settled with the user): item counts as watched at >= 90% distinct seconds.
export const WATCH_THRESHOLD = 0.9;
export function createWatchTracker(duration: number) {
  const seen = new Set<number>();
  let last: number | null = null;
  return {
    // call on timeupdate while playing (not paused), with the current time
    tick(t: number, playing: boolean, rate = 1) {
      if (!playing || rate > 2) { last = null; return; }
      if (last !== null && t - last > 0 && t - last <= 1.5) {
        for (let s = Math.floor(last); s < Math.floor(t) + 1 && s < duration; s++) seen.add(s);
      }
      last = t;
    },
    seek() { last = null; },
    ratio() { return duration > 0 ? seen.size / Math.floor(duration) : 0; },
    done() { return this.ratio() >= WATCH_THRESHOLD; },
    snapshot() { return [...seen]; },
  };
}
