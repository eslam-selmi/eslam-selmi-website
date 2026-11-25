import { describe, expect, it } from "vitest";
import {
  CONTACT_DONE_KEY,
  hasGivenDetails,
  rememberGivenDetails,
  shouldAskForDetails,
} from "./addition-contact-memory";

function fakeStore() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  };
}

describe("ask details once", () => {
  it("asks an anonymous first-time visitor when the item collects contacts", () => {
    expect(
      shouldAskForDetails({ collectContacts: true, signedIn: false, alreadyGiven: false }),
    ).toBe(true);
  });
  it("never asks when the item does not collect contacts", () => {
    expect(
      shouldAskForDetails({ collectContacts: false, signedIn: false, alreadyGiven: false }),
    ).toBe(false);
  });
  it("does not ask a signed-in visitor", () => {
    expect(
      shouldAskForDetails({ collectContacts: true, signedIn: true, alreadyGiven: false }),
    ).toBe(false);
  });
  it("does not ask again after details were sent once", () => {
    const s = fakeStore();
    expect(hasGivenDetails(s)).toBe(false);
    rememberGivenDetails(s);
    expect(s.getItem(CONTACT_DONE_KEY)).toBe("1");
    expect(hasGivenDetails(s)).toBe(true);
    expect(
      shouldAskForDetails({
        collectContacts: true,
        signedIn: false,
        alreadyGiven: hasGivenDetails(s),
      }),
    ).toBe(false);
  });
  it("survives a missing or throwing store", () => {
    expect(hasGivenDetails(null)).toBe(false);
    expect(() => rememberGivenDetails(null)).not.toThrow();
    const bad = {
      getItem: () => {
        throw new Error("x");
      },
      setItem: () => {
        throw new Error("x");
      },
    };
    expect(hasGivenDetails(bad)).toBe(false);
    expect(() => rememberGivenDetails(bad)).not.toThrow();
  });
});
