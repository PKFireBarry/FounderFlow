"use client";

import { useState, useEffect } from 'react';

interface GenerationLoadingOverlayProps {
  isLoading: boolean;
}

// Fun loading messages that rotate during generation
const loadingSayings = [
  "Brewing up something special...",
  "Teaching the AI some manners...",
  "Consulting the oracle...",
  "Channeling creative energy...",
  "Crafting the perfect words...",
  "Reading between the lines...",
  "Searching for that perfect opener...",
  "Making it sound human...",
  "Adding a dash of personality...",
  "Polishing the prose...",
  "Scanning LinkedIn for clues...",
  "Checking the company vibe...",
  "Finding common ground...",
  "Avoiding corporate buzzwords...",
  "Making sure it doesn't sound like AI...",
  "Sprinkling in some authenticity...",
  "Removing the cringe...",
  "Double-checking the tone...",
  "Almost there...",
  "This is taking a bit, but trust the process...",
];

const MAX_GENERATION_TIME = 105; // 1 minute 45 seconds

export default function GenerationLoadingOverlay({ isLoading }: GenerationLoadingOverlayProps) {
  const [currentSayingIndex, setCurrentSayingIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Rotate loading sayings every 4 seconds during loading
  useEffect(() => {
    if (!isLoading) {
      setCurrentSayingIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentSayingIndex((prev) => (prev + 1) % loadingSayings.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Track elapsed time during loading
  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => Math.min(prev + 1, MAX_GENERATION_TIME));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="modal-backdrop flex items-center justify-center p-4">
      <div className="modal-content card-elevated p-premium-lg max-w-lg w-full mx-4 text-center">
        {/* Premium multi-ring spinner */}
        <div className="spinner-premium mx-auto mb-6">
          <div className="inner"></div>
        </div>

        {/* Current saying */}
        <p className="text-lg text-purple-200 font-medium mb-4 min-h-[28px]">
          {loadingSayings[currentSayingIndex]}
        </p>

        {/* Progress bar */}
        <div className="w-full mb-3">
          <div className="h-2 bg-[#0f1015] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(elapsedTime / MAX_GENERATION_TIME) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Time display */}
        <div className="flex justify-between text-xs text-neutral-400">
          <span>{elapsedTime}s elapsed</span>
          <span>~{Math.max(0, MAX_GENERATION_TIME - elapsedTime)}s remaining</span>
        </div>

        <p className="text-sm text-neutral-500 mt-4">
          Generating your personalized message...
        </p>
      </div>
    </div>
  );
}
