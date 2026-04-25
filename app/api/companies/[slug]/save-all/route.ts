import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../../../lib/firebase/server';
import { getCompanyBySlug } from '../../../../../lib/companies';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const result = await getCompanyBySlug(slug);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    const { entries } = result;
    let savedCount = 0;
    let skippedCount = 0;

    for (const entry of entries) {
      const existingQuery = query(
        collection(db, 'saved_jobs'),
        where('userId', '==', userId),
        where('jobId', '==', entry.id)
      );
      const existing = await getDocs(existingQuery);
      if (!existing.empty) {
        skippedCount++;
        continue;
      }

      const cleanEntry = Object.fromEntries(
        Object.entries(entry).filter(([, v]) => v !== undefined)
      );

      await addDoc(collection(db, 'saved_jobs'), {
        userId,
        jobId: entry.id,
        savedAt: serverTimestamp(),
        ...cleanEntry,
      });
      savedCount++;
    }

    return NextResponse.json({ success: true, savedCount, skippedCount });
  } catch (error) {
    console.error('❌ Error in save-all:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
