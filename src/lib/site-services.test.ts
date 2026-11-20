import { describe, expect, it } from "vitest";
import { DEFAULT_SERVICES, parseServices, visibleServicePrice } from "./site-services";

const service = { ...DEFAULT_SERVICES.services[0], key: "test", titleAr: "استشارة", titleEn: "Consulting", descAr: "", descEn: "", icon: "strategy" as const, visible: true, price: 250, currency: "EGP", showPrice: true };
describe("service administration rules", () => {
  it("keeps existing services unpriced by default", () => {
    expect(parseServices(null).services).toHaveLength(4);
    expect(visibleServicePrice(DEFAULT_SERVICES, service)).toBeNull();
  });
  it("shows a price only when both global and service switches allow it", () => {
    const config = { ...DEFAULT_SERVICES, pricingEnabled: true };
    expect(visibleServicePrice(config, service)).toBe(250);
    expect(visibleServicePrice(config, { ...service, showPrice: false })).toBeNull();
  });
  it("supports an unpriced service without showing an amount", () => {
    expect(visibleServicePrice({ ...DEFAULT_SERVICES, pricingEnabled: true }, { ...service, price: null })).toBeNull();
  });
  it("does not resurrect deleted services", () => {
    expect(parseServices({ services: [] }).services).toEqual([]);
  });
  it("preserves custom order, hidden services and bilingual fallback", () => {
    const parsed = parseServices({ services: [{ ...service, key: "second", visible: false, titleEn: "" }, { ...service, key: "first" }] });
    expect(parsed.services.map(s => s.key)).toEqual(["second", "first"]);
    expect(parsed.services[0]?.visible).toBe(false);
    expect(parsed.services[0]?.titleEn).toBe("استشارة");
  });
  it("rejects invalid prices and allows zero", () => {
    expect(parseServices({ services: [{ ...service, price: -1 }] }).services[0]?.price).toBeNull();
    expect(visibleServicePrice({ ...DEFAULT_SERVICES, pricingEnabled: true }, { ...service, price: 0 })).toBe(0);
  });
});