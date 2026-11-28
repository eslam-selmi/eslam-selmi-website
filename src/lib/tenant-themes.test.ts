import { describe, expect, it } from "vitest";
import { TENANT_THEMES, contrast, themeByKey, DEFAULT_THEME } from "./tenant-themes";

describe("tenant themes", () => {
  it("has ten unique themes", () => {
    expect(TENANT_THEMES).toHaveLength(10);
    expect(new Set(TENANT_THEMES.map((t) => t.key)).size).toBe(10);
  });
  it("falls back to the default for unknown keys", () => {
    expect(themeByKey("nope")).toBe(DEFAULT_THEME);
    expect(themeByKey(null)).toBe(DEFAULT_THEME);
  });
  for (const t of TENANT_THEMES) {
    it(`${t.key}: readable text pairs`, () => {
      expect(contrast(t.ink, t.bg)).toBeGreaterThanOrEqual(7);
      expect(contrast(t.panelInk, t.panel)).toBeGreaterThanOrEqual(7);
      expect(contrast(t.accentInk, t.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.accent, t.bg)).toBeGreaterThanOrEqual(3);
    });
  }
});
