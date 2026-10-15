import { test } from "node:test";
import assert from "node:assert/strict";
import { certText, readCertificateSettings } from "./certificate-settings";

test("custom text overrides the default per language", () => {
  const s = readCertificateSettings({ ar: { title: "شهادة تميز" } });
  assert.equal(certText(s, "ar", "title"), "شهادة تميز");
  assert.equal(certText(s, "en", "title"), "CERTIFICATE");
});

test("invalid colors fall back to defaults", () => {
  assert.equal(readCertificateSettings({ colors: { accent: "red" } }).colors.accent, "#1f7f9a");
});
