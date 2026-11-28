import { describe, it, expect } from "vitest";
import { timeGreeting } from "./PersonalMessage";

describe("timeGreeting (device-local hour)", () => {
  it("Arabic: morning 05:00-11:59, evening otherwise, no afternoon variant", () => {
    expect(timeGreeting("ar", 4)).toBe("مساء الخير");
    expect(timeGreeting("ar", 5)).toBe("صباح الخير");
    expect(timeGreeting("ar", 11)).toBe("صباح الخير");
    expect(timeGreeting("ar", 12)).toBe("مساء الخير");
    expect(timeGreeting("ar", 16)).toBe("مساء الخير");
    expect(timeGreeting("ar", 23)).toBe("مساء الخير");
    expect(timeGreeting("ar", 0)).toBe("مساء الخير");
  });
  it("English keeps afternoon", () => {
    expect(timeGreeting("en", 5)).toBe("Good morning");
    expect(timeGreeting("en", 12)).toBe("Good afternoon");
    expect(timeGreeting("en", 17)).toBe("Good evening");
  });
  it("default hour comes from the device clock and timezone", () => {
    for (const tz of ["Asia/Riyadh", "America/New_York", "Pacific/Auckland"]) {
      process.env.TZ = tz;
      const h = new Date("2026-01-01T07:30:00Z").getHours();
      expect(timeGreeting("ar", h)).toBe(h >= 5 && h < 12 ? "صباح الخير" : "مساء الخير");
    }
  });
});
