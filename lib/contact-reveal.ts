import 'server-only';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase/server';

// Sentinel values swapped in for real email/linkedinurl fields before an
// entry is sent to a caller who isn't entitled to see them. They're
// shaped like real values (valid email / valid linkedin.com URL) so the
// existing chooseLinks() resolution logic still detects "this entry has a
// LinkedIn/email" and renders the paywall chip — it just never resolves to
// the real contact info.
export const EMAIL_SENTINEL = 'contact-locked@founderflow.space';
export const LINKEDIN_SENTINEL = 'https://www.linkedin.com/company/founderflow-locked';

export const ANON_COOKIE_NAME = 'ff_anon_id';
const ANON_REVEAL_LIMIT = 3;
const ANON_REVEAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function isPaidUser(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const subDoc = await getDoc(doc(db, 'user_subscriptions', userId));
  if (!subDoc.exists()) return false;
  const data = subDoc.data();
  const expiresAt = data.expiresAt?.toDate?.() ?? null;
  return expiresAt ? expiresAt > new Date() : false;
}

/**
 * Checks (and if allowed, consumes) one of an anonymous visitor's 3
 * free contact-info reveals per rolling 24h window. Re-revealing an
 * entry already unlocked this window is free (doesn't consume another
 * slot) — this mirrors the old client-only "already viewed" behavior.
 */
export async function checkAndConsumeAnonReveal(
  anonId: string,
  entryId: string
): Promise<{ allowed: boolean }> {
  const ref = doc(db, 'anon_previews', anonId);
  const snap = await getDoc(ref);
  const now = Date.now();

  let ids: string[] = [];
  let windowStart = now;

  if (snap.exists()) {
    const data = snap.data();
    const existingWindowStart = data.windowStart?.toMillis?.() ?? 0;
    if (now - existingWindowStart < ANON_REVEAL_WINDOW_MS) {
      ids = Array.isArray(data.ids) ? data.ids : [];
      windowStart = existingWindowStart;
    }
  }

  if (ids.includes(entryId)) {
    return { allowed: true };
  }

  if (ids.length >= ANON_REVEAL_LIMIT) {
    return { allowed: false };
  }

  ids.push(entryId);
  await setDoc(ref, { ids, windowStart: Timestamp.fromMillis(windowStart) });
  return { allowed: true };
}
