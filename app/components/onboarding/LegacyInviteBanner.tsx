"use client";

import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onStart: () => void;
  onDismiss: () => void;
}

export default function LegacyInviteBanner({ onStart, onDismiss }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-lg px-4"
      >
        <div
          className="rounded-2xl border border-white/10 px-4 py-3 flex items-center gap-3 shadow-2xl"
          style={{ background: 'rgba(15,16,24,0.97)' }}
        >
          <span className="text-sm text-neutral-200 flex-1">
            New: take a quick tour to see everything Founder Flow can do.
          </span>
          <button
            onClick={onStart}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{ background: 'linear-gradient(90deg,var(--wisteria),var(--lavender-web))', color: '#0f1018' }}
          >
            Start tour
          </button>
          <button
            onClick={onDismiss}
            className="shrink-0 text-neutral-500 hover:text-white text-lg leading-none transition-colors"
            aria-label="No thanks"
          >
            ×
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
