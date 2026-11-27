import { describe, it, expect } from "vitest";
import { sanitizeDuration } from "./duration-meta";
describe("sanitizeDuration", () => {
  it("accepts real durations (rounded up), rejects NaN, Infinity (live), zero, negative, absurd", () => {
    expect(sanitizeDuration(100.2)).toBe(101);
    for (const x of [NaN, Infinity, 0, -5, 999999]) expect(sanitizeDuration(x)).toBeNull();
  });
});
