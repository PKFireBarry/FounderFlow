import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const tokenRef = doc(db, 'trial_tokens', token);
        const tokenDoc = await getDoc(tokenRef);

        if (!tokenDoc.exists()) {
            return NextResponse.json({ error: 'Invalid trial link', valid: false }, { status: 404 });
        }

        const tokenData = tokenDoc.data();

        // Check if link has expired
        const linkExpiresAt = tokenData.linkExpiresAt?.toDate?.() || new Date(tokenData.linkExpiresAt);
        if (linkExpiresAt < new Date()) {
            return NextResponse.json({ error: 'This trial link has expired', valid: false }, { status: 410 });
        }

        // Check if already redeemed
        if (tokenData.redeemedBy) {
            return NextResponse.json({ error: 'This trial link has already been used', valid: false }, { status: 409 });
        }

        return NextResponse.json({
            valid: true,
            durationDays: tokenData.durationDays || 30,
        });
    } catch (error) {
        console.error('Error validating trial token:', error);
        return NextResponse.json({
            error: 'Failed to validate token',
            valid: false,
        }, { status: 500 });
    }
}
