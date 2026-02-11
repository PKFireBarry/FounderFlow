import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/server';
import crypto from 'crypto';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barry0719@gmail.com';
const TRIAL_API_KEY = process.env.TRIAL_API_KEY;

// Helper to check if request is authorized (either admin session or API key)
async function isAuthorized(req: NextRequest): Promise<{ authorized: boolean; source: string }> {
    // Check for API key header first (for n8n/webhook usage)
    const apiKey = req.headers.get('x-api-key');
    if (TRIAL_API_KEY && apiKey === TRIAL_API_KEY) {
        return { authorized: true, source: 'api_key' };
    }

    // Fall back to Clerk session auth
    try {
        const { userId } = await auth();
        if (!userId) return { authorized: false, source: 'none' };

        const user = await currentUser();
        const userEmail = user?.emailAddresses?.[0]?.emailAddress;

        if (userEmail === ADMIN_EMAIL) {
            return { authorized: true, source: 'admin_session' };
        }
    } catch {
        // Auth check failed
    }

    return { authorized: false, source: 'none' };
}

export async function POST(req: NextRequest) {
    try {
        const { authorized, source } = await isAuthorized(req);

        if (!authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Optional body params
        let durationDays = 30;
        let linkExpiryDays = 7;
        let note = '';

        try {
            const body = await req.json();
            if (body.durationDays) durationDays = body.durationDays;
            if (body.linkExpiryDays) linkExpiryDays = body.linkExpiryDays;
            if (body.note) note = body.note;
        } catch {
            // No body or invalid JSON — use defaults
        }

        // Generate a unique token
        const token = crypto.randomBytes(16).toString('hex');

        const now = new Date();
        const linkExpiresAt = new Date(now.getTime() + linkExpiryDays * 24 * 60 * 60 * 1000);

        const tokenData = {
            token,
            durationDays,
            createdAt: now,
            linkExpiresAt,
            redeemedBy: null,
            redeemedAt: null,
            note: note || null,
            createdVia: source,
        };

        await setDoc(doc(db, 'trial_tokens', token), tokenData);

        // Build the full URL
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://founderflow.space';
        const trialUrl = `${baseUrl}/trial/${token}`;

        return NextResponse.json({
            success: true,
            token,
            url: trialUrl,
            linkExpiresAt: linkExpiresAt.toISOString(),
            durationDays,
            note: note || null,
        });
    } catch (error) {
        console.error('Error generating trial link:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
