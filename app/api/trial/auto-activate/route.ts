import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/server';

export async function POST() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
        }

        // Check if user already has a subscription document
        const subRef = doc(db, 'user_subscriptions', userId);
        const subDoc = await getDoc(subRef);

        if (subDoc.exists()) {
            // Already has a subscription (active, expired, or trial) — no-op
            const data = subDoc.data();
            return NextResponse.json({
                success: true,
                message: 'Subscription already exists',
                status: data.status,
                expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
            });
        }

        // Grant 7-day trial
        const now = new Date();
        const trialExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const subscriptionData = {
            stripeCustomerId: null,
            stripeSubscriptionId: `trial_auto_${userId}`,
            status: 'trialing',
            priceId: null,
            plan: 'trial',
            currentPeriodStart: now,
            currentPeriodEnd: trialExpiresAt,
            expiresAt: trialExpiresAt,
            updatedAt: now,
            grantedBy: 'auto_signup',
            grantedAt: now,
            trialToken: null,
        };

        await setDoc(subRef, subscriptionData);

        return NextResponse.json({
            success: true,
            message: 'Pro trial activated for 7 days!',
            expiresAt: trialExpiresAt.toISOString(),
        });
    } catch (error) {
        console.error('Error auto-activating trial:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
