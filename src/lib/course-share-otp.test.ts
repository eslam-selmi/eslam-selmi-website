import { describe, it, expect } from "vitest";
import { requestCode, verifyCode, disabledMailer, type OtpStore, type Challenge, type Mailer } from "./course-share-otp";
import { sha256, decideAccess, type ShareLinkRow } from "./course-share-core";

const now = new Date("2026-11-25T12:00:00Z");
function setup() {
  const link: ShareLinkRow = { id: "l1", course_id: "c", token_hash: sha256("T"), expires_at: null, revoked_at: null, auto_close: false, bind_first: true, claim_hash: null, closed_at: null };
  let ch: Challenge | null = null; const sent: { to: string; code: string }[] = [];
  const store: OtpStore = {
    async findByTokenHash(h) { return h === link.token_hash ? link : null; },
    async getBoundEmail() { return "Guest@Example.com"; },
    async getChallenge() { return ch; }, async saveChallenge(_i, c) { ch = c; },
    async bumpAttempts() { ch!.attempts++; return ch!.attempts; }, async clearChallenge() { ch = null; },
    async setClaim(_i, h) { link.claim_hash = h; },
  };
  const mailer: Mailer = { async send(to, code) { sent.push({ to, code }); } };
  return { link, store, mailer, sent, getCh: () => ch };
}
describe("share email code (prepared)", () => {
  it("mails only the bound email; wrong email gets the same ok and nothing is sent", async () => {
    const s = setup();
    expect(await requestCode(s.store, s.mailer, "T", "other@x.com", now)).toEqual({ ok: true });
    expect(s.sent.length).toBe(0);
    await requestCode(s.store, s.mailer, "T", " guest@example.com ", now);
    expect(s.sent.length).toBe(1); expect(s.sent[0].to).toBe("Guest@Example.com"); expect(s.sent[0].code).toMatch(/^\d{6}$/);
    expect(JSON.stringify(s.getCh())).not.toContain(s.sent[0].code);
  });
  it("correct code gives a claim that opens the link; a second device can verify again and replaces the first", async () => {
    const s = setup();
    await requestCode(s.store, s.mailer, "T", "guest@example.com", now);
    const r: any = await verifyCode(s.store, "T", "guest@example.com", s.sent[0].code, now);
    expect(r.ok).toBe(true); expect(decideAccess(s.link, now, r.claim).ok).toBe(true);
    const later = new Date(now.getTime() + 120_000);
    await requestCode(s.store, s.mailer, "T", "guest@example.com", later);
    const r2: any = await verifyCode(s.store, "T", "guest@example.com", s.sent[1].code, later);
    expect(r2.ok).toBe(true); expect(decideAccess(s.link, later, r.claim).ok).toBe(false);
  });
  it("wrong code, expiry, attempt limit, and one-time use", async () => {
    const s = setup();
    await requestCode(s.store, s.mailer, "T", "guest@example.com", now);
    const code = s.sent[0].code; const wrong = code === "000000" ? "000001" : "000000";
    expect((await verifyCode(s.store, "T", "guest@example.com", wrong, now)).ok).toBe(false);
    expect((await verifyCode(s.store, "T", "guest@example.com", code, new Date(now.getTime() + 11 * 60_000))).ok).toBe(false);
    await requestCode(s.store, s.mailer, "T", "guest@example.com", new Date(now.getTime() + 12 * 60_000));
    const t = new Date(now.getTime() + 12 * 60_000); const c2 = s.sent[1].code; const w2 = c2 === "000000" ? "000001" : "000000";
    for (let i = 0; i < 5; i++) await verifyCode(s.store, "T", "guest@example.com", w2, t);
    expect((await verifyCode(s.store, "T", "guest@example.com", c2, t)).ok).toBe(false);
    await requestCode(s.store, s.mailer, "T", "guest@example.com", new Date(now.getTime() + 20 * 60_000));
    const t3 = new Date(now.getTime() + 20 * 60_000); const c3 = s.sent[2].code;
    expect((await verifyCode(s.store, "T", "guest@example.com", c3, t3)).ok).toBe(true);
    expect((await verifyCode(s.store, "T", "guest@example.com", c3, t3)).ok).toBe(false);
  });
  it("resend within a minute is ignored; closed or revoked links get nothing", async () => {
    const s = setup();
    await requestCode(s.store, s.mailer, "T", "guest@example.com", now);
    await requestCode(s.store, s.mailer, "T", "guest@example.com", new Date(now.getTime() + 10_000));
    expect(s.sent.length).toBe(1);
    s.link.revoked_at = now.toISOString();
    expect((await requestCode(s.store, s.mailer, "T", "guest@example.com", now)).ok).toBe(false);
  });
  it("the only real mailer refuses to send", async () => { await expect(disabledMailer.send("a@b.c", "123456")).rejects.toThrow(); });
});
