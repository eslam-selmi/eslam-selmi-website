import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { resolveIssueDate, buildPayload } from "./self-certificate";
describe("self-issue date and payload", () => {
  it("uses only the server timestamp; none means no date (no client clock)", () => {
    expect(resolveIssueDate("2026-11-01T10:00:00Z")?.toISOString()).toBe("2026-11-01T10:00:00.000Z");
    expect(resolveIssueDate(null, "2026-11-02T10:00:00Z")?.toISOString()).toBe("2026-11-02T10:00:00.000Z");
    expect(resolveIssueDate(null, undefined)).toBeNull();
    expect(resolveIssueDate("garbage")).toBeNull();
  });
  it("payload uses server row id for the verify QR and refuses missing names", () => {
    const row = { id: "enr-1", course_id: "c", name_ar: "أ", name_en: "A", courses: { title: "T", total_hours: 5 } };
    expect(buildPayload(row, "en", new Date(), null, null)?.certificateId).toBe("enr-1");
    expect(buildPayload({ ...row, name_en: null }, "en", new Date(), null, null)).toBeNull();
  });
});
