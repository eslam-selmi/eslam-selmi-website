import { describe, expect, test } from "bun:test";
import { profileLinks, readSiteProfile } from "./site-profile-data";

describe("editable public site profile", () => {
  test("saved phone updates phone and WhatsApp destinations", () => {
    const links = profileLinks(readSiteProfile({ phone: "+20 100 123 4567" }));
    expect(links.phone).toBe("tel:+201001234567");
    expect(links.whatsapp).toBe("https://wa.me/201001234567");
  });
  test("saved email and LinkedIn update public contact destinations", () => {
    const links = profileLinks(readSiteProfile({ email: "contact@example.com", linkedin: "https://www.linkedin.com/in/new-profile/" }));
    expect(links.email).toBe("mailto:contact@example.com");
    expect(links.linkedin).toBe("https://www.linkedin.com/in/new-profile/");
  });
  test("portrait and arbitrary footer wording remain administrator-controlled", () => {
    const profile = readSiteProfile({ portrait: "/new-portrait.png", footer_ar: "مرحباً بكم", footer_en: "Welcome" });
    expect(profile.portrait).toBe("/new-portrait.png");
    expect(profile.footer_ar).toBe("مرحباً بكم");
    expect(profile.footer_en).toBe("Welcome");
  });
});