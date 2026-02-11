'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, SignInButton } from '@clerk/nextjs';
import Image from 'next/image';
import Navigation from '../../components/Navigation';

type TokenStatus = 'loading' | 'valid' | 'expired' | 'redeemed' | 'invalid' | 'error';

export default function TrialPage() {
    const params = useParams();
    const router = useRouter();
    const { isSignedIn, isLoaded } = useUser();
    const token = params.token as string;

    const [tokenStatus, setTokenStatus] = useState<TokenStatus>('loading');
    const [claiming, setClaiming] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [durationDays, setDurationDays] = useState(30);

    // Validate the token on mount
    useEffect(() => {
        async function validateToken() {
            try {
                const res = await fetch(`/api/trial/validate?token=${token}`);
                const data = await res.json();

                if (res.ok && data.valid) {
                    setTokenStatus('valid');
                    setDurationDays(data.durationDays || 30);
                } else if (res.status === 410) {
                    setTokenStatus('expired');
                } else if (res.status === 409) {
                    setTokenStatus('redeemed');
                } else {
                    setTokenStatus('invalid');
                }
            } catch {
                setTokenStatus('error');
            }
        }

        if (token) validateToken();
    }, [token]);

    // Auto-claim after sign-in if token is valid
    useEffect(() => {
        if (isLoaded && isSignedIn && tokenStatus === 'valid' && !claiming && !claimed) {
            handleClaim();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, tokenStatus]);

    async function handleClaim() {
        if (claiming || claimed) return;
        setClaiming(true);

        try {
            const res = await fetch('/api/trial/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setClaimed(true);
                // Brief pause then redirect to dashboard
                setTimeout(() => router.push('/dashboard'), 2000);
            } else {
                setErrorMessage(data.error || 'Failed to activate trial');
                if (res.status === 409 && data.currentPlan) {
                    setTokenStatus('redeemed');
                }
            }
        } catch {
            setErrorMessage('Something went wrong. Please try again.');
        } finally {
            setClaiming(false);
        }
    }

    const proFeatures = [
        { icon: '🔗', title: 'LinkedIn Profiles & Emails', desc: 'Get verified contact info for every founder' },
        { icon: '🤖', title: 'AI Outreach Generation', desc: 'Personalized messages with context-aware AI' },
        { icon: '📋', title: 'Outreach Tracking Boards', desc: 'Kanban-style pipeline to manage conversations' },
        { icon: '💾', title: 'Message Archive', desc: 'Save and revisit all your outreach history' },
    ];

    return (
        <div className="min-h-screen antialiased" style={{
            background: `
        radial-gradient(900px 500px at 10% -10%, rgba(5,32,74,.12) 0%, transparent 60%),
        radial-gradient(900px 500px at 90% -10%, rgba(180,151,214,.12) 0%, transparent 60%),
        linear-gradient(180deg, #0c0d14, #0a0b12 60%, #08090f 100%)
      `,
            color: '#ececf1'
        }}>
            <Navigation />

            <main className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
                {/* Loading state */}
                {tokenStatus === 'loading' && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="w-10 h-10 border-2 border-white/20 border-t-[var(--lavender-web)] rounded-full animate-spin mb-4" />
                        <p className="text-[#ccceda] text-sm">Validating your invite...</p>
                    </div>
                )}

                {/* Success — just claimed */}
                {claimed && (
                    <div className="flex flex-col items-center text-center animate-fade-in-up">
                        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">You&apos;re All Set! 🎉</h1>
                        <p className="text-[#ccceda] text-lg mb-2">
                            Your {durationDays}-day Pro trial is now active.
                        </p>
                        <p className="text-[#9ba0b5] text-sm">Redirecting to your dashboard...</p>
                    </div>
                )}

                {/* Valid token — show invite page */}
                {tokenStatus === 'valid' && !claimed && (
                    <div className="animate-fade-in-up">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 mb-6">
                                <div className="h-10 w-10 shrink-0 rounded-full ring-2 ring-white/30 overflow-hidden bg-white/10">
                                    <Image
                                        src="/favicon.png"
                                        alt="Founder Flow Logo"
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-lg font-semibold text-white">Founder Flow</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                You&apos;ve Been Invited! 🚀
                            </h1>
                            <p className="text-[#ccceda] text-lg max-w-lg mx-auto">
                                Get <span className="text-white font-semibold">{durationDays} days of Pro access</span> to
                                Founder Flow — connect directly with seed-stage startup founders.
                            </p>
                        </div>

                        {/* Features grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                            {proFeatures.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="rounded-xl border border-white/10 p-5 hover-glow transition-all"
                                    style={{ background: 'rgba(255,255,255,0.03)' }}
                                >
                                    <div className="text-2xl mb-3">{feature.icon}</div>
                                    <h3 className="text-white font-semibold text-sm mb-1">{feature.title}</h3>
                                    <p className="text-[#9ba0b5] text-xs leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="text-center">
                            {isSignedIn ? (
                                <button
                                    onClick={handleClaim}
                                    disabled={claiming}
                                    className="btn-primary rounded-xl px-8 py-4 text-base font-bold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {claiming ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-[#0f1018]/30 border-t-[#0f1018] rounded-full animate-spin" />
                                            Activating...
                                        </span>
                                    ) : (
                                        `Start Your ${durationDays}-Day Free Trial`
                                    )}
                                </button>
                            ) : (
                                <SignInButton mode="modal" forceRedirectUrl={`/trial/${token}`}>
                                    <button className="btn-primary rounded-xl px-8 py-4 text-base font-bold transition-all hover:scale-[1.02]">
                                        Sign Up & Start Your {durationDays}-Day Free Trial
                                    </button>
                                </SignInButton>
                            )}

                            <p className="text-[#8a8da8] text-xs mt-4">
                                No credit card required · Cancel anytime · Full Pro access
                            </p>

                            {errorMessage && (
                                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 text-sm">
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error states */}
                {(tokenStatus === 'expired' || tokenStatus === 'redeemed' || tokenStatus === 'invalid' || tokenStatus === 'error') && !claimed && (
                    <div className="flex flex-col items-center text-center animate-fade-in-up">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">
                            {tokenStatus === 'expired' && 'Link Expired'}
                            {tokenStatus === 'redeemed' && 'Already Used'}
                            {tokenStatus === 'invalid' && 'Invalid Link'}
                            {tokenStatus === 'error' && 'Something Went Wrong'}
                        </h1>
                        <p className="text-[#ccceda] mb-8 max-w-md">
                            {tokenStatus === 'expired' && 'This trial invite link has expired. Please request a new one.'}
                            {tokenStatus === 'redeemed' && 'This trial link has already been used. Each link is single-use.'}
                            {tokenStatus === 'invalid' && 'This trial link is not valid. Please check the URL and try again.'}
                            {tokenStatus === 'error' && 'We couldn\'t validate this link. Please try again later.'}
                        </p>
                        <a
                            href="/"
                            className="btn-ghost rounded-lg px-6 py-3 text-sm font-semibold inline-block"
                        >
                            Go to Homepage
                        </a>
                    </div>
                )}
            </main>
        </div>
    );
}
