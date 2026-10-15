import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { profileLinks, readSiteProfile } from "./site-profile-data";

describe("editable public site profile", () => {
  test("saved phone updates phone and WhatsApp destinations", () => {
    const links = profileLinks(readSiteProfile({ phone: "+20 100 123 4567" }));
    assert.equal(links.phone, "tel:+201001234567");
    assert.equal(links.whatsapp, "https://wa.me/201001234567");
  });
  test("saved email and LinkedIn update public contact destinations", () => {
    const links = profileLinks(readSiteProfile({ email: "contact@example.com", linkedin: "https://www.linkedin.com/in/new-profile/" }));
    assert.equal(links.email, "mailto:contact@example.com");
    assert.equal(links.linkedin, "https://www.linkedin.com/in/new-profile/");
  });
  test("portrait and arbitrary footer wording remain administrator-controlled", () => {
    const profile = readSiteProfile({ portrait: "/new-portrait.png", footer_ar: "مرحباً بكم", footer_en: "Welcome" });
    assert.equal(profile.portrait, "/new-portrait.png");
    assert.equal(profile.footer_ar, "مرحباً بكم");
    assert.equal(profile.footer_en, "Welcome");
  });
});