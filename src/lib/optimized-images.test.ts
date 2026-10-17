import { test } from "node:test";
import { strict as assert } from "node:assert";
import { portraitSources, snapshotThumbnail } from "./optimized-images";
import portrait from "@/assets/portfolio/headshot-cutout.png.asset.json";
import snapshot from "@/assets/snapshots/snap-1.jpg.asset.json";

test("known portrait uses smaller responsive WebP variants", () => {
  const result = portraitSources(portrait.url);
  assert.ok(result.src.endsWith("portrait-640.webp"));
  assert.ok(result.srcSet?.includes("960w"));
});

test("administrator replacement portrait is never substituted", () => {
  const src = "https://example.com/custom-portrait.png";
  assert.deepEqual(portraitSources(src), { src, srcSet: undefined });
});

test("known snapshot is compressed but custom snapshot remains unchanged", () => {
  assert.ok(snapshotThumbnail(snapshot.url).endsWith("snap-1-520.webp"));
  assert.equal(snapshotThumbnail("https://example.com/new-snapshot.jpg"), "https://example.com/new-snapshot.jpg");
});