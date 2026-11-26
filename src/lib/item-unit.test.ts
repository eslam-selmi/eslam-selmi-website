import { describe, expect, it } from "vitest";
import { getItemUnit, regroupByUnit, setItemUnit, stripItemUnit } from "./item-unit";
import { visibleItemText } from "./video-cues";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const OTHER_COURSE = "99999999-9999-4999-8999-999999999999";
const mk = (id: string, module_id: string, content: string | null = null) => ({ id, module_id, content });

describe("item unit tag", () => {
  it("round trips the original note text", () => {
    const tagged = setItemUnit("ملاحظة\nسطر ثاني", B);
    expect(getItemUnit(tagged)).toBe(B);
    expect(stripItemUnit(tagged)).toBe("ملاحظة\nسطر ثاني");
    expect(setItemUnit(tagged, null)).toBe("ملاحظة\nسطر ثاني");
    expect(visibleItemText(tagged)).toBe("ملاحظة\nسطر ثاني");
  });
  it("tag with no note and removal gives null content", () => {
    expect(setItemUnit(null, B)).toBe(`[[unit:${B}]]`);
    expect(setItemUnit(setItemUnit(null, B), null)).toBeNull();
    expect(visibleItemText(setItemUnit(null, B))).toBeNull();
  });
  it("re-tagging replaces the tag instead of stacking", () => {
    const t = setItemUnit(setItemUnit("x", A), B);
    expect(t).toBe(`[[unit:${B}]]\nx`);
  });
  it("ignores malformed or arbitrary tags", () => {
    expect(getItemUnit("[[unit:not-a-uuid]]")).toBeNull();
    expect(getItemUnit("text [[unit:" + B + "]]")).toBeNull();
    expect(getItemUnit(null)).toBeNull();
  });
});

describe("regroupByUnit", () => {
  it("moves tagged items under the target unit of the same course", () => {
    const r = regroupByUnit([A, B], { [A]: [mk("x", A, setItemUnit(null, B)), mk("y", A)], [B]: [mk("w", B)] });
    expect(r[A].map((i) => i.id)).toEqual(["y"]);
    expect(r[B].map((i) => i.id)).toEqual(["x", "w"]);
  });
  it("a tag naming a unit outside this course (or a deleted unit) leaves the item home", () => {
    const r = regroupByUnit([A, B], { [A]: [mk("x", A, setItemUnit(null, OTHER_COURSE))], [B]: [] });
    expect(r[A].map((i) => i.id)).toEqual(["x"]);
    expect(r[B]).toEqual([]);
  });
  it("tag naming its own unit is a no-op, never duplicates or drops items", () => {
    const r = regroupByUnit([A, B], { [A]: [mk("x", A, setItemUnit(null, A))], [B]: [mk("w", B)] });
    expect(Object.values(r).flat().map((i) => i.id).sort()).toEqual(["w", "x"]);
  });
  it("is case insensitive on ids and keeps every item exactly once", () => {
    const r = regroupByUnit([A, B], { [A]: [mk("x", A, `[[unit:${B.toUpperCase()}]]`)], [B]: [] });
    expect(r[B].map((i) => i.id)).toEqual(["x"]);
  });
});
