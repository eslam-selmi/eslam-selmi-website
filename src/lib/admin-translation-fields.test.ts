// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { applyReviewedTranslation, editableTextControl } from "./admin-translation-fields";
afterEach(() => { document.body.replaceChildren(); });
describe("reviewed admin translation", () => {
  it("applies the reviewed edit only to the selected field without saving", () => {
    const source = document.createElement("input"), destination = document.createElement("textarea");
    source.value = "النص الأصلي"; destination.value = "Previous English";
    document.body.append(source, destination);
    let inputs = 0; destination.addEventListener("input", () => { inputs++; });
    expect(applyReviewedTranslation(destination, "Manually reviewed English", "Previous English")).toBe(true);
    expect(destination.value).toBe("Manually reviewed English");
    expect(source.value).toBe("النص الأصلي"); expect(inputs).toBe(1);
  });
  it("does not overwrite changes made after opening review", () => {
    const destination = document.createElement("input"); destination.value = "New manual edit"; document.body.append(destination);
    expect(applyReviewedTranslation(destination, "Translation", "Old value")).toBe(false);
    expect(destination.value).toBe("New manual edit");
  });
  it("excludes secrets, links, numbers and disabled fields", () => {
    for (const type of ["password", "email", "url", "number", "file"]) {
      const input = document.createElement("input"); input.type = type; expect(editableTextControl(input)).toBe(false);
    }
    const disabled = document.createElement("textarea"); disabled.disabled = true; expect(editableTextControl(disabled)).toBe(false);
  });
  it("rejects fields from closed forms", () => {
    const detached = document.createElement("input");
    expect(applyReviewedTranslation(detached, "Translation", "")).toBe(false);
  });
});