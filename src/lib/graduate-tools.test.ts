import { describe, it, expect } from "vitest";
import { Bot, Mail, Palette, Sparkles } from "lucide-react";
import { iconForTool, parseGraduateTools, DEFAULT_GRADUATE_TOOLS } from "./graduate-tools";

describe("graduate tools", () => {
  it("picks AI icon", () => expect(iconForTool({ ar: "الذكاء الاصطناعي", en: "" })).toBe(Bot));
  it("picks Outlook icon", () => expect(iconForTool({ ar: "Outlook باحتراف", en: "" })).toBe(Mail));
  it("picks Canva icon", () => expect(iconForTool({ ar: "تصميم Canva", en: "" })).toBe(Palette));
  it("falls back", () => expect(iconForTool({ ar: "شيء", en: "xyz" })).toBe(Sparkles));
  it("defaults when unset", () => expect(parseGraduateTools(null)).toBe(DEFAULT_GRADUATE_TOOLS));
  it("keeps empty saved list", () => expect(parseGraduateTools({ tools: [] })).toEqual([]));
});
