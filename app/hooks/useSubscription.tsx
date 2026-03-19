"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { clientDb } from '../../lib/firebase/client';

interface SubscriptionData {
  isPaid: boolean;
  plan: string | null;
  expiresAt: Date | null;
  isTrial: boolean;
  trialDaysRemaining: number | null;
}

export function useSubscription() {
  const { user, isSignedIn } = useUser();
  const autoActivatingRef = useRef(false);
  const [subscription, setSubscription] = useState<SubscriptionData>({
    isPaid: false,
    plan: null,
    expiresAt: null,
    isTrial: false,
    trialDaysRemaining: null,
  });
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!isSignedIn || !user?.id) {
      setSubscription({ isPaid: false, plan: null, expiresAt: null, isTrial: false, trialDaysRemaining: null });
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(clientDb, 'user_subscriptions', user.id);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const expiresAt = data.expiresAt?.toDate() || null;
        const isActive = data.status === 'active' || data.status === 'trialing';
        const isNotExpired = expiresAt ? expiresAt > new Date() : false;
        const isPaid = isActive && (isNotExpired || data.status === 'active');

        // Trial detection
        const isTrial = data.status === 'trialing' && isNotExpired;
        const trialDaysRemaining = isTrial && expiresAt
          ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null;

        setSubscription({
          isPaid,
          plan: data.plan || null,
          expiresAt,
          isTrial,
          trialDaysRemaining,
        });
      } else {
        // No subscription document — auto-activate 7-day trial
        if (!autoActivatingRef.current) {
          autoActivatingRef.current = true;
          try {
            const resp = await fetch('/api/trial/auto-activate', { method: 'POST' });
            if (resp.ok) {
              // Re-read the newly created document
              const freshDoc = await getDoc(userDocRef);
              if (freshDoc.exists()) {
                const data = freshDoc.data();
                const expiresAt = data.expiresAt?.toDate() || null;
                const isActive = data.status === 'active' || data.status === 'trialing';
                const isNotExpired = expiresAt ? expiresAt > new Date() : false;
                const isPaid = isActive && (isNotExpired || data.status === 'active');
                const isTrial = data.status === 'trialing' && isNotExpired;
                const trialDaysRemaining = isTrial && expiresAt
                  ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : null;

                setSubscription({ isPaid, plan: data.plan || null, expiresAt, isTrial, trialDaysRemaining });
                return;
              }
            }
          } catch (err) {
            console.error('Error auto-activating trial:', err);
          } finally {
            autoActivatingRef.current = false;
          }
        }
        // Fallback: no subscription
        setSubscription({ isPaid: false, plan: null, expiresAt: null, isTrial: false, trialDaysRemaining: null });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({ isPaid: false, plan: null, expiresAt: null, isTrial: false, trialDaysRemaining: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [isSignedIn, user?.id]);

  const refresh = async () => {
    setLoading(true);
    try {
      // First try to refresh from Stripe
      const response = await fetch('/api/stripe/refresh-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Successfully refreshed subscription from Stripe
      } else {
        // Stripe refresh failed, falling back to Firestore check
      }
    } catch (error) {
      console.error('❌ Error refreshing from Stripe:', error);
    }

    // Always check Firestore after attempting Stripe refresh
    await checkSubscription();
  };

  return {
    ...subscription,
    loading,
    isSignedIn,
    refresh
  };
}