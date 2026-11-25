/**
 * "Ask once" rule for the Latest Additions contact form.
 * The form is skipped when the visitor is signed in (already registered)
 * or already sent their details once on this browser.
 */
export const CONTACT_DONE_KEY = "latest_additions_contact_done";

type StoreLike = Pick<Storage, "getItem" | "setItem">;

function safeStore(): StoreLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function hasGivenDetails(store: StoreLike | null = safeStore()): boolean {
  try {
    return store?.getItem(CONTACT_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberGivenDetails(store: StoreLike | null = safeStore()): void {
  try {
    store?.setItem(CONTACT_DONE_KEY, "1");
  } catch {
    /* private mode: fall back to the in-page memory only */
  }
}

export function shouldAskForDetails(opts: {
  collectContacts: boolean;
  signedIn: boolean;
  alreadyGiven: boolean;
}): boolean {
  return opts.collectContacts && !opts.signedIn && !opts.alreadyGiven;
}
