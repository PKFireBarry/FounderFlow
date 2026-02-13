"use client";

import { useEffect, useState } from "react";

export type ViewMode = "grid" | "list";

const STORAGE_KEY = "opportunities-view-mode";

export default function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  // Hydrate from localStorage on mount
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (stored === "grid" || stored === "list") {
      onChange(stored);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (v: ViewMode) => {
    onChange(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  if (!hydrated) return null;

  return (
    <div
      className="inline-flex rounded-lg p-0.5"
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(255,255,255,.03)",
      }}
    >
      <button
        onClick={() => toggle("grid")}
        className="rounded-md px-2.5 py-1.5 text-xs font-medium transition-all"
        style={{
          background: value === "grid" ? "rgba(180,151,214,.15)" : "transparent",
          color: value === "grid" ? "var(--wisteria)" : "#9ca3af",
          border: value === "grid" ? "1px solid rgba(180,151,214,.25)" : "1px solid transparent",
        }}
        aria-label="Grid view"
        title="Grid view"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      </button>
      <button
        onClick={() => toggle("list")}
        className="rounded-md px-2.5 py-1.5 text-xs font-medium transition-all"
        style={{
          background: value === "list" ? "rgba(180,151,214,.15)" : "transparent",
          color: value === "list" ? "var(--wisteria)" : "#9ca3af",
          border: value === "list" ? "1px solid rgba(180,151,214,.25)" : "1px solid transparent",
        }}
        aria-label="List view"
        title="List view"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="14" height="2.5" rx="0.5" />
          <rect x="1" y="6.75" width="14" height="2.5" rx="0.5" />
          <rect x="1" y="11.5" width="14" height="2.5" rx="0.5" />
        </svg>
      </button>
    </div>
  );
}
