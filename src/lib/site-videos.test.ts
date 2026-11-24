import { describe, expect, it } from "vitest";
import { parseVideos } from "./site-videos";
describe("parseVideos", () => {
  it("drops videos without a link", () => {
    expect(parseVideos({ videos: [{ titleAr: "أ", url: "" }, { titleAr: "ب", url: "https://youtu.be/abcdefghijk" }] }).videos.map(v => v.titleAr)).toEqual(["ب"]);
  });
  it("keeps hidden videos hidden", () => {
    expect(parseVideos({ videos: [{ url: "https://x.com/a.mp4", visible: false }] }).videos[0]?.visible).toBe(false);
  });
});
