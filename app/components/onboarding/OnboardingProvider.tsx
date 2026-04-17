"use client";

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSubscription } from '../../hooks/useSubscription';
import { useUser } from '@clerk/nextjs';
import OnboardingTour from './OnboardingTour';
import LegacyInviteBanner from './LegacyInviteBanner';

// Only show on authenticated app pages, never on landing or billing
const TOUR_ELIGIBLE_PATHS = ['/opportunities', '/dashboard', '/outreach', '/billing'];

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
  const [resolved, setResolved] = useState(false);

  const isEligiblePath = TOUR_ELIGIBLE_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (loading || !isSignedIn || !user?.id || !isEligiblePath) return;

    if (resolved) return; // already decided this session

    if (onboardingStatus === 'pending') {
      setMode('tour');
      setResolved(true);
    } else if (onboardingStatus === null) {
      // Existing user — show subtle invite banner
      setMode('banner');
      setResolved(true);
    } else {
      // completed / skipped / dismissed — nothing
      setMode('none');
      setResolved(true);
    }
  }, [loading, isSignedIn, user?.id, onboardingStatus, isEligiblePath, resolved]);

  const handleTourFinish = useCallback(async (status: 'completed' | 'skipped') => {
    setMode('none');
    await persistStatus(status);
  }, []);

  const handleBannerStart = useCallback(() => {
    setMode('tour');
  }, []);

  const handleBannerDismiss = useCallback(async () => {
    setMode('none');
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
