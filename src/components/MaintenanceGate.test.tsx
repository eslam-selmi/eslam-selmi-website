// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";

const h = vi.hoisted(() => ({ path: "/", enabled: true, user: null as null | string, admin: false, settingFails: false, rpcError: false, authCb: null as null | ((e: string, s: unknown) => void), navigate: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useRouterState: ({ select }: any) => select({ location: { pathname: h.path } }), useNavigate: () => h.navigate }));
vi.mock("./MaintenancePage", () => ({ MaintenancePage: () => <div>MAINT-PAGE</div> }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => h.settingFails ? { data: null, error: { message: "x" } } : { data: { content: { enabled: h.enabled } }, error: null } }) }) }),
  rpc: async () => h.rpcError ? { data: null, error: { message: "x" } } : { data: h.admin, error: null },
  auth: { getSession: async () => ({ data: { session: h.user ? { user: { id: h.user } } : null }, error: null }),
    onAuthStateChange: (cb: any) => { h.authCb = cb; return { data: { subscription: { unsubscribe() {} } } }; } },
} }));
import { MaintenanceGate } from "./MaintenanceGate";
const ui = () => <MaintenanceGate><div>HOMEPAGE</div></MaintenanceGate>;
const visible = () => !!screen.queryByText("HOMEPAGE")?.parentElement && screen.getByText("HOMEPAGE").parentElement!.style.visibility !== "hidden";
beforeEach(() => { cleanup(); Object.assign(h, { path: "/", enabled: true, user: null, admin: false, settingFails: false, rpcError: false }); h.navigate.mockClear(); });
describe("MaintenanceGate on homepage", () => {
  it("visitor sees maintenance page", async () => { render(ui()); await screen.findByText("MAINT-PAGE"); expect(screen.queryByText("HOMEPAGE")).toBeNull(); });
  it("trainee is sent to portal, homepage never visible", async () => { h.user = "t"; render(ui()); await waitFor(() => expect(h.navigate).toHaveBeenCalledWith({ to: "/portal", replace: true })); expect(visible()).toBe(false); });
  it("admin sees homepage", async () => { h.user = "a"; h.admin = true; render(ui()); await waitFor(() => expect(visible()).toBe(true)); expect(h.navigate).not.toHaveBeenCalled(); });
  it("role check error is treated as trainee", async () => { h.user = "a"; h.admin = true; h.rpcError = true; render(ui()); await waitFor(() => expect(h.navigate).toHaveBeenCalled()); expect(visible()).toBe(false); });
  it("setting read failure fails closed for trainee", async () => { h.user = "t"; h.settingFails = true; render(ui()); await waitFor(() => expect(h.navigate).toHaveBeenCalled(), { timeout: 4000 }); expect(visible()).toBe(false); });
  it("maintenance off shows trainee the homepage", async () => { h.user = "t"; h.enabled = false; render(ui()); await waitFor(() => expect(visible()).toBe(true)); expect(h.navigate).not.toHaveBeenCalled(); });
  it("admin signs out: homepage becomes maintenance page", async () => { h.user = "a"; h.admin = true; render(ui()); await waitFor(() => expect(visible()).toBe(true)); await act(async () => { h.authCb!("SIGNED_OUT", null); }); await screen.findByText("MAINT-PAGE"); });
  it("portal path stays open for trainee", async () => { h.path = "/portal"; h.user = "t"; render(ui()); await waitFor(() => expect(visible()).toBe(true)); expect(h.navigate).not.toHaveBeenCalled(); });
});
