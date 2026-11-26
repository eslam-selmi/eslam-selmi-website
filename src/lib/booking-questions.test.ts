import { describe, expect, it } from "vitest";
import { encodeAnswers, firstMissingAnswer, parseBookingQuestions, splitDetails } from "./booking-questions";

const qs = parseBookingQuestions({ questions: [
  { id: "a", label_ar: "اسم الشركة", label_en: "Company", required: true },
  { id: "b", label_ar: "الحجم", label_en: "Size", required: false, options: ["1-10", "11-50"] },
  { id: "a", label_ar: "مكرر", label_en: "dup" },
  { id: "", label_ar: "x" }, { id: "z" }, 5,
] });
describe("booking questions", () => {
  it("keeps valid unique questions only", () => { expect(qs.map((q) => q.id)).toEqual(["a", "b"]); });
  it("flags missing required and invalid choice answers", () => {
    expect(firstMissingAnswer(qs, {})?.id).toBe("a");
    expect(firstMissingAnswer(qs, { a: "x", b: "999" })?.id).toBe("b");
    expect(firstMissingAnswer(qs, { a: "x" })).toBeNull();
  });
  it("encodes answers and splits them back, keeping the trailing email line", () => {
    const stored = "تفاصيلي هنا" + encodeAnswers(qs, { a: "شركة س", b: "11-50" }, "ar") + "\n— a@b.co";
    const s = splitDetails(stored);
    expect(s.text).toBe("تفاصيلي هنا");
    expect(s.qa).toEqual([{ q: "اسم الشركة", a: "شركة س" }, { q: "الحجم", a: "11-50" }]);
    expect(s.tail).toBe("— a@b.co");
  });
  it("is a no-op without answers or marker", () => {
    expect(encodeAnswers(qs, {}, "en")).toBe("");
    expect(splitDetails("plain").qa).toEqual([]);
  });
});
