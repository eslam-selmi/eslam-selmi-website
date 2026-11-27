// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const store: { rows: Array<{ id: string; section_key: string; content: any }>; writes: any[]; failNext: boolean } = { rows: [{ id: "p1", section_key: "site.profile", content: {} }], writes: [], failNext: false };
const toasts: string[] = [];
vi.mock("@/integrations/supabase/client", () => {
  const from = () => {
    let key = "";
    const q: any = {
      select: () => q,
      eq: (c: string, v: string) => { if (c === "section_key") key = v; return q; },
      maybeSingle: async () => ({ data: store.rows.find((r) => r.section_key === key) ?? null, error: null }),
      update: (v: any) => ({ eq: async (_c: string, id: string) => {
        if (store.failNext) { store.failNext = false; return { error: { message: "network down" } }; }
        store.writes.push(v.content); store.rows.find((x) => x.id === id)!.content = v.content; return { error: null }; } }),
      insert: async () => ({ error: null }),
    };
    return q;
  };
  const channel: any = { on: () => channel, subscribe: () => channel };
  return { supabase: { from, channel: () => channel, removeChannel: () => {}, storage: {} } };
});
vi.mock("@/lib/site-content", async (orig) => ({ ...(await orig<any>()), invalidateSiteContent: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: (m: string) => toasts.push("ok:" + m), error: (m: string) => toasts.push("err:" + m) } }));

const tick = (ms = 30) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
async function mount() {
  const { SiteProfilePanel } = await import("./SiteProfilePanel");
  const { I18nProvider } = await import("@/lib/i18n");
  const el = document.createElement("div"); document.body.appendChild(el);
  const root = createRoot(el);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => { root.render(createElement(QueryClientProvider, { client: qc }, createElement(I18nProvider as any, null, createElement(SiteProfilePanel)))); });
  await tick(60);
  return { el, root };
}
const btn = (el: HTMLElement, re: RegExp) => [...el.querySelectorAll("button")].find((b) => re.test(b.textContent ?? "")) as HTMLButtonElement;
function setVal(input: HTMLInputElement, v: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, v);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
const submit = async (el: HTMLElement) => { await act(async () => { el.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); }); await tick(); };

describe("SiteProfilePanel socials (fixture store, no real backend)", () => {
  it("rejects bad url, survives a failed save, saves a good url, and it persists across reload", async () => {
    let m = await mount();
    await act(async () => { btn(m.el, /Add platform|إضافة منصة/).click(); }); await tick();
    const url = m.el.querySelectorAll('input[type="url"]')[1] as HTMLInputElement; // [0] is LinkedIn
    await act(async () => { setVal(url, "javascript:alert(1)"); }); await tick();
    await submit(m.el);
    expect(store.writes.length).toBe(0);
    expect(toasts.at(-1)).toContain("رابط غير صالح");

    await act(async () => { setVal(url, "https://instagram.com/eslam"); }); await tick();
    store.failNext = true; await submit(m.el);
    expect(store.writes.length).toBe(0);
    expect(toasts.at(-1)).toBe("err:تعذر الحفظ"); // generic message, nothing written
    expect(btn(m.el, /Save site details|حفظ بيانات الموقع/).disabled).toBe(false); // still dirty, can retry

    await submit(m.el);
    expect(store.rows[0].content.socials).toEqual([{ platform: "facebook", url: "https://instagram.com/eslam" }]);
    expect(toasts.at(-1)).toMatch(/^ok:/);
    m.root.unmount();
    m = await mount();                                              // reload
    expect((m.el.querySelectorAll('input[type="url"]')[1] as HTMLInputElement).value).toBe("https://instagram.com/eslam");
  });
});
