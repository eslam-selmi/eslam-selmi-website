import { describe, expect, it } from "vitest";
import { isGeneralFilesModule, orderModulesForDisplay } from "./general-modules";

const C = "90458811-ece6-4ed8-a172-af87078c8c64";
const G = "8da6232a-85b4-4131-86c0-950272a58aa4";
const mk = (id: string, course_id = C) => ({ id, course_id });
describe("general files modules", () => {
  it("moves the known section last, unnumbered; other modules keep order and get 1..n", () => {
    const r = orderModulesForDisplay([mk("a"), mk(G), mk("b"), mk("c")]);
    expect(r.map((x) => x.m.id)).toEqual(["a", "b", "c", G]);
    expect(r.map((x) => x.num)).toEqual([1, 2, 3, null]);
    expect(r.map((x) => x.i)).toEqual([0, 2, 3, 1]);
    expect(r).toHaveLength(4);
  });
  it("same module id under another course, or any other course, is untouched", () => {
    expect(isGeneralFilesModule(mk(G, "other-course"))).toBe(false);
    const r = orderModulesForDisplay([mk("a", "x"), mk("b", "x")]);
    expect(r.map((x) => x.num)).toEqual([1, 2]);
  });
});
