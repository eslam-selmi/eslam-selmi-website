import { test } from "node:test";
import assert from "node:assert/strict";
import { certText, readCertificateSettings } from "./certificate-settings";

test("custom text overrides the default per language", () => {
  const s = readCertificateSettings({ ar: { title: "شهادة تميز" } });
  assert.equal(certText(s, "ar", "title"), "شهادة تميز");
  assert.equal(certText(s, "en", "title"), "Certificate of Completion");
});

test("invalid colors fall back to defaults", () => {
  assert.equal(readCertificateSettings({ colors: { accent: "red" } }).colors.accent, "#19b9b5");
});

test("signaturePath accepts a storage path and rejects traversal or non-strings", () => {
  assert.equal(readCertificateSettings({ signaturePath: "certificate-signatures/c1/1.png" }).signaturePath, "certificate-signatures/c1/1.png");
  assert.equal(readCertificateSettings({ signaturePath: "../x.png" }).signaturePath, "");
  assert.equal(readCertificateSettings({ signaturePath: 5 }).signaturePath, "");
  assert.equal(readCertificateSettings(null).signaturePath, "");
});
