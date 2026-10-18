import { test } from "node:test";
import { strict as assert } from "node:assert";
import { courseImage, consultationImage, mediaImage, programMedia } from "./site-media-data";

test("administrator replacement is scoped to the selected course", () => {
  const media = { "course:first": "https://example.com/replacement.jpg" };
  assert.equal(courseImage(media, "first", "التدريب من أول خطوة"), media["course:first"]);
  assert.notEqual(courseImage(media, "second", "التدريب من أول خطوة"), media["course:first"]);
});
test("program and consultation images can be independently replaced and restored", () => {
  const media = { consultation: "https://example.com/banner.jpg", "program:training": "https://example.com/training.jpg" };
  assert.equal(mediaImage(media, "consultation", consultationImage), media.consultation);
  assert.equal(mediaImage(media, "program:training", programMedia[0].image), media["program:training"]);
  assert.equal(mediaImage({ consultation: "" }, "consultation", consultationImage), consultationImage);
});