"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TOUR_STEPS, type TourStep } from './tourSteps';

interface Rect { top: number; left: number; width: number; height: number; }

interface Props {
  onFinish: (status: 'completed' | 'skipped') => void;
}

const PAD = 2;
const CARD_W = 300;

function getRect(selector: string): Rect | null {
  const el = document.querySelector(`[data-tour="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

function ConfettiBurst() {
  useEffect(() => {
    let active = true;
    import('canvas-confetti').then(mod => {
      if (!active) return;
      const confetti = mod.default;
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#b497d6', '#e1e2ef', '#6a5acd', '#ffffff', '#9b8ec4'],
        startVelocity: 40,
        gravity: 0.9,
        ticks: 200,
      });
    });
    return () => { active = false; };
  }, []);
  return null;
}

function SpotlightRing({ rect }: { rect: Rect }) {
  return (
    <motion.div
      initial={false}
      animate={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      style={{
        position: 'fixed',
        borderRadius: 8,
        boxShadow: '0 0 0 3px #b497d6, 0 0 0 6px rgba(180,151,214,0.25)',
        pointerEvents: 'none',
        zIndex: 10001,
      }}
    />
  );
}

function SideCard({
  step, index, total, onNext, onBack, onSkip, isLast, showConfetti,
}: {
  step: TourStep; index: number; total: number;
  onNext: () => void; onBack: () => void; onSkip: () => void;
  isLast: boolean; showConfetti: boolean;
}) {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  return (
    <motion.div
      style={{
        position: 'fixed',
        right: 24,
        top: Math.max(80, vh / 2 - 120),
        width: CARD_W,
        zIndex: 10002,
      }}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-2xl border border-white/10 bg-[#0f1018] shadow-2xl p-5 flex flex-col gap-3"
    >
      {showConfetti && <ConfettiBurst />}

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Step {index + 1} of {total}
        </span>
        <button
          onClick={onSkip}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Skip tour
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">{step.body}</p>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex items-center gap-1 py-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: i === index ? 14 : 6,
              height: 6,
              background: i === index ? '#b497d6' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        {index > 0 ? (
          <button
            onClick={onBack}
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
        ) : <span />}
        <button
          onClick={onNext}
          className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{ background: 'linear-gradient(90deg,#b497d6,#e1e2ef)', color: '#0f1018' }}
        >
          {isLast ? 'Finish' : 'Next →'}
        </button>
      </div>
    </motion.div>
  );
}

export default function OnboardingTour({ onFinish }: Props) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const mountedRef = useRef(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const step = TOUR_STEPS[stepIndex];
  const total = TOUR_STEPS.length;
  const isLast = stepIndex === total - 1;

  const measure = useCallback(() => {
    if (!step.selector) { setRect(null); return; }
    const r = getRect(step.selector);
    setRect(r);
  }, [step.selector]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setRect(null);
    const t = setTimeout(() => {
      if (!mountedRef.current) return;
      measure();
      // If this step has a click action, fire it after a short delay so
      // the user sees the ring first
      if (step.action === 'click' && step.selector) {
        setTimeout(() => {
          const el = document.querySelector<HTMLElement>(`[data-tour="${step.selector}"]`);
          if (el) el.click();
        }, 600);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [stepIndex, measure, step.action, step.selector]);

  useEffect(() => {
    const handler = () => measure();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [measure]);

  const goToStep = useCallback(async (index: number) => {
    const target = TOUR_STEPS[index];
    const current = TOUR_STEPS[stepIndex];
    if (target.route && target.route !== current.route) {
      router.push(target.route);
      await new Promise(r => setTimeout(r, 700));
    }
    if (mountedRef.current) setStepIndex(index);
  }, [stepIndex, router]);

  const handleNext = useCallback(async () => {
    if (isLast) {
      setShowConfetti(true);
      // brief pause so confetti fires before unmounting
      setTimeout(() => onFinish('completed'), 1200);
      return;
    }
    await goToStep(stepIndex + 1);
  }, [isLast, stepIndex, goToStep, onFinish]);

  const handleBack = useCallback(async () => {
    if (stepIndex === 0) return;
    await goToStep(stepIndex - 1);
  }, [stepIndex, goToStep]);

  const handleSkip = useCallback(() => {
    onFinish('skipped');
  }, [onFinish]);

  return (
    <>
      {/* Light non-blocking tint */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.18)',
          pointerEvents: 'none',
          zIndex: 10000,
        }}
      />

      {/* Animated spotlight ring */}
      {rect && <SpotlightRing rect={rect} />}

      {/* Fixed sidebar card */}
      <AnimatePresence>
        <SideCard
          key="tour-card"
          step={step}
          index={stepIndex}
          total={total}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
          isLast={isLast}
          showConfetti={showConfetti}
        />
      </AnimatePresence>
    </>
  );
}
