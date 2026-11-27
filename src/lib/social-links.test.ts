import { describe, it, expect } from "vitest";
import { parseSocialUrl, validSocials, readSiteProfile, profileLinks } from "./site-profile-data";
describe("social links", () => {
  it("accepts real https hosts only", () => {
    expect(parseSocialUrl("https://instagram.com/eslam")).toBe("https://instagram.com/eslam");
    for (const bad of ["javascript:alert(1)", "http://x.com/a", "https://user:pw@x.com", "https://localhost/a", "https://10.0.0.1/a", "https://x/a", "https://a.internal/x", "https://x.com/a b", "data:text/html,hi", ""]) expect(parseSocialUrl(bad)).toBe("");
  });
  it("dedupes and drops invalid when rendering", () => {
    const l = validSocials([{ platform: "x", url: "https://x.com/a" }, { platform: "x", url: "https://x.com/a" }, { platform: "custom", url: "javascript:1" }]);
    expect(l.map((s) => s.href)).toEqual(["https://x.com/a"]);
  });
  it("profile with malformed socials never throws and default is empty", () => {
    expect(readSiteProfile(null).socials).toEqual([]);
    expect(profileLinks(readSiteProfile({ socials: [1, null, { platform: "x" }, { platform: "x", url: "https://x.com/a" }] as any })).socials.length).toBe(1);
  });
});
