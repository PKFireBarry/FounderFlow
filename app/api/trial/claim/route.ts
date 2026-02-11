import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/server';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
        }

        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Validate token
        const tokenRef = doc(db, 'trial_tokens', token);
        const tokenDoc = await getDoc(tokenRef);

        if (!tokenDoc.exists()) {
            return NextResponse.json({ error: 'Invalid trial link' }, { status: 404 });
        }

        const tokenData = tokenDoc.data();

        // Check if link has expired
        const linkExpiresAt = tokenData.linkExpiresAt?.toDate?.() || new Date(tokenData.linkExpiresAt);
        if (linkExpiresAt < new Date()) {
            return NextResponse.json({ error: 'This trial link has expired' }, { status: 410 });
        }

        // Check if already redeemed
        if (tokenData.redeemedBy) {
            return NextResponse.json({ error: 'This trial link has already been used' }, { status: 409 });
        }

        // Check if user already has an active subscription
        const subRef = doc(db, 'user_subscriptions', userId);
        const subDoc = await getDoc(subRef);

        if (subDoc.exists()) {
            const subData = subDoc.data();
            const expiresAt = subData.expiresAt?.toDate?.() || new Date(subData.expiresAt);
            const isActive = (subData.status === 'active' || subData.status === 'trialing') && expiresAt > new Date();

            if (isActive) {
                return NextResponse.json({
                    error: 'You already have an active subscription',
                    currentPlan: subData.plan,
                }, { status: 409 });
            }
        }

        // Grant the trial
        const now = new Date();
        const durationDays = tokenData.durationDays || 30;
        const trialExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const subscriptionData = {
            stripeCustomerId: null,
            stripeSubscriptionId: `trial_${token}`,
            status: 'trialing',
            priceId: null,
            plan: 'trial',
            currentPeriodStart: now,
            currentPeriodEnd: trialExpiresAt,
            expiresAt: trialExpiresAt,
            updatedAt: now,
            grantedBy: 'trial_link',
            grantedAt: now,
            trialToken: token,
        };

        await setDoc(subRef, subscriptionData);

        // Mark token as redeemed
        await updateDoc(tokenRef, {
            redeemedBy: userId,
            redeemedAt: now,
        });

        return NextResponse.json({
            success: true,
            message: `Pro trial activated for ${durationDays} days!`,
            expiresAt: trialExpiresAt.toISOString(),
        });
    } catch (error) {
        console.error('Error claiming trial:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
