"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TOUR_STEPS, type TourStep } from './tourSteps';
import MockContactCard from './MockContactCard';
import IntegratedOutreachModal from '../IntegratedOutreachModal';
import { DEMO_CONTACT, DEMO_EMAIL_BODY } from './demoData';

interface Rect { top: number; left: number; width: number; height: number; }
interface Props { onFinish: (status: 'completed' | 'skipped') => void; }

const PAD = 0;
const CARD_W_DESKTOP = 380;
const CARD_W_TABLET = 320;
const CARD_EST_H = 240; // estimated card height for collision avoidance
const GAP = 14;
const MARGIN = 12;
const MOBILE_BP = 640;

const CONFETTI_COLORS = ['#b497d6', '#e1e2ef', '#6a5acd', '#ffffff', '#9b8ec4', '#d4b8f0'];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function getRect(selector: string): Rect | null {
  const el = document.querySelector(`[data-tour="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

interface CardPos { top: number; left: number; }

function computeCardPos(
  rect: Rect | null,
  placement: TourStep['placement'],
  vw: number,
  vh: number,
  cardW: number,
): CardPos {
  if (!rect || placement === 'center') {
    return { top: vh / 2 - CARD_EST_H / 2, left: vw / 2 - cardW / 2 };
  }

  let top: number;
  let left: number;

  switch (placement) {
    case 'bottom':
      top = rect.top + rect.height + GAP;
      left = rect.left + rect.width / 2 - cardW / 2;
      break;
    case 'top':
      top = rect.top - CARD_EST_H - GAP;
      left = rect.left + rect.width / 2 - cardW / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - CARD_EST_H / 2;
      left = rect.left - cardW - GAP;
      break;
    case 'right':
    default:
      top = rect.top + rect.height / 2 - CARD_EST_H / 2;
      left = rect.left + rect.width + GAP;
      break;
  }

  // Clamp to viewport
  top = Math.max(MARGIN, Math.min(vh - CARD_EST_H - MARGIN, top));
  left = Math.max(MARGIN, Math.min(vw - cardW - MARGIN, left));

  // If card would overlap the spotlight rect on chosen side, flip to opposite
  if (placement === 'right' && left < rect.left + rect.width + GAP - 10) {
    left = Math.max(MARGIN, rect.left - cardW - GAP);
  }
  if (placement === 'left' && left + cardW > rect.left - GAP + 10) {
    left = Math.min(vw - cardW - MARGIN, rect.left + rect.width + GAP);
  }
  if (placement === 'bottom' && top < rect.top + rect.height + GAP - 10) {
    top = Math.max(MARGIN, rect.top - CARD_EST_H - GAP);
  }
  if (placement === 'top' && top + CARD_EST_H > rect.top - GAP + 10) {
    top = Math.min(vh - CARD_EST_H - MARGIN, rect.top + rect.height + GAP);
  }

  return { top, left };
}

function ConfettiBurst() {
  const particles = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 800,
      y: -(Math.random() * 600 + 100),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 9 + 4,
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.2,
    }))
  );
  return (
    <div style={{ position: 'fixed', top: '45%', left: '50%', zIndex: 10010, pointerEvents: 'none' }}>
      {particles.current.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.3 }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: p.delay }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1 : 0.4),
            backgroundColor: p.color,
            borderRadius: p.size > 9 ? '50%' : 2,
          }}
        />
      ))}
    </div>
  );
}

function SpotlightRing({ rect }: { rect: Rect }) {
  return (
    <motion.div
      initial={false}
      animate={{ top: rect.top - 3, left: rect.left - 3, width: rect.width + 6, height: rect.height + 6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        borderRadius: 10,
        boxShadow: '0 0 0 2px #b497d6',
        pointerEvents: 'none',
        zIndex: 10001,
      }}
    />
  );
}

function TourCard({
  step, index, total, cardPos, isMobile, onNext, onBack, onSkip, isLast, showConfetti,
}: {
  step: TourStep;
  index: number;
  total: number;
  cardPos: CardPos;
  isMobile: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isLast: boolean;
  showConfetti: boolean;
}) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const cardW = vw >= 1024 ? CARD_W_DESKTOP : CARD_W_TABLET;

  const mobileStyle = {
    position: 'fixed' as const,
    bottom: 16,
    left: 16,
    right: 16,
    width: 'auto',
    zIndex: 10002,
  };

  const desktopStyle = {
    position: 'fixed' as const,
    top: cardPos.top,
    left: cardPos.left,
    width: cardW,
    zIndex: 10002,
  };

  return (
    <>
      {showConfetti && <ConfettiBurst />}
      <motion.div
        key="tour-card"
        initial={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.95 }}
        animate={
          isMobile
            ? { opacity: 1, y: 0 }
            : { opacity: 1, scale: 1, top: cardPos.top, left: cardPos.left }
        }
        exit={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="rounded-2xl flex flex-col gap-4"
        style={{
          ...(isMobile ? mobileStyle : desktopStyle),
          background: '#0f1018',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)',
          padding: '20px 22px',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5"
            style={{ background: 'rgba(180,151,214,.15)', color: '#b497d6' }}
          >
            Step {index + 1} / {total}
          </span>
          <button
            onClick={onSkip}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Skip tour
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2"
          >
            <h3 className="text-base font-semibold text-white leading-snug">{step.title}</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">{step.body}</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center gap-1 flex-wrap">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === index ? 16 : 5,
                height: 5,
                background: i === index ? '#b497d6' : 'rgba(255,255,255,0.12)',
              }}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between gap-2">
          {index > 0 ? (
            <button
              onClick={onBack}
              className="text-sm text-neutral-400 hover:text-white transition-colors px-1"
            >
              ← Back
            </button>
          ) : <span />}
          <button
            onClick={onNext}
            className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(90deg,#b497d6,#e1e2ef)', color: '#0f1018' }}
          >
            {isLast ? 'Finish' : 'Next →'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

export default function OnboardingTour({ onFinish }: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<CardPos>({ top: 0, left: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const mountedRef = useRef(true);

  const step = TOUR_STEPS[stepIndex];
  const total = TOUR_STEPS.length;
  const isLast = stepIndex === total - 1;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const measure = useCallback(() => {
    if (!step.selector) {
      setRect(null);
      return;
    }

    const el = document.querySelector(`[data-tour="${step.selector}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => {
        if (!mountedRef.current) return;
        const r = getRect(step.selector!);
        setRect(r);
        if (r) {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const cardW = vw >= 1024 ? CARD_W_DESKTOP : CARD_W_TABLET;
          setCardPos(computeCardPos(r, step.placement, vw, vh, cardW));
        }
      }, 200);
    } else {
      setRect(null);
    }
  }, [step.selector, step.placement]);

  // Re-measure when placement changes for center steps
  useEffect(() => {
    if (!step.selector) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cardW = vw >= 1024 ? CARD_W_DESKTOP : CARD_W_TABLET;
      setCardPos(computeCardPos(null, 'center', vw, vh, cardW));
    }
  }, [step.selector, step.placement]);

  useEffect(() => {
    setRect(null);
    const t = setTimeout(() => {
      if (!mountedRef.current) return;
      measure();
    }, 350);
    return () => clearTimeout(t);
  }, [stepIndex, measure]);

  useEffect(() => {
    const handler = () => {
      measure();
      if (rect) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cardW = vw >= 1024 ? CARD_W_DESKTOP : CARD_W_TABLET;
        setCardPos(computeCardPos(rect, step.placement, vw, vh, cardW));
      }
    };
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [measure, rect, step.placement]);

  // Open/close demo modal when steps require it
  useEffect(() => {
    setShowDemoModal(!!step.showDemoModal);
  }, [step.showDemoModal]);

  const goToStep = useCallback(async (index: number) => {
    const target = TOUR_STEPS[index];
    const current = TOUR_STEPS[stepIndex];

    // Navigate if route changes
    if (target.route && target.route !== current.route) {
      router.push(target.route);
      await new Promise(r => setTimeout(r, 800));
    }

    // Special: switch to context tab when heading to resume-upload step
    if (target.id === 'resume-upload') {
      window.dispatchEvent(new CustomEvent('onboarding:switch-tab', { detail: { tab: 'context' } }));
      await new Promise(r => setTimeout(r, 400));
    }

    if (mountedRef.current) setStepIndex(index);
  }, [stepIndex, router]);

  const handleNext = useCallback(async () => {
    if (isLast) {
      setShowConfetti(true);
      setTimeout(() => onFinish('completed'), 1600);
      return;
    }
    await goToStep(stepIndex + 1);
  }, [isLast, stepIndex, goToStep, onFinish]);

  const handleBack = useCallback(async () => {
    if (stepIndex === 0) return;
    await goToStep(stepIndex - 1);
  }, [stepIndex, goToStep]);

  // When mock card Generate button is clicked, advance to modal step
  const handleMockGenerate = useCallback(() => {
    goToStep(stepIndex + 1);
  }, [stepIndex, goToStep]);

  return (
    <>
      {/* Light tint — allows users to see the page */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.22)',
          pointerEvents: 'none',
          zIndex: 10000,
        }}
      />

      {/* Spring-animated spotlight ring */}
      {rect && <SpotlightRing rect={rect} />}

      {/* Mock contact card overlay (steps with showMockCard) */}
      {step.showMockCard && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10003,
            pointerEvents: 'auto',
          }}
        >
          <MockContactCard onGenerateClick={handleMockGenerate} />
        </div>
      )}

      {/* Demo outreach modal (steps with showDemoModal) */}
      {showDemoModal && (
        <div style={{ zIndex: 10003, position: 'relative' }}>
          <IntegratedOutreachModal
            jobData={DEMO_CONTACT}
            userProfile={null}
            onClose={() => goToStep(stepIndex + 1)}
            demoMessage={DEMO_EMAIL_BODY}
          />
        </div>
      )}

      {/* Tour card — dynamic placement on desktop, bottom sheet on mobile */}
      <AnimatePresence>
        {!showDemoModal && (
          <TourCard
            key="tour-card"
            step={step}
            index={stepIndex}
            total={total}
            cardPos={cardPos}
            isMobile={isMobile}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={() => onFinish('skipped')}
            isLast={isLast}
            showConfetti={showConfetti}
          />
        )}
        {showDemoModal && (
          /* On modal steps, show a compact floating nav bar instead */
          <motion.div
            key="tour-modal-nav"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: isMobile ? 16 : 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10005,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#0f1018',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '12px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: '#b497d6', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Step {stepIndex + 1}/{total}
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                style={{ color: '#e0e0e0', fontSize: 13 }}
              >
                {step.title}
              </motion.div>
            </AnimatePresence>
            <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
              {stepIndex > 0 && (
                <button
                  onClick={handleBack}
                  style={{ fontSize: 12, color: '#888', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                style={{
                  background: 'linear-gradient(90deg,#b497d6,#e1e2ef)',
                  color: '#0f1018',
                  border: 'none',
                  borderRadius: 10,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isLast ? 'Finish' : 'Next →'}
              </button>
              <button
                onClick={() => onFinish('skipped')}
                style={{ fontSize: 12, color: '#555', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
