// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const store: { rows: Array<{ id: string; section_key: string; content: unknown }>; writes: string[] } = { rows: [], writes: [] };
vi.mock("@/integrations/supabase/client", () => {
  const from = () => {
    let key = "";
    const q: any = {
      select: () => q,
      eq: (c: string, v: string) => { if (c === "section_key") key = v; return q; },
      maybeSingle: async () => ({ data: store.rows.find((r) => r.section_key === key) ?? null, error: null }),
      update: (v: any) => ({ eq: async (_c: string, id: string) => { store.writes.push("update"); const r = store.rows.find((x) => x.id === id)!; r.content = v.content; return { error: null }; } }),
      insert: (v: any) => ({ select: () => ({ maybeSingle: async () => { store.writes.push("insert"); const r = { id: "r1", section_key: v.section_key, content: v.content }; store.rows.push(r); return { data: { id: "r1" }, error: null }; } }) }),
    };
    return q;
  };
  return { supabase: { from } };
});
vi.mock("@/lib/site-content", async (orig) => ({ ...(await orig<any>()), invalidateSiteContent: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("HomeLockPanel (fixture store, no real backend)", () => {
  it("defaults to open, locks, persists, reloads as locked, unlocks", async () => {
    const { HomeLockPanel } = await import("./SiteManagementPanel");
    const { I18nProvider } = await import("@/lib/i18n");
    const mount = async () => {
      const el = document.createElement("div"); document.body.appendChild(el);
      const root = createRoot(el);
      await act(async () => { root.render(createElement(I18nProvider as any, null, createElement(HomeLockPanel))); });
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      return { el, root };
    };
    const btn = (el: HTMLElement) => el.querySelector("button") as HTMLButtonElement;
    let m = await mount();
    expect(btn(m.el).textContent).toMatch(/Open|مفتوحة/);           // default: unlocked
    await act(async () => { btn(m.el).click(); await new Promise((r) => setTimeout(r, 20)); });
    expect(btn(m.el).textContent).toMatch(/Locked|مقفولة/);
    expect((store.rows[0].content as any).enabled).toBe(true);
    m.root.unmount();
    m = await mount();                                               // reload
    expect(btn(m.el).textContent).toMatch(/Locked|مقفولة/);
    await act(async () => { btn(m.el).click(); await new Promise((r) => setTimeout(r, 20)); });
    expect((store.rows[0].content as any).enabled).toBe(false);
    expect(store.writes).toEqual(["insert", "update"]);
  });
});
