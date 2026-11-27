// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { googleCalUrl, outlookCalUrl, downloadIcs } from "./calendar-links";
import { safeHref } from "@/lib/safe-url";

const ev = { id: "s1", title: "استشارة 1:1 مع إسلام سلمي", startsAt: "2026-11-29T09:00:00.000Z", durationMinutes: 30, url: "https://meet.google.com/abc-defg-hij", details: "أخرى" };

describe("booking calendar links", () => {
  it("google link: https host, exact UTC start/end, title and meeting url carried", () => {
    const u = new URL(googleCalUrl(ev));
    expect(u.origin + u.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(u.searchParams.get("dates")).toBe("20261129T090000Z/20261129T093000Z");
    expect(u.searchParams.get("text")).toBe(ev.title);
    expect(u.searchParams.get("location")).toBe(ev.url);
  });
  it("outlook link: https host, ISO start/end 30 min apart", () => {
    const u = new URL(outlookCalUrl(ev));
    expect(u.origin).toBe("https://outlook.live.com");
    expect(u.searchParams.get("startdt")).toBe("2026-11-29T09:00:00.000Z");
    expect(u.searchParams.get("enddt")).toBe("2026-11-29T09:30:00.000Z");
  });
  it("no meeting url yet: location empty, no 'null' text", () => {
    const u = new URL(googleCalUrl({ ...ev, url: null }));
    expect(u.searchParams.get("location")).toBe("");
    expect(u.searchParams.get("details")).not.toContain("null");
  });
  it("meeting link is only ever http(s)", () => {
    expect(safeHref("https://meet.google.com/x")).toBe("https://meet.google.com/x");
    expect(safeHref("zoom.us/j/123")).toBe("https://zoom.us/j/123");
    for (const bad of ["javascript:alert(1)", "data:text/html,hi", "vbscript:x", "file:///etc/passwd"]) expect(safeHref(bad)).toBeNull();
  });
  it("ics download builds a valid VEVENT for the exact slot", async () => {
    let blob: Blob | null = null;
    (URL as any).createObjectURL = (b: Blob) => { blob = b; return "blob:x"; };
    (URL as any).revokeObjectURL = () => {};
    HTMLAnchorElement.prototype.click = vi.fn();
    downloadIcs(ev);
    expect(blob).not.toBeNull();
    const text = await new Response(blob!).text();
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(text).toContain("BEGIN:VEVENT");
    expect(text).toMatch(/DTSTART:20261129T090000Z/);
    expect(text).toMatch(/DTEND:20261129T093000Z/);
    expect(text).toContain("END:VEVENT");
  });
});
