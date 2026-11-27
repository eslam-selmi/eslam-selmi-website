import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { resolveIssueDate, buildPayload } from "./self-certificate";
describe("self-issue date and payload", () => {
  it("uses the immutable server date; legacy row has no exact date; fresh issue uses now", () => {
    expect(resolveIssueDate({ certificate_issued_at: "2026-11-01T10:00:00Z" })?.toISOString()).toBe("2026-11-01T10:00:00.000Z");
    expect(resolveIssueDate({ certificate_issued_at: null })).toBeNull();
    const n = new Date(); expect(resolveIssueDate({}, n)).toBe(n);
  });
  it("payload uses server row id for the verify QR and refuses missing names", () => {
    const row = { id: "enr-1", course_id: "c", name_ar: "أ", name_en: "A", courses: { title: "T", total_hours: 5 } };
    expect(buildPayload(row, "en", new Date(), null, null)?.certificateId).toBe("enr-1");
    expect(buildPayload({ ...row, name_en: null }, "en", new Date(), null, null)).toBeNull();
  });
});
