import { describe, it, expect } from "vitest";
import { DEFAULT_PILLARS, parsePillars } from "./site-pillars";
describe("pillar management", () => {
  it("preserves three existing pillars by default", () => { expect(parsePillars(null)).toBe(DEFAULT_PILLARS); expect(parsePillars(null).pillars).toHaveLength(3); });
  it("preserves saved ordering and visibility", () => {
    const parsed = parsePillars({ pillars: [{ key: "b", titleAr: "ركيزة", visible: false }, { key: "a", titleEn: "Pillar" }] });
    expect(parsed.pillars.map(p => p.key)).toEqual(["b", "a"]);
    expect(parsed.pillars[0]?.visible).toBe(false);
  });
  it("supports deletion without restoring defaults", () => { expect(parsePillars({ pillars: [] }).pillars).toEqual([]); });
  it("uses Arabic when English is empty and validates icons", () => {
    const p = parsePillars({ pillars: [{ titleAr: "ركيزة", descAr: "وصف", icon: "unknown" }] }).pillars[0];
    expect(p?.titleEn).toBe("ركيزة"); expect(p?.descEn).toBe("وصف"); expect(p?.icon).toBe("talent");
  });
});