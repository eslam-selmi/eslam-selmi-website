import { describe, expect, it } from "vitest";
import {
  CUE_PREFIX,
  formatTime,
  hasVideoCues,
  isVideoFileItem,
  nextDueCue,
  parseTimeInput,
  parseVideoCues,
  serializeVideoCues,
  visibleItemText,
} from "./video-cues";

const cue = {
  at: 30,
  question: "ما هو الهدف؟",
  options: ["أ", "ب"],
  correct: 1,
  explanation: "لأن",
};

describe("video cues", () => {
  it("round-trips and sorts", () => {
    const s = serializeVideoCues([{ ...cue, at: 90 }, cue])!;
    expect(s.startsWith(CUE_PREFIX)).toBe(true);
    expect(parseVideoCues(s).map((c) => c.at)).toEqual([30, 90]);
  });
  it("drops invalid cues and returns null when none remain", () => {
    expect(serializeVideoCues([{ ...cue, correct: 5 }])).toBeNull();
    expect(serializeVideoCues([{ ...cue, options: ["أ"] }])).toBeNull();
    expect(serializeVideoCues([{ ...cue, question: " " }])).toBeNull();
  });
  it("never treats plain notes or bad JSON as cues", () => {
    expect(parseVideoCues("ملاحظة عادية")).toEqual([]);
    expect(parseVideoCues(CUE_PREFIX + "{bad")).toEqual([]);
    expect(parseVideoCues(null)).toEqual([]);
    expect(hasVideoCues("ملاحظة")).toBe(false);
  });
  it("hides cue storage from visible text but keeps notes", () => {
    expect(visibleItemText(serializeVideoCues([cue]))).toBeNull();
    expect(visibleItemText("ملاحظة")).toBe("ملاحظة");
  });
  it("parses and formats time", () => {
    expect(parseTimeInput("1:30")).toBe(90);
    expect(parseTimeInput("90")).toBe(90);
    expect(parseTimeInput("1:02:03")).toBe(3723);
    expect(parseTimeInput("1:75")).toBeNull();
    expect(parseTimeInput("abc")).toBeNull();
    expect(formatTime(90)).toBe("1:30");
    expect(formatTime(3723)).toBe("1:02:03");
  });
  it("finds the first unanswered due cue", () => {
    const cues = [cue, { ...cue, at: 60 }];
    expect(nextDueCue(cues, new Set(), 10)).toBe(-1);
    expect(nextDueCue(cues, new Set(), 31)).toBe(0);
    expect(nextDueCue(cues, new Set([0]), 31)).toBe(-1);
    expect(nextDueCue(cues, new Set([0]), 70)).toBe(1);
  });
  it("recognises only playable video file items", () => {
    expect(isVideoFileItem({ kind: "file", url: "a/b/1-unit.mp4" })).toBe(true);
    expect(isVideoFileItem({ kind: "file", url: "a/b/doc.pdf" })).toBe(false);
    expect(isVideoFileItem({ kind: "note", url: null })).toBe(false);
  });
});
