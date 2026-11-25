/**
 * Pure rules for per-course share links. No I/O, so every rule is unit tested.
 * The server function applies these with the service role; RLS is not widened.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type ShareLinkRow = {
  id: string;
  course_id: string;
  token_hash: string;
  expires_at: string | null;
  revoked_at: string | null;
  /** optional: lock the link once the visitor has finished everything */
  auto_close: boolean;
  /** optional: first browser to start the link keeps it */
  bind_first: boolean;
  claim_hash: string | null;
  closed_at: string | null;
};

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}
export function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}
export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

export type AccessDecision =
  | { ok: true; needsClaim: boolean }
  | { ok: false; reason: "not_found" | "revoked" | "expired" | "closed" | "claimed_elsewhere" };

/**
 * `viewOnly` is a GET / link preview: it never claims or locks anything.
 * Only an explicit start (POST from the page after a click) may claim.
 */
export function decideAccess(
  link: ShareLinkRow | null,
  now: Date,
  presentedClaim: string | null,
): AccessDecision {
  if (!link) return { ok: false, reason: "not_found" };
  if (link.revoked_at) return { ok: false, reason: "revoked" };
  if (link.closed_at) return { ok: false, reason: "closed" };
  if (link.expires_at && new Date(link.expires_at).getTime() <= now.getTime())
    return { ok: false, reason: "expired" };
  if (link.bind_first && link.claim_hash) {
    if (!presentedClaim || !safeEqualHex(sha256(presentedClaim), link.claim_hash))
      return { ok: false, reason: "claimed_elsewhere" };
    return { ok: true, needsClaim: false };
  }
  return { ok: true, needsClaim: link.bind_first };
}

export type Item = { id: string; kind: string; content?: string | null };
export type Progress = Record<
  string,
  { ended?: boolean; maxRatio?: number; cuesAnswered?: number; opened?: boolean; markedDone?: boolean }
>;

/** Items that need an explicit action: videos need end + every cue, others need opening, notes need "done". */
export function itemDone(item: Item, p: Progress[string] | undefined, cueCount: number): boolean {
  if (!p) return false;
  if (item.kind === "video") {
    const watched = !!p.ended && (p.maxRatio ?? 0) >= 0.9;
    return watched && (p.cuesAnswered ?? 0) >= cueCount;
  }
  if (item.kind === "note" || item.kind === "text") return !!p.markedDone;
  return !!p.opened;
}

export function courseFinished(
  items: Item[],
  progress: Progress,
  cueCountOf: (i: Item) => number,
): boolean {
  return items.length > 0 && items.every((i) => itemDone(i, progress[i.id], cueCountOf(i)));
}

/** Only the claimed browser may report progress; closed links accept nothing. */
export function shouldClose(link: ShareLinkRow, finished: boolean): boolean {
  return link.auto_close && finished && !link.closed_at;
}
