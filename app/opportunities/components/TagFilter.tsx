"use client";

import { useState, useEffect } from "react";

interface TagFilterProps {
  tagIndex: [string, number][];
  selectedTags: Set<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
}

export default function TagFilter({ tagIndex, selectedTags, onToggle, onClear }: TagFilterProps) {
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  const VISIBLE_COUNT = isMobile ? 6 : 12;

  if (tagIndex.length === 0) return null;

  const visible = showAll ? tagIndex : tagIndex.slice(0, VISIBLE_COUNT);
  const hasMore = tagIndex.length > VISIBLE_COUNT;

  return (
    <div className="relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Looking for</span>
        {selectedTags.size > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] font-medium text-[var(--wisteria)] hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className={`flex gap-1.5 ${showAll ? "flex-wrap" : "flex-wrap sm:flex-nowrap sm:overflow-x-auto scrollbar-none"}`}>
        {visible.map(([tag, count]) => {
          const active = selectedTags.has(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: active ? "rgba(180,151,214,.2)" : "rgba(255,255,255,.04)",
                border: `1px solid ${active ? "rgba(180,151,214,.4)" : "rgba(255,255,255,.08)"}`,
                color: active ? "#fff" : "#9ca3af",
                boxShadow: active ? "0 0 8px rgba(180,151,214,.15)" : "none",
              }}
            >
              {tag}
              <span
                className="text-[9px] opacity-60"
              >
                {count}
              </span>
            </button>
          );
        })}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors flex-shrink-0"
            style={{
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
              color: "var(--wisteria)",
            }}
          >
            {showAll ? "Show less" : `Show all (${tagIndex.length})`}
          </button>
        )}
      </div>
      {/* Right-edge gradient fade for horizontal scroll (desktop only) */}
      {!showAll && hasMore && (
        <div
          className="pointer-events-none absolute right-0 top-6 bottom-0 w-12 hidden sm:block"
          style={{
            background: "linear-gradient(to right, transparent, rgba(12,13,20,.95))",
          }}
        />
      )}
    </div>
  );
}
