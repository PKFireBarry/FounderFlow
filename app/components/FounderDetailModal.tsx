"use client";

import ContactInfoGate from './ContactInfoGate';
import { isValidActionableUrl } from '../../lib/url-validation';

interface FounderData {
  id: string;
  company?: string | null;
  companyInfo?: string | null;
  name?: string | null;
  role?: string | null;
  lookingForTags: string[];
  companyUrl?: string | null;
  rolesUrl?: string | null;
  apply_url?: string | null;
  linkedinUrl?: string | null;
  emailHref?: string | null;
  published: string;
  restCount?: number;
}

interface FounderDetailModalProps {
  founderData: FounderData;
  onClose: () => void;
  onSave: (jobData: any) => void;
  isSaved: boolean;
  isHomePage?: boolean;
}

// Robust N/A value detection — matches the pattern used in page.tsx
const isNAValue = (value: string | undefined | null): boolean => {
  if (!value || typeof value !== 'string') return true;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'na' || normalized === 'n/a' || normalized === 'unknown' || normalized === 'unknown company' || normalized === 'null' || normalized === 'undefined' || normalized === 'none';
};

export default function FounderDetailModal({ founderData, onClose, onSave, isSaved, isHomePage = false }: FounderDetailModalProps) {
  const getDomainFromUrl = (input?: string | null): string | null => {
    if (!input) return null;
    let str = input.trim();
    if (str.toLowerCase().startsWith('mailto:')) {
      const email = str.slice(7);
      const parts = email.split('@');
      return parts[1] ? parts[1].toLowerCase() : null;
    }
    if (str.includes('@') && !/^https?:\/\//i.test(str)) {
      const parts = str.split('@');
      return parts[1] ? parts[1].toLowerCase() : null;
    }
    try {
      if (!/^https?:\/\//i.test(str)) {
        str = `https://${str}`;
      }
      const u = new URL(str);
      return u.hostname.replace(/^www\./i, '').toLowerCase();
    } catch {
      const host = str.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0];
      return host ? host.toLowerCase() : null;
    }
  };

  const getEmailInfo = (input?: string | null): { email: string; href: string } | null => {
    if (!input || isNAValue(input)) return null;
    let raw = input.trim();
    if (raw.toLowerCase().startsWith('mailto:')) raw = raw.slice(7);
    if (!raw.includes('@')) return null;
    return { email: raw, href: `mailto:${raw}` };
  };

  const getAvatarInfo = (name?: string | null, company?: string | null, companyUrl?: string | null, url?: string | null) => {
    const websiteUrl = companyUrl || url;
    let faviconUrl = null;

    if (websiteUrl && !isNAValue(websiteUrl)) {
      const domain = getDomainFromUrl(websiteUrl);
      if (domain) {
        faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      }
    }

    let initials = 'UN';
    if (name && !isNAValue(name)) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        initials = parts[0].slice(0, 2).toUpperCase();
      }
    } else if (company && !isNAValue(company)) {
      const parts = company.split(' ');
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        initials = parts[0].slice(0, 2).toUpperCase();
      }
    }

    const displayName = (!name || isNAValue(name))
      ? (!company || isNAValue(company) ? 'Stealth Company' : company)
      : name;

    return { faviconUrl, initials, displayName };
  };

  const avatarInfo = getAvatarInfo(founderData.name, founderData.company, founderData.companyUrl, founderData.rolesUrl);
  const emailInfo = getEmailInfo(founderData.emailHref);

  // Compute display values with N/A filtering
  const companyDisplay = isNAValue(founderData.company) ? 'Stealth Company' : founderData.company!;
  const hasName = !isNAValue(founderData.name) && founderData.name !== founderData.company;
  const roleDisplay = isNAValue(founderData.role) ? 'Founder' : founderData.role!;
  const hasCompanyInfo = !isNAValue(founderData.companyInfo) && (founderData.companyInfo?.length ?? 0) > 5;

  // Filter looking_for tags to remove N/A values
  const validTags = founderData.lookingForTags.filter(tag => !isNAValue(tag));

  // Check which contact items are actually available
  const hasLinkedIn = !isNAValue(founderData.linkedinUrl) && isValidActionableUrl(founderData.linkedinUrl!, { context: 'linkedin_url' });
  const hasEmail = emailInfo !== null;
  const hasApplyUrl = !isNAValue(founderData.apply_url) && isValidActionableUrl(founderData.apply_url!, { context: 'apply_url' });
  const hasRolesUrl = !isNAValue(founderData.rolesUrl) && isValidActionableUrl(founderData.rolesUrl!, { context: 'careers_url' });
  const hasCompanyUrl = !isNAValue(founderData.companyUrl) && isValidActionableUrl(founderData.companyUrl!, { context: 'company_url' }) && !!getDomainFromUrl(founderData.companyUrl);
  const hasAnyContact = hasLinkedIn || hasEmail || hasApplyUrl || hasRolesUrl || hasCompanyUrl;

  // Published date
  const hasPublished = !isNAValue(founderData.published);

  const handleSave = () => {
    onSave({
      id: founderData.id,
      company: founderData.company,
      company_info: founderData.companyInfo,
      name: founderData.name,
      role: founderData.role,
      looking_for: founderData.lookingForTags.join(', '),
      company_url: founderData.companyUrl,
      url: founderData.rolesUrl,
      apply_url: founderData.apply_url,
      linkedinurl: founderData.linkedinUrl,
      email: founderData.emailHref?.replace('mailto:', ''),
      published: founderData.published
    });
  };

  // Shared contact card renderer to reduce duplication
  const renderLockedCard = (icon: React.ReactNode, label: string) => (
    <div className="relative group">
      <div className="glass-card p-5 cursor-pointer transition-all hover-lift" style={{
        borderLeft: '2px solid var(--wisteria)',
      }}>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{
            background: 'linear-gradient(135deg, rgba(180,151,214,0.15), rgba(180,151,214,0.05))',
            border: '1px solid rgba(180,151,214,0.3)',
          }}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-white mb-0.5">{label}</div>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--wisteria)' }}>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-medium">Sign in to unlock</span>
            </div>
          </div>
          <svg className="h-4 w-4 text-neutral-500 group-hover:text-[var(--lavender-web)] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );

  const renderContactLink = (href: string, icon: React.ReactNode, label: string, subtitle: string) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card p-5 hover-lift transition-all group block"
      style={{ borderLeft: '2px solid var(--wisteria)' }}
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{
          background: 'linear-gradient(135deg, rgba(180,151,214,0.15), rgba(180,151,214,0.05))',
          border: '1px solid rgba(180,151,214,0.3)',
        }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-white group-hover:text-[var(--lavender-web)] transition-colors">{label}</div>
          <div className="text-sm text-neutral-400 truncate">{subtitle}</div>
        </div>
        <svg className="h-4 w-4 text-neutral-500 group-hover:text-[var(--lavender-web)] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );

  // SVG icon components
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
    <div
      className="modal-backdrop flex items-center justify-center p-4 z-50 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="modal-content text-neutral-100 w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in relative"
        style={{
          background: 'rgba(12, 13, 22, 0.95)',
          backdropFilter: 'blur(24px) saturate(1.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(180, 151, 214, 0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
          style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          aria-label="Close modal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[90vh] p-7 sm:p-8">

          {/* ── Header ── */}
          <div className="flex items-start gap-5 mb-7">
            {/* Logo */}
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl overflow-hidden flex-shrink-0" style={{
              background: 'linear-gradient(135deg, rgba(180,151,214,0.08), rgba(5,32,74,0.15))',
              border: '1px solid rgba(180,151,214,0.2)',
            }}>
              {avatarInfo.faviconUrl ? (
                <img
                  src={avatarInfo.faviconUrl}
                  alt={`${avatarInfo.displayName} logo`}
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const nextElement = target.nextElementSibling as HTMLElement;
                    if (nextElement) nextElement.style.display = 'flex';
                  }}
                />
              ) : null}
              <span
                className={`font-bold text-2xl sm:text-3xl text-[var(--lavender-web)] ${avatarInfo.faviconUrl ? 'hidden' : 'flex'}`}
              >
                {avatarInfo.initials}
              </span>
            </div>

            {/* Name + role + description */}
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl sm:text-3xl text-white mb-2" style={{ letterSpacing: '-0.02em', lineHeight: '1.15' }}>
                {companyDisplay}
              </h2>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {hasName && (
                  <>
                    <span className="text-sm sm:text-base font-medium text-neutral-200">{founderData.name}</span>
                    <span className="text-neutral-600">·</span>
                  </>
                )}
                <span className="text-sm sm:text-base font-medium" style={{ color: 'var(--lavender-web)' }}>
                  {roleDisplay}
                </span>
                {hasPublished && (
                  <>
                    <span className="text-neutral-600">·</span>
                    <span className="text-xs sm:text-sm text-neutral-500">{founderData.published}</span>
                  </>
                )}
              </div>

              {hasCompanyInfo && (
                <p className="text-sm text-neutral-400 leading-relaxed mb-4">
                  {founderData.companyInfo}
                </p>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                className={`${isSaved ? 'btn btn-ghost' : 'btn btn-primary'}`}
              >
                <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="font-semibold text-sm">{isSaved ? "Saved" : "Save Contact"}</span>
              </button>
            </div>
          </div>

          {/* ── Contact Section ── only render if there's at least one valid contact */}
          {hasAnyContact && (
            <section className="mb-7">
              <h3 className="font-display text-lg text-white mb-3" style={{ letterSpacing: '-0.01em' }}>Contact</h3>
              <div className="grid gap-3">
                {/* LinkedIn */}
                {hasLinkedIn && (
                  isHomePage ? renderLockedCard(linkedInIcon, 'LinkedIn Profile') : (
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
                      {renderContactLink(founderData.linkedinUrl!, linkedInIcon, 'LinkedIn Profile', 'Connect professionally')}
                    </ContactInfoGate>
                  )
                )}

                {/* Email */}
                {hasEmail && (
                  isHomePage ? renderLockedCard(emailIcon, 'Email Address') : (
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
                      {renderContactLink(emailInfo!.href, emailIcon, 'Email Address', emailInfo!.email)}
                    </ContactInfoGate>
                  )
                )}

                {/* Apply URL */}
                {hasApplyUrl && (
                  isHomePage ? renderLockedCard(applyIcon, 'Apply Now') : (
                    renderContactLink(
                      founderData.apply_url!.startsWith('http') ? founderData.apply_url! : `https://${founderData.apply_url}`,
                      applyIcon, 'Apply Now', 'Direct application'
                    )
                  )
                )}

                {/* Careers Page */}
                {hasRolesUrl && (
                  renderContactLink(
                    founderData.rolesUrl!.startsWith('http') ? founderData.rolesUrl! : `https://${founderData.rolesUrl}`,
                    careersIcon, 'Careers Page', getDomainFromUrl(founderData.rolesUrl) || ''
                  )
                )}

                {/* Company Website */}
                {hasCompanyUrl && (() => {
                  const domain = getDomainFromUrl(founderData.companyUrl)!;
                  const href = founderData.companyUrl!.startsWith('http') ? founderData.companyUrl! : `https://${founderData.companyUrl}`;
                  return renderContactLink(
                    href,
                    <img
                      src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
                      alt=""
                      className="h-5 w-5 rounded-sm"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/globe.svg'; }}
                    />,
                    'Company Website', domain
                  );
                })()}
              </div>
            </section>
          )}

          {/* ── Looking For ── only if there are valid tags */}
          {validTags.length > 0 && (
            <section className="mb-7">
              <h3 className="font-display text-lg text-white mb-3" style={{ letterSpacing: '-0.01em' }}>Looking For</h3>
              <div className="glass-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {validTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors hover:text-white"
                      style={{
                        background: 'rgba(180, 151, 214, 0.1)',
                        border: '1px solid rgba(180, 151, 214, 0.2)',
                        color: 'var(--lavender-web)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {(founderData.restCount || 0) > 0 && (
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-neutral-500" style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}>
                      +{founderData.restCount} more
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── No data fallback ── when there's truly nothing useful to show */}
          {!hasAnyContact && validTags.length === 0 && !hasCompanyInfo && (
            <div className="glass-card p-6 text-center">
              <p className="text-neutral-500 text-sm">Limited information available for this founder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
