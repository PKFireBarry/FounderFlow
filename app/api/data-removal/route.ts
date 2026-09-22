import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase/server';

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeLinkedIn(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

// POST - Public submission: someone listed in the `entry` directory (not a FounderFlow
// user) asks for their record to be reviewed for removal. No auth required — the whole
// point is this is for people who never signed up.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 2000) : '';

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Please enter the email or LinkedIn URL as it appears on FounderFlow.' },
        { status: 400 }
      );
    }

    const entryCollection = collection(db, 'entry');
    let entryId: string | null = null;
    let matchedField: 'email' | 'linkedinurl' | null = null;
    let entrySummary: { name: string; company: string } | null = null;

    // Try exact matches first (cheap, uses Firestore indexes).
    const emailMatch = await getDocs(query(entryCollection, where('email', '==', identifier)));
    if (!emailMatch.empty) {
      const d = emailMatch.docs[0];
      entryId = d.id;
      matchedField = 'email';
      entrySummary = { name: d.data().name || '', company: d.data().company || '' };
    }

    if (!entryId) {
      const linkedinMatch = await getDocs(query(entryCollection, where('linkedinurl', '==', identifier)));
      if (!linkedinMatch.empty) {
        const d = linkedinMatch.docs[0];
        entryId = d.id;
        matchedField = 'linkedinurl';
        entrySummary = { name: d.data().name || '', company: d.data().company || '' };
      }
    }

    // Fall back to a normalized in-memory scan (handles case differences, a trailing
    // slash on a LinkedIn URL, etc.) if the exact-match queries found nothing.
    if (!entryId) {
      const normalizedEmail = normalizeEmail(identifier);
      const normalizedLinkedIn = normalizeLinkedIn(identifier);
      const allEntries = await getDocs(entryCollection);
      for (const d of allEntries.docs) {
        const data = d.data();
        if (data.email && normalizeEmail(String(data.email)) === normalizedEmail) {
          entryId = d.id;
          matchedField = 'email';
          entrySummary = { name: data.name || '', company: data.company || '' };
          break;
        }
        if (data.linkedinurl && normalizeLinkedIn(String(data.linkedinurl)) === normalizedLinkedIn) {
          entryId = d.id;
          matchedField = 'linkedinurl';
          entrySummary = { name: data.name || '', company: data.company || '' };
          break;
        }
      }
    }

    await addDoc(collection(db, 'removal_requests'), {
      submittedValue: identifier,
      matchedField,
      entryId,
      ...(entrySummary ? { entrySummary } : {}),
      ...(name ? { name } : {}),
      ...(reason ? { reason } : {}),
      status: 'pending',
      createdAt: Timestamp.now(),
      reviewedAt: null,
      reviewedBy: null,
    });

    // Same response regardless of match outcome — don't confirm/deny to an anonymous
    // submitter whether a given email/LinkedIn URL exists in the database.
    return NextResponse.json({
      success: true,
      message: "Thanks — we've received your request and will review it shortly.",
    });
  } catch (error) {
    console.error('❌ Error handling data-removal request:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong submitting your request. Please try again.' },
      { status: 500 }
    );
  }
}
