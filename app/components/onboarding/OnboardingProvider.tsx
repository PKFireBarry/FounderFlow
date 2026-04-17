"use client";

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSubscription } from '../../hooks/useSubscription';
import { useUser } from '@clerk/nextjs';
import OnboardingTour from './OnboardingTour';
import LegacyInviteBanner from './LegacyInviteBanner';

const TOUR_ELIGIBLE_PATHS = ['/opportunities', '/dashboard', '/outreach', '/billing'];

// How recent a sign-up must be to auto-trigger the tour (even if onboardingStatus hasn't
// propagated from Firestore yet — race condition safety net).
const NEW_USER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

type Mode = 'tour' | 'banner' | 'none';

async function persistStatus(status: 'completed' | 'skipped' | 'dismissed') {
  try {
    await fetch('/api/onboarding/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    console.error('Failed to save onboarding status', e);
  }
}

export default function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user } = useUser();
  const { onboardingStatus, loading } = useSubscription();
  const pathname = usePathname();
  const [mode, setMode] = useState<Mode>('none');
  // `decided` locks in the decision so we don't re-evaluate after the user
  // has already started or explicitly dismissed the tour / banner.
  const [decided, setDecided] = useState(false);

  const isEligiblePath = TOUR_ELIGIBLE_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (loading || !isSignedIn || !user?.id || !isEligiblePath) return;
    if (decided) return;

    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
    const isNewUser = Date.now() - createdAt < NEW_USER_WINDOW_MS;

    if (onboardingStatus === 'pending' || (onboardingStatus === null && isNewUser)) {
      // Brand-new user — auto-launch the tour.
      // The `isNewUser` branch catches the race where auto-activate writes
      // onboardingStatus:'pending' AFTER the first subscription read completes.
      setMode('tour');
      setDecided(true);
    } else if (onboardingStatus === null && !isNewUser) {
      // Existing user who never saw onboarding — show the soft invite banner.
      // Don't set decided yet — if onboardingStatus later becomes 'pending'
      // (shouldn't happen for old users, but just in case), we can upgrade.
      setMode('banner');
    } else {
      // completed / skipped / dismissed — nothing to show.
      setMode('none');
      setDecided(true);
    }
  }, [loading, isSignedIn, user?.id, user?.createdAt, onboardingStatus, isEligiblePath, decided]);

  const handleTourFinish = useCallback(async (status: 'completed' | 'skipped') => {
    setMode('none');
    setDecided(true);
    await persistStatus(status);
  }, []);

  const handleBannerStart = useCallback(() => {
    setMode('tour');
    setDecided(true);
  }, []);

  const handleBannerDismiss = useCallback(async () => {
    setMode('none');
    setDecided(true);
    await persistStatus('dismissed');
  }, []);

  return (
    <>
      {children}
      {mode === 'tour' && <OnboardingTour onFinish={handleTourFinish} />}
      {mode === 'banner' && (
        <LegacyInviteBanner onStart={handleBannerStart} onDismiss={handleBannerDismiss} />
      )}
    </>
  );
}
