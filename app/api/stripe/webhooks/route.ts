import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '../../../../lib/stripe';
import { clientDb } from '../../../../lib/firebase/client';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { calculateSubscriptionPeriods } from '../../../../lib/stripe-utils';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  // Webhook handler started
  
  if (!stripe) {
    console.error('❌ Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await req.text();
  const sig = (await headers()).get('stripe-signature');

  // Webhook details processed

  if (!sig) {
    console.error('❌ No signature in webhook');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('❌ Webhook secret not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
    // Webhook signature verified successfully
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency Check: Prevent duplicate processing
  const eventId = event.id;
  const processedEventRef = doc(clientDb, 'processed_stripe_events', eventId);

  try {
    const processedEventDoc = await getDoc(processedEventRef);

    if (processedEventDoc.exists()) {
      // Event already processed - return success to acknowledge webhook
      console.log(`✅ Webhook event ${eventId} already processed (idempotent), skipping`);
      return NextResponse.json({
        received: true,
        message: 'Event already processed',
        eventId
      });
    }
  } catch (idempotencyError) {
    console.error('⚠️ Error checking idempotency, proceeding with processing:', idempotencyError);
    // If idempotency check fails, proceed anyway to avoid blocking webhook
  }

  try {
    // Processing webhook event
    console.log(`📥 Processing Stripe webhook: ${event.type} (${eventId})`);

    switch (event.type) {
      case 'checkout.session.completed': {
        // Processing checkout.session.completed
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.clerk_user_id;

        // Session details processed

        if (!userId) {
          console.error('❌ No user ID in session metadata:', session.metadata);
          break;
        }

        // Get the subscription details
        if (session.subscription && typeof session.subscription === 'string') {
          // Retrieving subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription, {
            expand: ['latest_invoice', 'items.data.price']
          });
          
          // Subscription details processed
          
          // Calculate subscription periods
          const { start: currentPeriodStart, end: currentPeriodEnd } = calculateSubscriptionPeriods(subscription);

          const docData = {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0].price.id,
            plan: subscription.items.data[0].price.recurring?.interval || 'monthly',
            currentPeriodStart,
            currentPeriodEnd,
            expiresAt: currentPeriodEnd,
            updatedAt: new Date(),
          };
          
          // Saving to Firestore
          
          await setDoc(doc(clientDb, 'user_subscriptions', userId), docData);
          // Successfully saved subscription to Firestore
        } else {
          // No subscription in session
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('metadata' in customer) {
          const userId = customer.metadata?.clerk_user_id;
          
          if (userId) {
            // Calculate subscription periods
            const { start: currentPeriodStart, end: currentPeriodEnd } = calculateSubscriptionPeriods(subscription);

            await setDoc(doc(clientDb, 'user_subscriptions', userId), {
              stripeCustomerId: subscription.customer,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              priceId: subscription.items.data[0].price.id,
              plan: subscription.items.data[0].price.recurring?.interval || 'monthly',
              currentPeriodStart,
              currentPeriodEnd,
              expiresAt: currentPeriodEnd,
              updatedAt: new Date(),
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('metadata' in customer) {
          const userId = customer.metadata?.clerk_user_id;
          
          if (userId) {
            await deleteDoc(doc(clientDb, 'user_subscriptions', userId));
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if ((invoice as any).subscription) {
          const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          
          if ('metadata' in customer) {
            const userId = customer.metadata?.clerk_user_id;
            
            if (userId) {
              // Calculate subscription periods
              const { start: currentPeriodStart, end: currentPeriodEnd } = calculateSubscriptionPeriods(subscription);

              await setDoc(doc(clientDb, 'user_subscriptions', userId), {
                stripeCustomerId: subscription.customer,
                stripeSubscriptionId: subscription.id,
                status: subscription.status,
                priceId: subscription.items.data[0].price.id,
                plan: subscription.items.data[0].price.recurring?.interval || 'monthly',
                currentPeriodStart,
                currentPeriodEnd,
                expiresAt: currentPeriodEnd,
                updatedAt: new Date(),
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Handle failed payments - could send email notification
        // Payment failed for invoice
        break;
      }

      default:
        // Unhandled event type
        console.log(`ℹ️ Unhandled webhook event type: ${event.type}`);
    }

    // Mark event as processed (idempotency)
    try {
      await setDoc(processedEventRef, {
        eventId,
        eventType: event.type,
        processedAt: serverTimestamp(),
        created: event.created
      });
      console.log(`✅ Marked event ${eventId} as processed`);
    } catch (markError) {
      console.error('⚠️ Failed to mark event as processed (non-fatal):', markError);
      // Don't fail the webhook if we can't mark it processed
    }

    // Webhook processed successfully
    console.log(`✅ Webhook ${event.type} (${eventId}) processed successfully`);
    return NextResponse.json({ received: true, eventId });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Don't mark as processed if processing failed - allow retry
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}