import { describe, expect, it } from "vitest";
import { itemMediaClass } from "./media-class";

describe("itemMediaClass (real kinds: note/link/file)", () => {
  const cases: [string, string, string][] = [
    ["file", "https://x.test/a.mp4", "video_file"],
    ["file", "courses/u/1-unit.MOV?t=1", "video_file"], // storage path
    ["file", "https://x.test/doc.pdf", "plain"],
    ["link", "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube"],
    ["link", "https://youtu.be/dQw4w9WgXcQ", "youtube"],
    ["file", "https://www.youtube.com/embed/dQw4w9WgXcQ", "youtube"],
    ["link", "https://vimeo.com/123456", "embed_other"],
    ["link", "https://drive.google.com/file/d/abc/view", "embed_other"],
    ["link", "https://example.com/article", "plain"],
    ["note", "https://youtu.be/dQw4w9WgXcQ", "plain"],
  ];
  for (const [k, u, c] of cases) it(`${k} ${u} -> ${c}`, () => expect(itemMediaClass({ kind: k, url: u })).toBe(c));
});
