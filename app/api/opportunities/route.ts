import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { randomUUID } from 'crypto';
import { db } from '@/lib/firebase/server';
import { chooseLinks, cleanEmail, asHttpUrl, canonicalizeUrl } from '@/lib/entry-links';
import { isPaidUser, ANON_COOKIE_NAME, EMAIL_SENTINEL, LINKEDIN_SENTINEL } from '@/lib/contact-reveal';

// The raw alias fields chooseLinks() reads when resolving an entry's
// LinkedIn URL / email. Whichever of these actually produced the resolved
// value gets redacted for a caller who isn't entitled to see it.
const LINKEDIN_SOURCE_KEYS = [
  'linkedinurl', 'linkedin_url', 'linkedin', 'li',
  'company_url', 'companyUrl', 'website', 'site', 'homepage', 'url_website',
  'url', 'roles_url', 'careers', 'jobs_url', 'open_roles_url',
  'apply_url',
];
const EMAIL_SOURCE_KEYS = ['email', 'url'];

function redactContactInfo(raw: Record<string, any>): Record<string, any> {
  const resolved = chooseLinks(raw);
  const sanitized = { ...raw };

  const resolvedLinkedInCanon = resolved.linkedinUrl ? canonicalizeUrl(resolved.linkedinUrl) : null;
  if (resolvedLinkedInCanon) {
    for (const key of LINKEDIN_SOURCE_KEYS) {
      const val = asHttpUrl(sanitized[key]);
      if (val && canonicalizeUrl(val) === resolvedLinkedInCanon) {
        sanitized[key] = LINKEDIN_SENTINEL;
      }
    }
  }

  const resolvedEmail = resolved.emailHref ? resolved.emailHref.replace(/^mailto:/, '').toLowerCase() : null;
  if (resolvedEmail) {
    for (const key of EMAIL_SOURCE_KEYS) {
      const val = cleanEmail(sanitized[key]);
      if (val && val.toLowerCase() === resolvedEmail) {
        sanitized[key] = EMAIL_SENTINEL;
      }
    }
  }

  return sanitized;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const paid = await isPaidUser(userId);

    const entryQuery = query(collection(db, 'entry'), orderBy('published', 'desc'));
    const snap = await getDocs(entryQuery);

    const entries = snap.docs.map((d) => {
      const anyD: any = d as any;
      const createdSec =
        anyD?._document?.createTime?.timestamp?.seconds ?? anyD?._document?.createTime?.seconds;
      const updatedSec =
        anyD?._document?.updateTime?.timestamp?.seconds ?? anyD?._document?.updateTime?.seconds;
      const createdMs = typeof createdSec === 'number' ? createdSec * 1000 : undefined;
      const updatedMs = typeof updatedSec === 'number' ? updatedSec * 1000 : undefined;

      const raw = { id: d.id, __createdAtMillis: createdMs, __updatedAtMillis: updatedMs, ...d.data() };
      return paid ? raw : redactContactInfo(raw);
    });

    const res = NextResponse.json({ entries });

    // Ensure anonymous visitors have a stable id for the reveal-quota
    // endpoint before they've clicked anything.
    if (!userId && !req.cookies.get(ANON_COOKIE_NAME)) {
      res.cookies.set(ANON_COOKIE_NAME, randomUUID(), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }

    return res;
  } catch (error) {
    console.error('❌ Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 });
  }
}
