"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TOUR_STEPS, type TourStep } from './tourSteps';

interface Rect { top: number; left: number; width: number; height: number; }
interface Props { onFinish: (status: 'completed' | 'skipped') => void; }

// Exact fit — no extra padding so the ring never bleeds into adjacent elements
const PAD = 0;
const CARD_W = 300;

const CONFETTI_COLORS = ['#b497d6', '#e1e2ef', '#6a5acd', '#ffffff', '#9b8ec4', '#d4b8f0'];

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

// Pure framer-motion confetti — no external package
function ConfettiBurst() {
  const particles = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 700,
      y: -(Math.random() * 500 + 100),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 8 + 4,
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.15,
    }))
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: '45%',
        left: '50%',
        zIndex: 10010,
        pointerEvents: 'none',
      }}
    >
      {particles.current.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.3 }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: p.delay }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1 : 0.4),
            backgroundColor: p.color,
            borderRadius: p.size > 8 ? '50%' : 2,
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
      animate={{
        top: rect.top - 2,
        left: rect.left - 2,
        width: rect.width + 4,
        height: rect.height + 4,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      style={{
        position: 'fixed',
        borderRadius: 8,
        // Single solid ring — no outer glow spread that bleeds into adjacent elements
        boxShadow: '0 0 0 2px #b497d6',
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
    <>
      {showConfetti && <ConfettiBurst />}
      <motion.div
        style={{
          position: 'fixed',
          right: 24,
          top: Math.max(80, vh / 2 - 140),
          width: CARD_W,
          zIndex: 10002,
        }}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="rounded-2xl border border-white/10 bg-[#0f1018] shadow-2xl p-5 flex flex-col gap-3"
      >
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
        <div className="flex items-center gap-1 flex-wrap py-0.5">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === index ? 14 : 5,
                height: 5,
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
            className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold"
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
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const mountedRef = useRef(true);

  const step = TOUR_STEPS[stepIndex];
  const total = TOUR_STEPS.length;
  const isLast = stepIndex === total - 1;

  const measure = useCallback(() => {
    if (!step.selector) { setRect(null); return; }
    setRect(getRect(step.selector));
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
      if (step.action === 'click' && step.selector) {
        setTimeout(() => {
          const el = document.querySelector<HTMLElement>(`[data-tour="${step.selector}"]`);
          el?.click();
        }, 700);
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
      await new Promise(r => setTimeout(r, 750));
    }
    if (mountedRef.current) setStepIndex(index);
  }, [stepIndex, router]);

  const handleNext = useCallback(async () => {
    if (isLast) {
      setShowConfetti(true);
      setTimeout(() => onFinish('completed'), 1500);
      return;
    }
    await goToStep(stepIndex + 1);
  }, [isLast, stepIndex, goToStep, onFinish]);

  const handleBack = useCallback(async () => {
    if (stepIndex === 0) return;
    await goToStep(stepIndex - 1);
  }, [stepIndex, goToStep]);

  return (
    <>
      {/* Light non-blocking tint — users can see the full page behind it */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
          pointerEvents: 'none',
          zIndex: 10000,
        }}
      />

      {/* Spring-animated spotlight ring — moves smoothly between elements */}
      {rect && <SpotlightRing rect={rect} />}

      {/* Fixed right-side card — never overlaps highlighted elements */}
      <AnimatePresence>
        <SideCard
          key="tour-card"
          step={step}
          index={stepIndex}
          total={total}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={() => onFinish('skipped')}
          isLast={isLast}
          showConfetti={showConfetti}
        />
      </AnimatePresence>
    </>
  );
}
