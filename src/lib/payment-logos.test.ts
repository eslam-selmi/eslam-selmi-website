import { describe, it, expect } from "vitest";
import { parsePaymentLogo, parsePaymentLogos } from "./payment-logos";
describe("payment logos", () => {
  it("accepts small image data URLs and https, rejects the rest", () => {
    expect(parsePaymentLogo("data:image/png;base64,AAAA")).toBeTruthy();
    expect(parsePaymentLogo("https://x.example.com/a.png")).toBeTruthy();
    expect(parsePaymentLogo("javascript:alert(1)")).toBe("");
    expect(parsePaymentLogo("data:text/html;base64,AAAA")).toBe("");
    expect(parsePaymentLogo("http://x.example.com/a.png")).toBe("");
    expect(parsePaymentLogo("data:image/png;base64," + "A".repeat(130000))).toBe("");
  });
  it("ignores bad shapes", () => { expect(parsePaymentLogos(null)).toEqual({}); expect(parsePaymentLogos([1])).toEqual({}); });
});
