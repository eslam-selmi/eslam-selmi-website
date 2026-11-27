import { describe, it, expect } from "vitest";
import { resolveViewing } from "./portal-view";

const list = [
  { id: "a", blocked: false },
  { id: "b", blocked: true },
  { id: "c" },
  { id: "d", blocked: null },
];

describe("resolveViewing", () => {
  it("opens an ordinary enrollment", () => { expect(resolveViewing(list, "a")?.id).toBe("a"); });
  it("treats missing or null blocked as not blocked", () => { expect(resolveViewing(list, "c")?.id).toBe("c"); expect(resolveViewing(list, "d")?.id).toBe("d"); });
  it("never opens a blocked enrollment, even when asked by id", () => { expect(resolveViewing(list, "b")).toBeNull(); });
  it("returns null for unknown, empty or missing ids", () => { expect(resolveViewing(list, "zzz")).toBeNull(); expect(resolveViewing(list, "")).toBeNull(); expect(resolveViewing(list, null)).toBeNull(); expect(resolveViewing([], "a")).toBeNull(); });
});
