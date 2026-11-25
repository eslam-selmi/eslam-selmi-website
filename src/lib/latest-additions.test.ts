import { describe, expect, it } from "vitest";
import { additionContactSchema } from "./latest-additions";

describe("resource viewer details", () => {
  const details = { full_name: "أحمد محمد", phone: "+201012345678", email: "ahmed@example.com" };
  it("requires a name before viewing", () => {
    expect(additionContactSchema.safeParse({ ...details, full_name: "" }).success).toBe(false);
  });
  it("requires a valid phone before viewing", () => {
    expect(additionContactSchema.safeParse({ ...details, phone: "" }).success).toBe(false);
    expect(additionContactSchema.safeParse({ ...details, phone: "not a phone" }).success).toBe(false);
    expect(additionContactSchema.parse({ ...details, phone: "٠١٠١٢٣٤٥٦٧٨" }).phone).toBe("01012345678");
  });
  it("requires a valid email before viewing", () => {
    expect(additionContactSchema.safeParse({ ...details, email: "" }).success).toBe(false);
    expect(additionContactSchema.safeParse({ ...details, email: "invalid" }).success).toBe(false);
    expect(additionContactSchema.parse(details).email).toBe("ahmed@example.com");
  });
});