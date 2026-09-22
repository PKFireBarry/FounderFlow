import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barry0719@gmail.com';

async function checkAdminAccess() {
  const { userId } = await auth();

  if (!userId) {
    return { authorized: false, error: 'Unauthorized', status: 401 } as const;
  }

  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;

  if (userEmail !== ADMIN_EMAIL) {
    console.log(`🚫 Unauthorized admin access attempt by: ${userEmail}`);
    return { authorized: false, error: 'Forbidden - Admin access only', status: 403 } as const;
  }

  return { authorized: true, userEmail } as const;
}

interface RemovalRequestItem {
  id: string;
  submittedValue: string;
  matchedField: 'email' | 'linkedinurl' | null;
  entryId: string | null;
  entrySummary?: { name: string; company: string };
  name?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

function toIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

// GET - List removal requests (pending by default) for admin review
export async function GET(req: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.authorized) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const statusFilter = req.nextUrl.searchParams.get('status') || 'pending';

    const snapshot = await getDocs(query(collection(db, 'removal_requests'), orderBy('createdAt', 'desc')));

    const requests: RemovalRequestItem[] = snapshot.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          submittedValue: data.submittedValue || '',
          matchedField: data.matchedField ?? null,
          entryId: data.entryId ?? null,
          entrySummary: data.entrySummary ?? undefined,
          name: data.name ?? undefined,
          reason: data.reason ?? undefined,
          status: data.status || 'pending',
          createdAt: toIso(data.createdAt) || '',
          reviewedAt: toIso(data.reviewedAt),
          reviewedBy: data.reviewedBy ?? null,
        };
      })
      .filter((r) => statusFilter === 'all' || r.status === statusFilter);

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('❌ Error fetching removal requests:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Approve (deletes the matched entry) or reject a removal request
export async function POST(req: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.authorized) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const { requestId, action } = await req.json().catch(() => ({}));

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json({ success: false, error: 'requestId is required' }, { status: 400 });
    }
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ success: false, error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const requestRef = doc(db, 'removal_requests', requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const entryId = requestDoc.data().entryId as string | null;

    if (action === 'approve' && entryId) {
      await deleteDoc(doc(db, 'entry', entryId));
      console.log(`🗑️ Admin ${adminCheck.userEmail} approved removal request ${requestId}, deleted entry ${entryId}`);
    } else {
      console.log(`${action === 'approve' ? '✅' : '🚫'} Admin ${adminCheck.userEmail} ${action}d removal request ${requestId}`);
    }

    await updateDoc(requestRef, {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedAt: Timestamp.now(),
      reviewedBy: adminCheck.userEmail,
    });

    return NextResponse.json({ success: true, message: `Request ${action}d` });
  } catch (error) {
    console.error('❌ Error resolving removal request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
