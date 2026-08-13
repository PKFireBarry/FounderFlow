import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/server';

type Status = 'pending' | 'completed' | 'skipped' | 'dismissed';
const ALLOWED: Status[] = ['pending', 'completed', 'skipped', 'dismissed'];

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const status = body?.status as Status;
        if (!ALLOWED.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const ref = doc(db, 'user_subscriptions', userId);
        const snap = await getDoc(ref);

        const payload: Record<string, unknown> = {
            onboardingStatus: status,
            onboardingUpdatedAt: serverTimestamp(),
        };
        if (status === 'completed' || status === 'skipped' || status === 'dismissed') {
            payload.onboardingCompletedAt = serverTimestamp();
        }

        if (snap.exists()) {
            await updateDoc(ref, payload);
        } else {
            // Edge case: signed-in user with no subscription doc yet.
            // Create a minimal doc so the field persists; auto-activate will
            // still be called by useSubscription on next mount and will no-op.
            await setDoc(ref, { ...payload, createdAt: serverTimestamp() }, { merge: true });
        }

        return NextResponse.json({ success: true, status });
    } catch (error) {
        console.error('Error updating onboarding status:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
