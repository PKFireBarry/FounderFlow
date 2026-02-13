"use client";

import type { FounderData } from "../../../lib/entry-helpers";
import { isNA, getAvatarInfo, getEmailInfo, getDomainFromUrl } from "../../../lib/entry-helpers";
import { isValidApplyUrl, isValidActionableUrl } from "../../../lib/url-validation";
import ContactInfoGate from "../../components/ContactInfoGate";
import QuickActions from "./QuickActions";

interface EntryCardOwnProps {
  founder: FounderData;
  isSaved: boolean;
  onSave: (payload: any) => void;
  onCardClick: () => void;
  onOutreach: () => void;
}

export default function EntryCard({ founder, isSaved, onSave, onCardClick, onOutreach }: EntryCardOwnProps) {
  const {
    company, companyInfo, published, name, role,
    lookingForTags, restCount, companyUrl, rolesUrl,
    apply_url, linkedinUrl, emailHref,
  } = founder;

  const avatarInfo = getAvatarInfo(name, company, companyUrl, rolesUrl);
  const emailInfo = getEmailInfo(emailHref);
  const tags = lookingForTags.filter((t) => !isNA(t)).slice(0, 2);

  const hasLinkedIn = linkedinUrl && !isNA(linkedinUrl) && isValidActionableUrl(linkedinUrl);
  const hasEmail = emailInfo !== null;
  const hasRolesUrl = rolesUrl && !isNA(rolesUrl) && isValidActionableUrl(rolesUrl);
  const hasCompanyUrl = companyUrl && !isNA(companyUrl) && !!getDomainFromUrl(companyUrl);
  const hasAnyContact = hasLinkedIn || hasEmail || hasRolesUrl || hasCompanyUrl;

  return (
    <article
      className="glass-card overflow-hidden cursor-pointer transition-all hover-lift group relative"
      style={{ borderColor: "rgba(180,151,214,0.12)" }}
      onClick={onCardClick}
    >
      <div className="p-5 min-h-[400px] flex flex-col">
        {/* Header with Avatar and Company Info */}
        <div className="flex items-start gap-3.5 h-[80px] overflow-hidden">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(180,151,214,0.1), rgba(5,32,74,0.15))",
              border: "1px solid rgba(180,151,214,0.2)",
            }}
          >
            {avatarInfo.faviconUrl ? (
              <img
                src={avatarInfo.faviconUrl}
                alt={`${avatarInfo.displayName} favicon`}
                className="w-7 h-7 rounded-sm"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                  const nextElement = target.nextElementSibling as HTMLElement;
                  if (nextElement) nextElement.style.display = "block";
                }}
              />
            ) : null}
            <span
              className={`font-semibold text-sm text-[var(--lavender-web)] ${avatarInfo.faviconUrl ? "hidden" : "block"}`}
            >
              {avatarInfo.initials}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base text-white mb-1 truncate group-hover:text-[var(--lavender-web)] transition-colors">
              {company ?? "Stealth Company"}
            </h3>
            <div className="text-xs text-neutral-400 mb-3 h-10 overflow-hidden leading-relaxed">
              <div className="line-clamp-2">
                {companyInfo && companyInfo.length > 0
                  ? companyInfo.length > 80
                    ? `${companyInfo.substring(0, 80)}...`
                    : companyInfo
                  : "Technology company"}
              </div>
            </div>
            <div className="text-[10px] text-neutral-500">
              {published !== "N/A" && typeof published === "string"
                ? `${published.split(" • ")[0]} • ${published.split(" • ")[1] || "recently"}`
                : "Recently"}
            </div>
          </div>
        </div>

        {/* Contact Name */}
        <div className="h-[40px] mt-3 overflow-hidden">
          <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Contact</span>
          <div className="text-sm font-medium text-white truncate mt-0.5">
            {name && name !== company ? name : name || "Unknown"}
          </div>
        </div>

        {/* Role */}
        <div className="h-[50px] mt-3 overflow-hidden">
          <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Role</span>
          <div className="mt-1.5 flex flex-nowrap gap-1 overflow-hidden">
            {role ? (
              role
                .split(",")
                .slice(0, 2)
                .map((singleRole, index) => {
                  const trimmedRole = singleRole.trim();
                  const truncatedRole = trimmedRole.length > 12 ? trimmedRole.substring(0, 12) + "..." : trimmedRole;
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 whitespace-nowrap"
                      style={{
                        border: "1px solid rgba(180,151,214,.25)",
                        background: "rgba(180,151,214,.08)",
                        color: "var(--wisteria)",
                      }}
                      title={trimmedRole}
                    >
                      {truncatedRole}
                    </span>
                  );
                })
            ) : (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 whitespace-nowrap"
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
        </div>

        {/* Contact Info */}
        <div className="h-[60px] mt-3 overflow-hidden">
          {hasAnyContact && (
            <>
              <div className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Contact Info</div>
              <div className="flex flex-nowrap gap-1.5 overflow-hidden">
                {hasLinkedIn && (
                  <ContactInfoGate
                    feature="LinkedIn Profiles"
                    description="Upgrade to access LinkedIn profiles and generate personalized outreach messages."
                    fallback={
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                        style={{ border: "1px solid rgba(180,151,214,.2)", background: "rgba(180,151,214,.06)", color: "var(--wisteria)" }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        LinkedIn
                      </button>
                    }
                  >
                    <a href={linkedinUrl!} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[#0077b5]/20" style={{ border: "1px solid rgba(0,119,181,.3)", background: "rgba(0,119,181,.08)", color: "#5bb5e8" }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" /></svg>
                      LinkedIn
                    </a>
                  </ContactInfoGate>
                )}
                {hasEmail && (
                  <ContactInfoGate
                    feature="Email Addresses"
                    description="Upgrade to access email addresses and generate personalized outreach messages."
                    fallback={
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                        style={{ border: "1px solid rgba(180,151,214,.2)", background: "rgba(180,151,214,.06)", color: "var(--wisteria)" }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Email
                      </button>
                    }
                  >
                    <a href={emailInfo!.href} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-emerald-500/20" style={{ border: "1px solid rgba(52,211,153,.3)", background: "rgba(52,211,153,.08)", color: "#6ee7b7" }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Z" /><path d="m4 6 8 6 8-6" opacity=".35" /></svg>
                      Email
                    </a>
                  </ContactInfoGate>
                )}
                {hasRolesUrl && (
                  <a href={rolesUrl!.startsWith("http") ? rolesUrl! : `https://${rolesUrl}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[var(--wisteria)]/20" style={{ border: "1px solid rgba(180,151,214,.25)", background: "rgba(180,151,214,.08)", color: "var(--wisteria)" }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M10 6h4a2 2 0 0 1 2 2v1h-8V8a2 2 0 0 1 2-2Zm-4 5h12a2 2 0 0 1 2 2v6H4v-6a2 2 0 0 1 2-2Z" /></svg>
                    Careers
                  </a>
                )}
                {hasCompanyUrl &&
                  (() => {
                    const domain = getDomainFromUrl(companyUrl!);
                    if (!domain) return null;
                    const href = companyUrl!.startsWith("http") ? companyUrl! : `https://${companyUrl}`;
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/10" style={{ border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)" }}>
                        <img src={`https://icons.duckduckgo.com/ip3/${domain}.ico`} alt="" className="h-3 w-3 rounded-sm" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/globe.svg"; }} />
                        Website
                      </a>
                    );
                  })()}
              </div>
            </>
          )}
        </div>

        {/* Looking For */}
        <div className="h-[50px] mt-3 overflow-hidden">
          {tags.length > 0 && (
            <>
              <div className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Looking for</div>
              <div className="flex flex-nowrap gap-1.5 overflow-hidden">
                {tags.slice(0, 3).map((tag, index) => {
                  const truncatedTag = tag.length > 30 ? tag.substring(0, 30) + "..." : tag;
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight flex-shrink-0 whitespace-nowrap"
                      style={{
                        background: "rgba(225,226,239,0.08)",
                        border: "1px solid rgba(225,226,239,0.12)",
                        color: "var(--lavender-web)",
                      }}
                      title={tag}
                    >
                      {truncatedTag}
                    </span>
                  );
                })}
                {restCount > 0 && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-neutral-500 flex-shrink-0 whitespace-nowrap"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    +{restCount} more
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer with date + contact dots */}
        <div className="border-t border-white/6 pt-3">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <div className="flex flex-col">
              <span className="text-[9px] font-semibold uppercase tracking-wider mb-0.5">Published</span>
              <span className="text-neutral-400">{published !== "N/A" ? published.split(" • ")[0] : "Unknown"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasLinkedIn && <div className="w-1.5 h-1.5 rounded-full bg-[#0077b5]" title="LinkedIn" />}
              {hasEmail && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Email" />}
              {hasCompanyUrl && <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" title="Website" />}
              {apply_url && isValidApplyUrl(apply_url) && <div className="w-1.5 h-1.5 rounded-full bg-[var(--wisteria)]" title="Apply" />}
            </div>
          </div>
        </div>
      </div>

      {/* Hover quick-action overlay — hidden on touch devices, shown on desktop hover */}
      <div className="quick-action-overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto hidden hover-device:flex">
        <QuickActions
          founder={founder}
          isSaved={isSaved}
          onSave={onSave}
          onOutreach={onOutreach}
          variant="card"
        />
      </div>
    </article>
  );
}

