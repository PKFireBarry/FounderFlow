"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TOUR_STEPS, type TourStep } from './tourSteps';

interface Rect { top: number; left: number; width: number; height: number; }

interface Props {
  onFinish: (status: 'completed' | 'skipped') => void;
}

const PAD = 8; // spotlight padding

function getRect(selector: string): Rect | null {
  const el = document.querySelector(`[data-tour="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

function TooltipCard({
  step, index, total, rect, onNext, onBack, onSkip, isLast,
}: {
  step: TourStep; index: number; total: number; rect: Rect | null;
  onNext: () => void; onBack: () => void; onSkip: () => void; isLast: boolean;
}) {
  const CARD_W = 300;
  const CARD_H_ESTIMATE = 160;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  let top = vh / 2 - CARD_H_ESTIMATE / 2;
  let left = vw / 2 - CARD_W / 2;

  if (rect) {
    const placement = step.placement;
    if (placement === 'bottom') {
      top = rect.top + rect.height + 12;
      left = rect.left + rect.width / 2 - CARD_W / 2;
    } else if (placement === 'top') {
      top = rect.top - CARD_H_ESTIMATE - 12;
      left = rect.left + rect.width / 2 - CARD_W / 2;
    } else if (placement === 'left') {
      top = rect.top + rect.height / 2 - CARD_H_ESTIMATE / 2;
      left = rect.left - CARD_W - 12;
    } else if (placement === 'right') {
      top = rect.top + rect.height / 2 - CARD_H_ESTIMATE / 2;
      left = rect.left + rect.width + 12;
    }
    // clamp within viewport
    left = Math.max(12, Math.min(left, vw - CARD_W - 12));
    top = Math.max(12, Math.min(top, vh - CARD_H_ESTIMATE - 12));
  }

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        top,
        left,
        width: CARD_W,
        zIndex: 10001,
      }}
      className="rounded-2xl border border-white/10 bg-[#0f1018] shadow-2xl p-4 flex flex-col gap-3"
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

      <div>
        <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
        <p className="text-xs text-neutral-300 leading-relaxed">{step.body}</p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
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
          style={{ background: 'linear-gradient(90deg,var(--wisteria),var(--lavender-web))', color: '#0f1018' }}
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
  const [navigating, setNavigating] = useState(false);
  const mountedRef = useRef(true);

  const step = TOUR_STEPS[stepIndex];
  const total = TOUR_STEPS.length;
  const isLast = stepIndex === total - 1;

  // Measure target element
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
    setNavigating(false);
    // Give the page time to render after navigation before measuring
    const t = setTimeout(() => {
      if (!mountedRef.current) return;
      measure();
    }, 300);
    return () => clearTimeout(t);
  }, [stepIndex, measure]);

  // Remeasure on resize/scroll
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
      setNavigating(true);
      router.push(target.route);
      // Wait for navigation + render
      await new Promise(r => setTimeout(r, 600));
    }
    if (mountedRef.current) setStepIndex(index);
  }, [stepIndex, router]);

  const handleNext = useCallback(async () => {
    if (isLast) { onFinish('completed'); return; }
    await goToStep(stepIndex + 1);
  }, [isLast, stepIndex, goToStep, onFinish]);

  const handleBack = useCallback(async () => {
    if (stepIndex === 0) return;
    await goToStep(stepIndex - 1);
  }, [stepIndex, goToStep]);

  const handleSkip = useCallback(() => {
    onFinish('skipped');
  }, [onFinish]);

  // Spotlight clip-path: 4 rects around the hole
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
        {/* Dimmed overlay pieces */}
        {rect ? (
          <>
            {/* Top */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: rect.top, background: 'rgba(0,0,0,0.65)', pointerEvents: 'auto' }} onClick={handleSkip} />
            {/* Bottom */}
            <div style={{ position: 'fixed', top: rect.top + rect.height, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', pointerEvents: 'auto' }} onClick={handleSkip} />
            {/* Left */}
            <div style={{ position: 'fixed', top: rect.top, left: 0, width: rect.left, height: rect.height, background: 'rgba(0,0,0,0.65)', pointerEvents: 'auto' }} onClick={handleSkip} />
            {/* Right */}
            <div style={{ position: 'fixed', top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height, background: 'rgba(0,0,0,0.65)', pointerEvents: 'auto' }} onClick={handleSkip} />
            {/* Spotlight border */}
            <div style={{
              position: 'fixed',
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              borderRadius: 10,
              boxShadow: '0 0 0 2px var(--wisteria)',
              pointerEvents: 'none',
            }} />
          </>
        ) : (
          /* Full dim for centered steps */
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', pointerEvents: 'auto' }} onClick={step.selector ? undefined : handleSkip} />
        )}

        {/* Tooltip card */}
        <div style={{ pointerEvents: 'auto' }}>
          <AnimatePresence mode="wait">
            <TooltipCard
              key={step.id}
              step={step}
              index={stepIndex}
              total={total}
              rect={rect}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              isLast={isLast}
            />
          </AnimatePresence>
        </div>
      </div>
    </AnimatePresence>
  );
}
