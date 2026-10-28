import { describe, expect, it } from "vitest";
import { courseDeliveryMode } from "./course-delivery";

describe("course delivery format", () => {
  it("preserves the administrator's live selection", () => {
    expect(courseDeliveryMode("live")).toBe("live");
  });
  it("preserves the administrator's recorded selection", () => {
    expect(courseDeliveryMode("recorded")).toBe("recorded");
  });
});