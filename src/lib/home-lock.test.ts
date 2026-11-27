import { describe, it, expect } from "vitest";
import { homeLockDecision as d, parseHomeLock } from "./home-lock";
const on = { enabled: true, message_ar: "", message_en: "" };
const off = { enabled: false, message_ar: "", message_en: "" };
describe("home lock", () => {
  it("is off by default and for bad content", () => {
    expect(parseHomeLock(null).enabled).toBe(false);
    expect(parseHomeLock({ enabled: "yes" }).enabled).toBe(false);
    expect(parseHomeLock([1]).enabled).toBe(false);
  });
  it("only touches the homepage", () => {
    for (const p of ["/portal", "/auth", "/admin", "/verify/x", "/c/slug"]) expect(d({ pathname: p, config: on, session: "none", isAdmin: false })).toBe("show");
  });
  it("unlocked shows everyone, never flashes before the setting is known", () => {
    expect(d({ pathname: "/", config: off, session: "none", isAdmin: false })).toBe("show");
    expect(d({ pathname: "/", config: null, session: "user", isAdmin: true })).toBe("hide");
  });
  it("locked: admin sees it, trainee goes to portal, visitor sees the lock screen", () => {
    expect(d({ pathname: "/", config: on, session: "user", isAdmin: true })).toBe("show");
    expect(d({ pathname: "/", config: on, session: "user", isAdmin: false })).toBe("to-portal");
    expect(d({ pathname: "/", config: on, session: "none", isAdmin: false })).toBe("locked-visitor");
  });
  it("locked: waits while session or role is unknown, fails closed when setting unreadable", () => {
    expect(d({ pathname: "/", config: on, session: "unknown", isAdmin: null })).toBe("hide");
    expect(d({ pathname: "/", config: on, session: "user", isAdmin: null })).toBe("hide");
    expect(d({ pathname: "/", config: "failed", session: "none", isAdmin: null })).toBe("locked-visitor");
    expect(d({ pathname: "/", config: "failed", session: "user", isAdmin: false })).toBe("to-portal");
  });
});
