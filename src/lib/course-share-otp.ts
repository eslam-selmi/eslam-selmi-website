/**
 * Email-code binding for a share link (PREPARED, not enabled): the link is tied to one email,
 * a 6 digit code is mailed, and the browser that enters it gets access. Another device can
 * verify again later (the newest verified browser keeps access). This proves ownership of the
 * email, not the person's identity. Pure rules: sending goes through Mailer, which has no real
 * implementation yet, so nothing can be sent.
 */
import { randomInt } from "node:crypto";
import { decideAccess, newToken, sha256, type ShareLinkRow } from "./course-share-core";

export const CODE_TTL_MS = 10 * 60_000;
export const RESEND_GAP_MS = 60_000;
export const MAX_ATTEMPTS = 5;

export interface Mailer { send(to: string, code: string): Promise<void> }
/** The only mailer that exists. It refuses to send until real sending is approved and wired. */
export const disabledMailer: Mailer = { async send() { throw new Error("email codes are not enabled"); } };

export type Challenge = { code_hash: string; expires_at: string; attempts: number; created_at: string };
export interface OtpStore {
  findByTokenHash(hash: string): Promise<ShareLinkRow | null>;
  getBoundEmail(linkId: string): Promise<string | null>;
  getChallenge(linkId: string): Promise<Challenge | null>;
  saveChallenge(linkId: string, c: Challenge): Promise<void>;
  bumpAttempts(linkId: string): Promise<number>;
  clearChallenge(linkId: string): Promise<void>;
  /** Unconditional: the newest verified browser replaces the previous claim. */
  setClaim(linkId: string, claimHash: string): Promise<void>;
}

const norm = (e: string) => e.trim().toLowerCase();
const hashCode = (linkId: string, code: string) => sha256(`${linkId}:${code}`);

/** Always answers ok for a usable link so nobody can learn which email is bound. Mails only to the bound email. */
export async function requestCode(store: OtpStore, mailer: Mailer, token: string, email: string, now = new Date()) {
  const link = await store.findByTokenHash(sha256(token));
  const d = decideAccess(link, now, null);
  if (!d.ok && d.reason !== "claimed_elsewhere") return d;
  const bound = await store.getBoundEmail(link!.id);
  if (!bound || norm(bound) !== norm(email)) return { ok: true as const };
  const cur = await store.getChallenge(link!.id);
  if (cur && now.getTime() - new Date(cur.created_at).getTime() < RESEND_GAP_MS) return { ok: true as const };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await store.saveChallenge(link!.id, { code_hash: hashCode(link!.id, code), expires_at: new Date(now.getTime() + CODE_TTL_MS).toISOString(), attempts: 0, created_at: now.toISOString() });
  await mailer.send(bound, code);
  return { ok: true as const };
}

export async function verifyCode(store: OtpStore, token: string, email: string, code: string, now = new Date()) {
  const link = await store.findByTokenHash(sha256(token));
  const d = decideAccess(link, now, null);
  if (!d.ok && d.reason !== "claimed_elsewhere") return d;
  const bound = await store.getBoundEmail(link!.id);
  const ch = await store.getChallenge(link!.id);
  const bad = { ok: false as const, reason: "bad_code" as const };
  if (!bound || norm(bound) !== norm(email) || !ch) return bad;
  if (new Date(ch.expires_at).getTime() <= now.getTime() || ch.attempts >= MAX_ATTEMPTS) { await store.clearChallenge(link!.id); return bad; }
  if (!/^\d{6}$/.test(code) || hashCode(link!.id, code) !== ch.code_hash) { await store.bumpAttempts(link!.id); return bad; }
  await store.clearChallenge(link!.id);
  const claim = newToken();
  await store.setClaim(link!.id, sha256(claim));
  return { ok: true as const, claim };
}
