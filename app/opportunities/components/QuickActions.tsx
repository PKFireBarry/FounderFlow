"use client";

import type { FounderData } from "../../../lib/entry-helpers";
import { toSavePayload } from "../../../lib/entry-helpers";
import { isValidApplyUrl } from "../../../lib/url-validation";

interface QuickActionsProps {
  founder: FounderData;
  isSaved: boolean;
  onSave: (payload: any) => void;
  onOutreach: () => void;
  /** "card" = overlay on grid card, "row" = inline in list row */
  variant: "card" | "row";
}

export default function QuickActions({ founder, isSaved, onSave, onOutreach, variant }: QuickActionsProps) {
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave(toSavePayload(founder));
  };

  const handleOutreach = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOutreach();
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (founder.emailHref) {
      const email = founder.emailHref.replace("mailto:", "");
      navigator.clipboard.writeText(email);
    }
  };

  if (variant === "row") {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleSave}
          className="rounded-lg p-1.5 text-xs transition-colors hover:bg-white/10"
          style={{ color: isSaved ? "var(--wisteria)" : "#9ca3af" }}
          title={isSaved ? "Unsave" : "Save"}
        >
          <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
        <button
          onClick={handleOutreach}
          className="rounded-lg p-1.5 text-xs transition-colors hover:bg-[var(--wisteria)]/10"
          style={{ color: "var(--wisteria)" }}
          title="Generate Outreach"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        {founder.emailHref && (
          <button
            onClick={handleCopyEmail}
            className="rounded-lg p-1.5 text-xs transition-colors hover:bg-emerald-500/10"
            style={{ color: "#6ee7b7" }}
            title="Copy email"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  const hasApply = founder.apply_url && isValidApplyUrl(founder.apply_url);
  const applyHref = hasApply
    ? founder.apply_url!.startsWith("http") ? founder.apply_url! : `https://${founder.apply_url}`
    : null;

  // Card overlay variant — Save, Outreach, Apply (when available)
  // Fixed-width buttons so layout is consistent across all cards
  const btnBase = "quick-action-btn rounded-xl py-2 text-xs font-semibold transition-all hover:scale-105 inline-flex items-center justify-center w-[88px]";

  return (
    <div
      className="quick-action-overlay absolute inset-x-0 bottom-0 flex items-end justify-center gap-2 p-4"
      style={{
        background: "linear-gradient(to top, rgba(12,13,20,.95) 0%, rgba(12,13,20,.7) 60%, transparent 100%)",
      }}
    >
      <button
        onClick={handleSave}
        className={btnBase}
        style={{
          background: isSaved ? "rgba(180,151,214,.15)" : "rgba(255,255,255,.1)",
          border: `1px solid ${isSaved ? "rgba(180,151,214,.3)" : "rgba(255,255,255,.15)"}`,
          color: isSaved ? "var(--wisteria)" : "#fff",
        }}
      >
        <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {isSaved ? "Saved" : "Save"}
      </button>
      <button
        onClick={handleOutreach}
        className={btnBase}
        style={{
          background: "linear-gradient(90deg, var(--wisteria), var(--lavender-web))",
          color: "#0f1018",
        }}
      >
        <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Outreach
      </button>
      {hasApply && applyHref && (
        <a
          href={applyHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={btnBase}
          style={{
            background: "rgba(52,211,153,.1)",
            border: "1px solid rgba(52,211,153,.25)",
            color: "#6ee7b7",
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 mr-1 flex-shrink-0">
            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
          </svg>
          Apply
        </a>
      )}
    </div>
  );
}
