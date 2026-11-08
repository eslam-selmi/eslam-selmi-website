import { describe, it, expect } from "vitest";
import { buildEffectsEnabled } from "./build-effects";

describe("visitor build setting", () => {
  it("disables visitor effects when administrator switches them off", () => {
    expect(buildEffectsEnabled({ build_enabled: false })).toBe(false);
  });
  it("enables visitor effects when administrator switches them on", () => {
    expect(buildEffectsEnabled({ build_enabled: true })).toBe(true);
  });
});