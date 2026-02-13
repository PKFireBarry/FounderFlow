"use client";

import { useEffect, useCallback } from "react";
import type { FounderData } from "../../../lib/entry-helpers";
import { isNA, getAvatarInfo, getEmailInfo, getDomainFromUrl, toSavePayload } from "../../../lib/entry-helpers";
import { isValidActionableUrl, isValidApplyUrl } from "../../../lib/url-validation";
import ContactInfoGate from "../../components/ContactInfoGate";

interface FounderSidePanelProps {
  founder: FounderData;
  open: boolean;
  onClose: () => void;
  onSave: (payload: any) => void;
  isSaved: boolean;
  onOutreach: () => void;
}

export default function FounderSidePanel({ founder, open, onClose, onSave, isSaved, onOutreach }: FounderSidePanelProps) {
  // Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const { company, companyInfo, name, role, lookingForTags, restCount, companyUrl, rolesUrl, apply_url, linkedinUrl, emailHref, published } = founder;

  const avatarInfo = getAvatarInfo(name, company, companyUrl, rolesUrl);
  const emailInfo = getEmailInfo(emailHref);

  const companyDisplay = isNA(company) ? "Stealth Company" : company!;
  const hasName = !isNA(name) && name !== company;
  const roleDisplay = isNA(role) ? "Founder" : role!;
  const hasCompanyInfo = !isNA(companyInfo) && (companyInfo?.length ?? 0) > 5;
  const validTags = lookingForTags.filter((t) => !isNA(t));

  const hasLinkedIn = !isNA(linkedinUrl) && isValidActionableUrl(linkedinUrl!);
  const hasEmail = emailInfo !== null;
  const hasApplyUrl = !isNA(apply_url) && isValidApplyUrl(apply_url!);
  const hasRolesUrl = !isNA(rolesUrl) && isValidActionableUrl(rolesUrl!);
  const hasCompanyUrl = !isNA(companyUrl) && isValidActionableUrl(companyUrl!) && !!getDomainFromUrl(companyUrl);
  const hasAnyContact = hasLinkedIn || hasEmail || hasApplyUrl || hasRolesUrl || hasCompanyUrl;
  const hasPublished = !isNA(published);

  const handleSave = () => onSave(toSavePayload(founder));

  // Contact link renderer
  const renderContactLink = (href: string, icon: React.ReactNode, label: string, subtitle: string) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card p-4 hover-lift transition-all group block"
      style={{ borderLeft: "2px solid var(--wisteria)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{
            background: "linear-gradient(135deg, rgba(180,151,214,0.15), rgba(180,151,214,0.05))",
            border: "1px solid rgba(180,151,214,0.3)",
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white group-hover:text-[var(--lavender-web)] transition-colors">{label}</div>
          <div className="text-xs text-neutral-400 truncate">{subtitle}</div>
        </div>
        <svg className="h-4 w-4 text-neutral-500 group-hover:text-[var(--lavender-web)] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );

  // Icon components
  const linkedInIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[var(--lavender-web)]">
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" />
    </svg>
  );
  const emailIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[var(--lavender-web)]">
      <path d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Z" />
      <path d="m4 6 8 6 8-6" opacity=".35" />
    </svg>
  );
  const applyIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[var(--lavender-web)]">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  );
  const careersIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[var(--lavender-web)]">
      <path d="M10 6h4a2 2 0 0 1 2 2v1h-8V8a2 2 0 0 1 2-2Zm-4 5h12a2 2 0 0 1 2 2v6H4v-6a2 2 0 0 1 2-2Z" />
    </svg>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="side-panel-backdrop fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,.4)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className="side-panel-enter fixed top-0 right-0 z-50 h-full flex flex-col"
        style={{
          width: "clamp(400px, 42vw, 600px)",
          background: "rgba(14,15,24,0.92)",
          backdropFilter: "blur(24px) saturate(1.3)",
          borderLeft: "1px solid rgba(180,151,214,.15)",
          boxShadow: "0 0 60px rgba(0,0,0,.5), 0 0 20px rgba(180,151,214,.06)",
        }}
      >
        {/* Top luminance strip */}
        <div
          className="h-[2px] w-full flex-shrink-0"
          style={{ background: "linear-gradient(90deg, var(--wisteria), var(--lavender-web), var(--wisteria))" }}
        />

        {/* Sticky header */}
        <div className="flex items-center gap-4 p-5 border-b border-white/6 flex-shrink-0">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(180,151,214,0.1), rgba(5,32,74,0.15))",
              border: "1px solid rgba(180,151,214,0.2)",
            }}
          >
            {avatarInfo.faviconUrl ? (
              <img
                src={avatarInfo.faviconUrl}
                alt={`${avatarInfo.displayName} logo`}
                className="w-8 h-8 rounded-lg"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                  const next = target.nextElementSibling as HTMLElement;
                  if (next) next.style.display = "flex";
                }}
              />
            ) : null}
            <span className={`font-bold text-lg text-[var(--lavender-web)] ${avatarInfo.faviconUrl ? "hidden" : "flex"}`}>
              {avatarInfo.initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg text-white truncate" style={{ letterSpacing: "-0.02em" }}>
              {companyDisplay}
            </h2>
            {hasName && <div className="text-sm text-neutral-400 truncate">{name}</div>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ color: "rgba(255,255,255,.5)" }}
            aria-label="Close panel"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Role + date + description */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm font-medium" style={{ color: "var(--lavender-web)" }}>
                {roleDisplay}
              </span>
              {hasPublished && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="text-xs text-neutral-500">{published}</span>
                </>
              )}
            </div>
            {hasCompanyInfo && (
              <p className="text-sm text-neutral-400 leading-relaxed">{companyInfo}</p>
            )}
          </div>

          {/* Generate Outreach CTA */}
          <button
            onClick={onOutreach}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(90deg, var(--wisteria), var(--lavender-web))",
              color: "#0f1018",
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Generate Outreach
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
            style={{
              background: isSaved ? "rgba(180,151,214,.15)" : "rgba(255,255,255,.06)",
              border: `1px solid ${isSaved ? "rgba(180,151,214,.3)" : "rgba(255,255,255,.1)"}`,
              color: isSaved ? "var(--wisteria)" : "#fff",
            }}
          >
            <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {isSaved ? "Saved" : "Save Contact"}
          </button>

          {/* Contact Section */}
          {hasAnyContact && (
            <section>
              <h3 className="font-display text-base text-white mb-3" style={{ letterSpacing: "-0.01em" }}>Contact</h3>
              <div className="grid gap-2.5">
                {hasLinkedIn && (
                  <ContactInfoGate
                    feature="LinkedIn Profiles"
                    description="Upgrade to access LinkedIn profiles and generate personalized outreach messages."
                    fallback={
                      <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-yellow-400">LinkedIn Profile</div>
                          <div className="text-xs text-yellow-400/80">Upgrade to view</div>
                        </div>
                      </div>
                    }
                  >
                    {renderContactLink(linkedinUrl!, linkedInIcon, "LinkedIn Profile", "Connect professionally")}
                  </ContactInfoGate>
                )}
                {hasEmail && (
                  <ContactInfoGate
                    feature="Email Addresses"
                    description="Upgrade to access email addresses and generate personalized outreach messages."
                    fallback={
                      <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-yellow-400">Email Address</div>
                          <div className="text-xs text-yellow-400/80">Upgrade to view</div>
                        </div>
                      </div>
                    }
                  >
                    {renderContactLink(emailInfo!.href, emailIcon, "Email Address", emailInfo!.email)}
                  </ContactInfoGate>
                )}
                {hasApplyUrl && renderContactLink(
                  apply_url!.startsWith("http") ? apply_url! : `https://${apply_url}`,
                  applyIcon, "Apply Now", "Direct application"
                )}
                {hasRolesUrl && renderContactLink(
                  rolesUrl!.startsWith("http") ? rolesUrl! : `https://${rolesUrl}`,
                  careersIcon, "Careers Page", getDomainFromUrl(rolesUrl) || ""
                )}
                {hasCompanyUrl && (() => {
                  const domain = getDomainFromUrl(companyUrl)!;
                  const href = companyUrl!.startsWith("http") ? companyUrl! : `https://${companyUrl}`;
                  return renderContactLink(
                    href,
                    <img src={`https://icons.duckduckgo.com/ip3/${domain}.ico`} alt="" className="h-5 w-5 rounded-sm" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/globe.svg"; }} />,
                    "Company Website", domain
                  );
                })()}
              </div>
            </section>
          )}

          {/* Looking For tags — no truncation in panel */}
          {validTags.length > 0 && (
            <section>
              <h3 className="font-display text-base text-white mb-3" style={{ letterSpacing: "-0.01em" }}>Looking For</h3>
              <div className="glass-card p-4">
                <div className="flex flex-wrap gap-2">
                  {validTags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors hover:text-white"
                      style={{
                        background: "rgba(180,151,214,0.1)",
                        border: "1px solid rgba(180,151,214,0.2)",
                        color: "var(--lavender-web)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {(restCount || 0) > 0 && (
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-neutral-500"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      +{restCount} more
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Fallback */}
          {!hasAnyContact && validTags.length === 0 && !hasCompanyInfo && (
            <div className="glass-card p-6 text-center">
              <p className="text-neutral-500 text-sm">Limited information available for this founder.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
