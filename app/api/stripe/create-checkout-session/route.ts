import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '../../../../lib/stripe';
import { findOrCreateStripeCustomer } from '../../../../lib/stripe-utils';
import { checkCheckoutLimit } from '../../../../lib/ratelimit-firebase';
import { createErrorResponse, ApiErrors } from '../../../../lib/api-error-handler';

export async function POST(req: NextRequest) {
  // Capture userId at the top for error logging
  let userId: string | null = null;

  try {
    // Stripe checkout session request started
    // Environment check completed

    if (!stripe) {
      console.error('❌ Stripe not configured - missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe not configured - missing API keys' }, { status: 500 });
    }

    const authResult = await auth();
    userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate Limiting: Prevent checkout session spam
    const rateLimitResult = await checkCheckoutLimit(userId);
    if (!rateLimitResult.allowed) {
      console.log(`⚠️ Checkout rate limit exceeded for user: ${userId}`);
      return rateLimitResult.response!;
    }

    const { priceId, successUrl, cancelUrl } = await req.json();
    
    // Request data processed

    if (!priceId) {
      console.error('❌ No price ID provided');
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Create or retrieve Stripe customer - handles retroactive scenarios
    let customerId: string;

    try {
      customerId = await findOrCreateStripeCustomer(userId);
      console.log(`✅ Checkout session customer ready: ${customerId}`);
    } catch (error) {
      console.error('❌ Failed to create/find customer for checkout:', userId, error);
      return NextResponse.json({
        error: 'Unable to create checkout session. Please try again.',
        details: 'Customer creation failed'
      }, { status: 500 });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.nextUrl.origin}/billing?success=true`,
      cancel_url: cancelUrl || `${req.nextUrl.origin}/billing?canceled=true`,
      metadata: {
        clerk_user_id: userId,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/stripe/create-checkout-session',
      userId: userId || undefined,
      action: 'create_checkout_session',
      defaultMessage: 'Failed to create checkout session. Please try again.'
    });
  }
}