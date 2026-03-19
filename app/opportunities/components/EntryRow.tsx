"use client";

import { isValidActionableUrl } from "../../../lib/url-validation";

interface EntryRowProps {
  id: string;
  company: string | null;
  companyDomain: string | null;
  name: string | null;
  role: string | null;
  lookingForTags: string[];
  linkedinUrl: string | null;
  emailHref: string | null;
  companyUrl: string | null;
  published: string | null;
  isSaved: boolean;
  isSignedIn: boolean;
  onSave: (payload: any) => void;
  onCardClick: () => void;
  even: boolean;
}

function isNA(v: unknown): boolean {
  if (v == null) return true;
  const s = String(v).trim().toLowerCase();
  return s === "" || s === "n/a" || s === "na" || s === "none" || s === "null" || s === "undefined";
}

export default function EntryRow({
  id,
  company,
  companyDomain,
  name,
  role,
  lookingForTags,
  linkedinUrl,
  emailHref,
  companyUrl,
  published,
  isSaved,
  isSignedIn,
  onSave,
  onCardClick,
  even,
}: EntryRowProps) {
  const tags = lookingForTags.filter((t) => !isNA(t));

  const hasLinkedIn = linkedinUrl && !isNA(linkedinUrl) && isValidActionableUrl(linkedinUrl);
  const hasEmail = emailHref && !isNA(emailHref);
  const hasCompanyUrl = companyUrl && !isNA(companyUrl);

  const faviconUrl = companyDomain
    ? `https://icons.duckduckgo.com/ip3/${companyDomain}.ico`
    : null;

  const initials = (company || name || "?").slice(0, 2).toUpperCase();

  return (
    <div
      className="entry-row flex items-center gap-3 px-4 h-16 cursor-pointer transition-all group"
      style={{
        background: even ? "rgba(255,255,255,0.015)" : "transparent",
        borderLeft: "2px solid transparent",
      }}
      onClick={onCardClick}
    >
      {/* Avatar */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, rgba(180,151,214,0.1), rgba(5,32,74,0.15))",
          border: "1px solid rgba(180,151,214,0.15)",
        }}
      >
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt=""
            className="w-5 h-5 rounded-sm"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
              const next = target.nextElementSibling as HTMLElement;
              if (next) next.style.display = "block";
            }}
          />
        ) : null}
        <span
          className={`font-semibold text-[10px] text-[var(--lavender-web)] ${faviconUrl ? "hidden" : "block"}`}
        >
          {initials}
        </span>
      </div>

      {/* Company */}
      <div className="w-[160px] min-w-0 flex-shrink-0">
        <div className="text-sm font-medium text-white truncate group-hover:text-[var(--lavender-web)] transition-colors" title={company ?? "Stealth Company"}>
          {company ?? "Stealth Company"}
        </div>
      </div>

      {/* Contact name */}
      <div className="w-[140px] min-w-0 flex-shrink-0 hidden sm:block">
        <div className="text-sm text-neutral-300 truncate" title={name && name !== company ? name : name || "Unknown"}>
          {name && name !== company ? name : name || "Unknown"}
        </div>
      </div>

      {/* Role pill */}
      <div className="w-[120px] min-w-0 flex-shrink-0 hidden md:block">
        {role ? (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide truncate max-w-[120px]"
            style={{
              border: "1px solid rgba(180,151,214,.25)",
              background: "rgba(180,151,214,.08)",
              color: "var(--wisteria)",
            }}
            title={role}
          >
            {role.split(",")[0].trim()}
          </span>
        ) : (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              border: "1px solid rgba(180,151,214,.25)",
              background: "rgba(180,151,214,.08)",
              color: "var(--wisteria)",
            }}
          >
            Founder
          </span>
        )}
      </div>

      {/* Tags — hidden on small screens */}
      <div className="flex-1 min-w-0 hidden lg:flex gap-1 overflow-hidden">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap flex-shrink-0"
            style={{
              background: "rgba(225,226,239,0.08)",
              border: "1px solid rgba(225,226,239,0.12)",
              color: "var(--lavender-web)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Contact icons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {hasLinkedIn && (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#0077b5">
            <title>LinkedIn</title>
            <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" />
          </svg>
        )}
        {hasEmail && (
          <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <title>Email</title>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        )}
        {hasCompanyUrl && (
          <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <title>Website</title>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        )}
      </div>

      {/* Save button */}
      {isSignedIn && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave({
              id,
              company,
              name,
              role,
              looking_for: lookingForTags.join(", "),
              company_url: companyUrl,
              linkedinurl: linkedinUrl,
              email: emailHref?.replace("mailto:", ""),
              published,
            });
          }}
          className="flex-shrink-0 p-1 transition-colors"
          style={{ color: isSaved ? "var(--wisteria)" : "#6b7280" }}
          title={isSaved ? "Unsave" : "Save"}
        >
          <svg
            className="w-4 h-4"
            fill={isSaved ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      )}

      {/* Date */}
      <div className="w-[100px] text-right flex-shrink-0">
        <span className="text-[11px] text-neutral-500" title={published ?? ""}>
          {published?.includes("•") ? published.split("•")[1].trim() : published ?? ""}
        </span>
      </div>
    </div>
  );
}
