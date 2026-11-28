import { describe, it, expect } from "vitest";
import { resolveViewing, shouldSyncViewParam } from "./portal-view";

const list = [
  { id: "a", blocked: false },
  { id: "b", blocked: true },
  { id: "c" },
  { id: "d", blocked: null },
];

describe("resolveViewing", () => {
  it("opens an ordinary enrollment", () => { expect(resolveViewing(list, "a")?.id).toBe("a"); });
  it("treats missing or null blocked as not blocked", () => { expect(resolveViewing(list, "c")?.id).toBe("c"); expect(resolveViewing(list, "d")?.id).toBe("d"); });
  it("never opens a blocked enrollment, even when asked by id", () => { expect(resolveViewing(list, "b")).toBeNull(); });
  it("returns null for unknown, empty or missing ids", () => { expect(resolveViewing(list, "zzz")).toBeNull(); expect(resolveViewing(list, "")).toBeNull(); expect(resolveViewing(list, null)).toBeNull(); expect(resolveViewing([], "a")).toBeNull(); });
});

import { pickContinueTarget, pickReadyForCert } from "./portal-view";
describe("pickContinueTarget", () => {
  const en = (id: string, status = "approved", blocked = false) => ({ id, course_id: "c" + id, status, blocked });
  const mods = (c: string, flags: boolean[]) => flags.map((f) => ({ course_id: c, completed_by_admin: f }));
  it("skips blocked, pending, fully done and empty courses; picks the first with unfinished content", () => {
    const e = [en("1", "approved", true), en("2", "pending"), en("3"), en("4"), en("5")];
    const m = [...mods("c1", [false]), ...mods("c2", [false]), ...mods("c3", [true, true]), ...mods("c4", [true, false]), /* c5 has no modules */];
    const r = pickContinueTarget(e, m)!;
    expect(r.en.id).toBe("4"); expect(r.progress).toBe(50); expect(r.done).toBe(1); expect(r.total).toBe(2);
  });
  it("returns null when nothing qualifies", () => { expect(pickContinueTarget([en("1", "approved", true)], mods("c1", [false]))).toBeNull(); });
});
describe("pickReadyForCert", () => {
  it("skips blocked, pending, issued and requested; picks the first eligible approved", () => {
    const list = [
      { id: "1", course_id: "c", status: "approved", blocked: true },
      { id: "2", course_id: "c", status: "pending" },
      { id: "3", course_id: "c", status: "approved", certificate_issued: true },
      { id: "4", course_id: "c", status: "approved", certificate_requested_at: "t" },
      { id: "5", course_id: "c", status: "approved" },
    ];
    expect(pickReadyForCert(list)?.id).toBe("5");
    expect(pickReadyForCert(list.slice(0, 4))).toBeNull();
  });
});

describe("shouldSyncViewParam", () => {
  it("never rewrites the URL once the user has left /portal (e.g. opening a tool)", () => { expect(shouldSyncViewParam("/tools", null, null)).toBe(false); expect(shouldSyncViewParam("/tools", null, "a")).toBe(false); });
  it("syncs on /portal when the view differs", () => { expect(shouldSyncViewParam("/portal", null, "a")).toBe(true); expect(shouldSyncViewParam("/portal", "a", null)).toBe(true); });
  it("does nothing on /portal when already in sync", () => { expect(shouldSyncViewParam("/portal", "a", "a")).toBe(false); expect(shouldSyncViewParam("/portal", null, null)).toBe(false); expect(shouldSyncViewParam("/portal", "", null)).toBe(false); });
});
