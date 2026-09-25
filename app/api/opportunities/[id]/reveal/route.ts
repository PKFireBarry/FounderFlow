import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { doc, getDoc } from 'firebase/firestore';
import { randomUUID } from 'crypto';
import { db } from '@/lib/firebase/server';
import { isPaidUser, checkAndConsumeAnonReveal, ANON_COOKIE_NAME } from '@/lib/contact-reveal';

// Reveals the real email/linkedinurl for a single entry, if the caller is
// entitled to it: paid subscribers always; anonymous visitors get 3 free
// reveals per rolling 24h, enforced here (not just hidden client-side).
// Signed-in but unpaid users get none, matching the existing paywall.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { userId } = await auth();

    if (userId) {
      const paid = await isPaidUser(userId);
      if (!paid) {
        return NextResponse.json({ error: 'upgrade_required' }, { status: 403 });
      }
    } else {
      let anonId = req.cookies.get(ANON_COOKIE_NAME)?.value;
      const isNewAnonId = !anonId;
      if (!anonId) anonId = randomUUID();

      const { allowed } = await checkAndConsumeAnonReveal(anonId, id);
      if (!allowed) {
        const blocked = NextResponse.json({ error: 'quota_exceeded' }, { status: 403 });
        if (isNewAnonId) {
          blocked.cookies.set(ANON_COOKIE_NAME, anonId, {
            httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365, path: '/',
          });
        }
        return blocked;
      }
    }

    const entryDoc = await getDoc(doc(db, 'entry', id));
    if (!entryDoc.exists()) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const data = entryDoc.data();
    const res = NextResponse.json({ email: data.email ?? null, linkedinurl: data.linkedinurl ?? null, url: data.url ?? null });

    if (!userId && !req.cookies.get(ANON_COOKIE_NAME)) {
      const anonId = randomUUID();
      res.cookies.set(ANON_COOKIE_NAME, anonId, {
        httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365, path: '/',
      });
    }

    return res;
  } catch (error) {
    console.error('❌ Error revealing contact info:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
