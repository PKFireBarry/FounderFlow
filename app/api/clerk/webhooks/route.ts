import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { clientDb } from '../../../../lib/firebase/client';

const TRIAL_DURATION_DAYS = 7;

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    first_name?: string;
    last_name?: string;
    created_at?: number;
  };
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Get the Svix headers for verification
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await req.text();

  // Verify the webhook signature
  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Clerk webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Only handle user.created events
  if (event.type !== 'user.created') {
    return NextResponse.json({ received: true, message: `Ignored event: ${event.type}` });
  }

  const userId = event.data.id;

  try {
    // Check if user already has a subscription (e.g. from a trial link or admin grant)
    const subRef = doc(clientDb, 'user_subscriptions', userId);
    const subDoc = await getDoc(subRef);

    if (subDoc.exists()) {
      return NextResponse.json({ received: true, message: 'User already has subscription' });
    }

    // Create 7-day trial subscription
    const now = new Date();
    const trialExpiresAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    await setDoc(subRef, {
      stripeCustomerId: null,
      stripeSubscriptionId: `auto_trial_${userId}`,
      status: 'trialing',
      priceId: null,
      plan: 'trial',
      currentPeriodStart: now,
      currentPeriodEnd: trialExpiresAt,
      expiresAt: trialExpiresAt,
      updatedAt: now,
      grantedBy: 'auto_signup_trial',
      grantedAt: now,
    });

    return NextResponse.json({
      received: true,
      message: `7-day trial granted to ${userId}`,
    });
  } catch (error) {
    console.error('Error granting auto-trial:', error);
    return NextResponse.json({ error: 'Failed to grant trial' }, { status: 500 });
  }
}
