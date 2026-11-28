// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const h = vi.hoisted(() => ({ path: "/", enabled: true, user: null as null | string, admin: false, settingFails: false, rpcError: false, authCb: null as null | ((e: string, s: unknown) => void), navigate: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useRouterState: ({ select }: any) => select({ location: { pathname: h.path } }), useNavigate: () => h.navigate }));
vi.mock("./MaintenancePage", () => ({ MaintenancePage: () => createElement("div", null, "MAINT-PAGE") }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => h.settingFails ? { data: null, error: { message: "x" } } : { data: { content: { enabled: h.enabled } }, error: null } }) }) }),
  rpc: async () => h.rpcError ? { data: null, error: { message: "x" } } : { data: h.admin, error: null },
  auth: { getSession: async () => ({ data: { session: h.user ? { user: { id: h.user } } : null }, error: null }),
    onAuthStateChange: (cb: any) => { h.authCb = cb; return { data: { subscription: { unsubscribe() {} } } }; } },
} }));

const wait = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
async function mount() {
  const { MaintenanceGate } = await import("./MaintenanceGate");
  document.body.innerHTML = "";
  const el = document.createElement("div"); document.body.appendChild(el);
  await act(async () => { createRoot(el).render(createElement(MaintenanceGate, null, createElement("div", { id: "home" }, "HOMEPAGE"))); });
  await wait(30);
  return el;
}
/** Homepage is visible only when it is rendered and not inside the hidden wrapper. */
const homeVisible = (el: HTMLElement) => { const n = el.querySelector("#home") as HTMLElement | null; return !!n && n.parentElement!.style.visibility !== "hidden"; };
beforeEach(() => { Object.assign(h, { path: "/", enabled: true, user: null, admin: false, settingFails: false, rpcError: false }); h.navigate.mockClear(); });

describe("MaintenanceGate on homepage", () => {
  it("visitor sees maintenance page", async () => { const el = await mount(); expect(el.textContent).toContain("MAINT-PAGE"); expect(homeVisible(el)).toBe(false); });
  it("trainee is sent to portal, homepage never visible", async () => { h.user = "t"; const el = await mount(); expect(h.navigate).toHaveBeenCalledWith({ to: "/portal", replace: true }); expect(homeVisible(el)).toBe(false); });
  it("admin sees homepage", async () => { h.user = "a"; h.admin = true; const el = await mount(); expect(homeVisible(el)).toBe(true); expect(h.navigate).not.toHaveBeenCalled(); });
  it("role check error is treated as trainee", async () => { h.user = "a"; h.admin = true; h.rpcError = true; const el = await mount(); expect(h.navigate).toHaveBeenCalled(); expect(homeVisible(el)).toBe(false); });
  it("setting read failure fails closed for trainee", async () => { h.user = "t"; h.settingFails = true; const el = await mount(); await wait(2000); expect(h.navigate).toHaveBeenCalled(); expect(homeVisible(el)).toBe(false); });
  it("maintenance off shows trainee the homepage", async () => { h.user = "t"; h.enabled = false; const el = await mount(); expect(homeVisible(el)).toBe(true); expect(h.navigate).not.toHaveBeenCalled(); });
  it("admin signs out: homepage becomes maintenance page", async () => { h.user = "a"; h.admin = true; const el = await mount(); expect(homeVisible(el)).toBe(true); await act(async () => { h.authCb!("SIGNED_OUT", null); }); await wait(30); expect(el.textContent).toContain("MAINT-PAGE"); expect(homeVisible(el)).toBe(false); });
  it("portal path stays open for trainee", async () => { h.path = "/portal"; h.user = "t"; const el = await mount(); expect(homeVisible(el)).toBe(true); expect(h.navigate).not.toHaveBeenCalled(); });
});
