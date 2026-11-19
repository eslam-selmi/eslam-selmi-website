import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRAM_TRACKS, parseProgramTracks } from "./site-programs";

describe("parseProgramTracks", () => {
  it("uses the three default tracks when nothing is saved", () => {
    expect(parseProgramTracks(null)).toHaveLength(3);
    expect(parseProgramTracks(null)).toBe(DEFAULT_PROGRAM_TRACKS);
  });
  it("keeps an admin-added track with its modules and falls back English to Arabic", () => {
    const out = parseProgramTracks({ tracks: [{ key: "new", titleAr: "مسار جديد", modules: [{ nameAr: "محور" }] }] });
    expect(out).toHaveLength(1);
    expect(out[0].titleEn).toBe("مسار جديد");
    expect(out[0].modules[0].nameEn).toBe("محور");
  });
  it("drops tracks without a title", () => {
    expect(parseProgramTracks({ tracks: [{ key: "x" }] })).toHaveLength(0);
  });
});
