import { describe, expect, it } from "vitest";
import { parseContractLogos, parseLogoUrl } from "./contract-logos";

describe("parseContractLogos", () => {
  it("keeps valid https urls and drops unsafe or malformed entries", () => {
    const r = parseContractLogos({ a: "https://cdn.example.com/x.png", b: "http://cdn.example.com/x.png", c: "javascript:alert(1)", d: 5, e: "https://127.0.0.1/x.png", f: "https://user:pw@cdn.example.com/x.png" });
    expect(Object.keys(r)).toEqual(["a"]);
  });
  it("handles empty or wrong-shaped content", () => {
    expect(parseContractLogos(null)).toEqual({});
    expect(parseContractLogos([1, 2])).toEqual({});
  });
  it("accepts a realistic signed storage url with a long token and round-trips through the map", () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + "a".repeat(380) + "." + "b".repeat(43);
    const url = `https://abcdefghijklmnopqrst.supabase.co/storage/v1/object/sign/public-uploads/contract-logos/0b1f6a52-9a1c-4c64-b0a0-2f4b9c1f3c11.png?token=${token}`;
    expect(url.length).toBeGreaterThan(500);
    expect(parseLogoUrl(url)).toBe(url);
    const map = parseContractLogos({ c1: url, c2: url });
    expect(map).toEqual({ c1: url, c2: url });
    const after = { ...map }; delete after.c2;
    expect(parseContractLogos(after)).toEqual({ c1: url });
  });
});
