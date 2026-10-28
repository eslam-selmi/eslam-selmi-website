import { describe, expect, it } from "vitest";
import { mediaSource } from "./media-url";

describe("course video URLs", () => {
  it.each([
    "https://youtu.be/s3dy0jlzZOI?si=CmgVPNU5cw1Equ6y",
    "https://www.youtube.com/watch?v=s3dy0jlzZOI",
    "https://www.youtube.com/shorts/s3dy0jlzZOI",
    "https://www.youtube.com/live/s3dy0jlzZOI",
    "https://www.youtube.com/embed/s3dy0jlzZOI",
  ])("embeds %s instead of treating it as a video file", (url) => {
    expect(mediaSource(url)).toEqual({ url: "https://www.youtube.com/embed/s3dy0jlzZOI?rel=0", kind: "embed" });
  });
  it("preserves Vimeo private-link access hashes", () => {
    expect(mediaSource("https://vimeo.com/12345678/abcdef").url).toBe("https://player.vimeo.com/video/12345678?h=abcdef");
  });
  it("converts Drive share links to preview", () => {
    expect(mediaSource("https://drive.google.com/file/d/abc123/view?usp=sharing").url).toBe("https://drive.google.com/file/d/abc123/preview");
  });
  it("plays direct video links with query strings as video files", () => {
    expect(mediaSource("https://example.com/lesson.mp4?token=example").kind).toBe("video");
  });
  it("does not treat lookalike domains as providers", () => {
    expect(mediaSource("https://evil-youtube.com/watch?v=s3dy0jlzZOI").kind).toBe("external");
  });
  it("rejects script URLs", () => {
    expect(mediaSource("javascript:alert(1)").url).toBe("");
  });
});