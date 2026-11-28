import { describe, it, expect } from "vitest";
import { maintenanceDecision as d } from "./maintenance-gate";
const base = { enabled: true as boolean | null, session: "none" as "unknown" | "none" | "user", isAdmin: null as boolean | null };
describe("maintenance gate", () => {
  it("off: everyone sees everything", () => {
    for (const session of ["none", "user"] as const) expect(d({ pathname: "/", enabled: false, session, isAdmin: false })).toBe("show");
  });
  it("on: visitor gets maintenance page except allowed paths", () => {
    expect(d({ ...base, pathname: "/" })).toBe("maintenance-page");
    expect(d({ ...base, pathname: "/courses" })).toBe("maintenance-page");
    for (const p of ["/admin", "/auth", "/portal", "/portal/x", "/onboarding", "/verify/abc"]) expect(d({ ...base, pathname: p })).toBe("show");
  });
  it("on: only admin opens the homepage, trainee goes to portal", () => {
    expect(d({ ...base, pathname: "/", session: "user", isAdmin: true })).toBe("show");
    expect(d({ ...base, pathname: "/", session: "user", isAdmin: false })).toBe("to-portal");
  });
  it("on: homepage hidden while role unknown, never flashes", () => {
    expect(d({ ...base, pathname: "/", session: "user", isAdmin: null })).toBe("hide");
    expect(d({ ...base, pathname: "/", enabled: null, session: "user", isAdmin: true })).toBe("hide");
    expect(d({ ...base, pathname: "/", session: "unknown" })).toBe("hide");
  });
  it("on: signed-in users keep other pages and allowed paths", () => {
    for (const p of ["/portal", "/auth", "/admin", "/verify/x", "/courses"]) expect(d({ ...base, pathname: p, session: "user", isAdmin: false })).toBe("show");
  });
  it("sign-out: after signing out the homepage shows maintenance", () => {
    expect(d({ ...base, pathname: "/", session: "none", isAdmin: false })).toBe("maintenance-page");
  });
});
