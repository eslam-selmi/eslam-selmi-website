import { describe, expect, it } from "vitest";
import { parseContractLogos } from "./contract-logos";

describe("parseContractLogos", () => {
  it("keeps valid https urls and drops unsafe or malformed entries", () => {
    const r = parseContractLogos({ a: "https://cdn.example.com/x.png", b: "http://cdn.example.com/x.png", c: "javascript:alert(1)", d: 5, e: "https://127.0.0.1/x.png", f: "https://user:pw@cdn.example.com/x.png" });
    expect(Object.keys(r)).toEqual(["a"]);
  });
  it("handles empty or wrong-shaped content", () => {
    expect(parseContractLogos(null)).toEqual({});
    expect(parseContractLogos([1, 2])).toEqual({});
  });
});
