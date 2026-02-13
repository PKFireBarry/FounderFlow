"use client";

import type { FounderData } from "../../../lib/entry-helpers";
import { isNA, getAvatarInfo, relativeDate, toSavePayload } from "../../../lib/entry-helpers";
import { isValidActionableUrl } from "../../../lib/url-validation";
import QuickActions from "./QuickActions";

interface EntryRowProps {
  founder: FounderData;
  isSaved: boolean;
  onSave: (payload: any) => void;
  onClick: () => void;
  onOutreach: () => void;
  even: boolean;
}

export default function EntryRow({ founder, isSaved, onSave, onClick, onOutreach, even }: EntryRowProps) {
  const { company, name, role, lookingForTags, linkedinUrl, emailHref, companyUrl } = founder;
  const avatarInfo = getAvatarInfo(name, company, companyUrl, founder.rolesUrl);
  const tags = lookingForTags.filter((t) => !isNA(t)).slice(0, 2);

  const hasLinkedIn = linkedinUrl && !isNA(linkedinUrl) && isValidActionableUrl(linkedinUrl);
  const hasEmail = emailHref && !isNA(emailHref);
  const hasCompanyUrl = companyUrl && !isNA(companyUrl);

  return (
    <div
      className="entry-row flex items-center gap-3 px-4 h-16 cursor-pointer transition-all group"
      style={{
        background: even ? "rgba(255,255,255,0.015)" : "transparent",
        borderLeft: "2px solid transparent",
      }}
      onClick={onClick}
    >
      {/* Avatar */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, rgba(180,151,214,0.1), rgba(5,32,74,0.15))",
          border: "1px solid rgba(180,151,214,0.15)",
        }}
      >
        {avatarInfo.faviconUrl ? (
          <img
            src={avatarInfo.faviconUrl}
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
        <span className={`font-semibold text-[10px] text-[var(--lavender-web)] ${avatarInfo.faviconUrl ? "hidden" : "block"}`}>
          {avatarInfo.initials}
        </span>
      </div>

      {/* Company */}
      <div className="w-[160px] min-w-0 flex-shrink-0">
        <div className="text-sm font-medium text-white truncate group-hover:text-[var(--lavender-web)] transition-colors">
          {company ?? "Stealth Company"}
        </div>
      </div>

      {/* Founder name */}
      <div className="w-[140px] min-w-0 flex-shrink-0 hidden sm:block">
        <div className="text-sm text-neutral-300 truncate">
          {name && name !== company ? name : name || "Unknown"}
        </div>
      </div>

      {/* Role pill */}
      <div className="w-[120px] min-w-0 flex-shrink-0 hidden md:block">
        {role ? (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
            style={{
              border: "1px solid rgba(180,151,214,.25)",
              background: "rgba(180,151,214,.08)",
              color: "var(--wisteria)",
            }}
            title={role}
          >
            {role.length > 16 ? role.substring(0, 16) + "..." : role.split(",")[0].trim()}
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
        {tags.slice(0, 2).map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap flex-shrink-0"
            style={{
              background: "rgba(225,226,239,0.08)",
              border: "1px solid rgba(225,226,239,0.12)",
              color: "var(--lavender-web)",
            }}
          >
            {tag.length > 20 ? tag.substring(0, 20) + "..." : tag}
          </span>
        ))}
      </div>

      {/* Contact dots */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {hasLinkedIn && <div className="w-1.5 h-1.5 rounded-full bg-[#0077b5]" title="LinkedIn" />}
        {hasEmail && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Email" />}
        {hasCompanyUrl && <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" title="Website" />}
      </div>

      {/* Quick actions (visible on hover) */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <QuickActions
          founder={founder}
          isSaved={isSaved}
          onSave={onSave}
          onOutreach={onOutreach}
          variant="row"
        />
      </div>

      {/* Save icon (always visible) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSave(toSavePayload(founder));
        }}
        className="flex-shrink-0 p-1 transition-colors group-hover:opacity-0"
        style={{ color: isSaved ? "var(--wisteria)" : "#6b7280" }}
        title={isSaved ? "Unsave" : "Save"}
      >
        <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>

      {/* Date */}
      <div className="w-[40px] text-right flex-shrink-0">
        <span className="text-[11px] text-neutral-500">{relativeDate((founder as any).published)}</span>
      </div>
    </div>
  );
}
