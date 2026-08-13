"use client";

import ContactInfoGate from './ContactInfoGate';
import { isValidActionableUrl } from '../../lib/url-validation';

export interface SavedContactCardProps {
  company: string;
  company_info?: string;
  name?: string;
  role?: string;
  looking_for?: string;
  company_url?: string;
  url?: string;
  apply_url?: string;
  linkedinurl?: string;
  email?: string;
  published?: { toDate: () => Date } | null;
  savedAt?: { toDate: () => Date } | null;
  isPaid?: boolean;
  lastOutreach?: string;
  outreachStage?: string | null;
  outreachStageDisplay?: string | null;
  outreachMessageType?: string;
  onCardClick?: () => void;
  onDelete?: () => void;
  onGenerateOutreach?: (e: React.MouseEvent) => void;
  onShowPaywall?: () => void;
  'data-tour'?: string;
  generateButtonTourAttr?: string;
  isDemo?: boolean;
}

// Helper: extract domain from a URL/email string
function getDomainFromUrl(input?: string): string | null {
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
    if (!/^https?:\/\//i.test(str)) str = `https://${str}`;
    const u = new URL(str);
    return u.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    const host = str.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0];
    return host ? host.toLowerCase() : null;
  }
}

// Helper: build avatar info (favicon URL + initials fallback)
function getAvatarInfo(name?: string, company?: string, companyUrl?: string, url?: string) {
  const websiteUrl = companyUrl || url;
  let faviconUrl: string | null = null;
  if (websiteUrl) {
    const domain = getDomainFromUrl(websiteUrl);
    if (domain) faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  }

  let initials = 'UN';
  const source = name || company;
  if (source) {
    const parts = source.split(' ');
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = parts[0].slice(0, 2).toUpperCase();
    }
  }

  return { faviconUrl, initials, displayName: name || company || 'Unknown' };
}

// Helper: normalise email value
function getEmailInfo(input?: string): { email: string; href: string } | null {
  if (!input) return null;
  let raw = input.trim();
  if (raw.toLowerCase().startsWith('mailto:')) raw = raw.slice(7);
  if (!raw.includes('@')) return null;
  return { email: raw, href: `mailto:${raw}` };
}

// Helper: extract tags from looking_for string
function getTags(looking_for?: string): string[] {
  if (!looking_for) return [];
  return looking_for
    .split(/[,;\n]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

// Stage badge colour mapping
function getStageBadgeClass(stage: string): string {
  const map: Record<string, string> = {
    sent: 'bg-[#7f8bb3]/20 text-[#7f8bb3]',
    responded: 'bg-[#b497d6]/20 text-[#b497d6]',
    in_talks: 'bg-[#c7a8e6]/20 text-[#c7a8e6]',
    interviewing: 'bg-[#e1e2ef]/20 text-[#e1e2ef]',
    rejected: 'bg-[#9b4444]/20 text-[#9b4444]',
    connected: 'bg-[#7fb3a6]/20 text-[#7fb3a6]',
    ghosted: 'bg-[#8b7f7f]/20 text-[#8b7f7f]',
  };
  return map[stage] ?? 'bg-neutral-500/20 text-neutral-400';
}

export default function SavedContactCard({
  company,
  company_info,
  name,
  role,
  looking_for,
  company_url,
  url,
  apply_url,
  linkedinurl,
  email,
  published,
  savedAt,
  isPaid = false,
  lastOutreach = 'never',
  outreachStage = null,
  outreachStageDisplay = null,
  outreachMessageType,
  onCardClick,
  onDelete,
  onGenerateOutreach,
  onShowPaywall,
  'data-tour': dataTour,
  generateButtonTourAttr,
  isDemo = false,
}: SavedContactCardProps) {
  const avatarInfo = getAvatarInfo(name, company, company_url, url);
  const tags = getTags(looking_for);
  const emailInfo = getEmailInfo(email);

  const handleCardClick = () => onCardClick?.();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateOutreach?.(e);
  };

  const handleShowPaywall = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowPaywall?.();
  };

  const showApply = Boolean(apply_url && isValidActionableUrl(apply_url, { context: 'apply_url' }));

  // LinkedIn link element
  const linkedinLink = linkedinurl && isValidActionableUrl(linkedinurl, { context: 'linkedin_url' }) ? (
    <a
      href={linkedinurl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-1.5 py-0.5 hover:bg-neutral-50 dark:border-white/10 dark:bg-[#141522] dark:hover:bg-[#18192a] transition-colors text-[10px]"
      aria-label="LinkedIn profile"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-blue-600">
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" />
      </svg>
      LinkedIn
    </a>
  ) : null;

  // Email link element
  const emailLink = emailInfo ? (
    <a
      href={emailInfo.href}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-1.5 py-0.5 hover:bg-neutral-50 dark:border-white/10 dark:bg-[#141522] dark:hover:bg-[#18192a] transition-colors text-[10px]"
      aria-label="Email"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-green-600">
        <path d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Z" />
        <path d="m4 6 8 6 8-6" opacity=".35" />
      </svg>
      Email
    </a>
  ) : null;

  return (
    <article
      data-tour={dataTour}
      className="rounded-2xl bg-neutral-50 text-neutral-900 shadow-card ring-1 ring-black/10 overflow-hidden dark:bg-[#11121b] dark:text-neutral-100 dark:ring-white/10 cursor-pointer hover:ring-2 hover:ring-[var(--lavender-web)]/30 transition-all"
      onClick={handleCardClick}
    >
      <div className="p-4 h-[520px] flex flex-col">
        {/* Header: Avatar + Company Info */}
        <div className="flex items-start gap-3 h-[80px]">
          <div className="card-initials flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden flex-shrink-0">
            {avatarInfo.faviconUrl ? (
              <img
                src={avatarInfo.faviconUrl}
                alt={`${avatarInfo.displayName} favicon`}
                className="w-8 h-8 rounded-sm"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const next = target.nextElementSibling as HTMLElement | null;
                  if (next) next.style.display = 'block';
                }}
              />
            ) : null}
            <span className={`font-semibold ${avatarInfo.faviconUrl ? 'hidden' : 'block'}`}>
              {avatarInfo.initials}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-white mb-1 truncate">{company}</h3>
                <div className="text-xs text-neutral-300 mb-1 h-8 overflow-hidden">
                  <div className="line-clamp-2">
                    {company_info && company_info.length > 0
                      ? (company_info.length > 80 ? `${company_info.substring(0, 80)}...` : company_info)
                      : 'Technology company'}
                  </div>
                </div>
                <div className="text-xs text-neutral-400">
                  {published && published.toDate ? (
                    <span>
                      {new Date(published.toDate()).toLocaleDateString()} &bull; {(() => {
                        const now = new Date();
                        const pub = published.toDate();
                        const diffMs = now.getTime() - pub.getTime();
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        const diffWeeks = Math.floor(diffDays / 7);
                        const diffMonths = Math.floor(diffDays / 30);
                        if (diffDays < 1) return 'today';
                        if (diffDays === 1) return '1 day ago';
                        if (diffDays < 7) return `${diffDays} days ago`;
                        if (diffWeeks === 1) return '1 week ago';
                        if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
                        if (diffMonths === 1) return '1 month ago';
                        return `${diffMonths} months ago`;
                      })()}
                    </span>
                  ) : 'Recently'}
                </div>
              </div>

              {!isDemo && onDelete && (
                <button
                  onClick={handleDelete}
                  aria-label="Remove saved contact"
                  className="focus-ring inline-flex items-center justify-center rounded-lg border border-white/10 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white flex-shrink-0"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M9 3h6a1 1 0 0 1 1 1v2h4v2h-1v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8H4V6h4V4a1 1 0 0 1 1-1Zm2 5h2v10h-2V8Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contact Name */}
        <div className="h-[40px] mt-3">
          <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-wider">Contact</span>
          <div className="text-sm font-medium text-neutral-900 dark:text-white truncate mt-1">
            {name && name !== company ? name : (name || 'Unknown')}
          </div>
        </div>

        {/* Role badges */}
        <div className="h-[50px] mt-3">
          <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-wider">Role</span>
          <div className="mt-2 flex flex-wrap gap-1">
            {role ? (
              role.split(',').slice(0, 2).map((r, i) => {
                const trimmed = r.trim();
                const truncated = trimmed.length > 18 ? trimmed.substring(0, 18) + '...' : trimmed;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide role-badge-founder"
                    title={trimmed}
                  >
                    {truncated}
                  </span>
                );
              })
            ) : (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide role-badge-founder">
                Founder
              </span>
            )}
          </div>
        </div>

        {/* Contact Info links */}
        <div className="h-[60px] mt-3">
          <div className="text-[9px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Contact Info</div>
          <div className="flex flex-wrap gap-1">
            {/* LinkedIn */}
            {linkedinurl && isValidActionableUrl(linkedinurl, { context: 'linkedin_url' }) && (
              isDemo ? linkedinLink : (
                <ContactInfoGate
                  feature="LinkedIn Profiles"
                  description="Upgrade to access LinkedIn profiles and generate personalized outreach messages."
                  fallback={
                    <button
                      onClick={handleShowPaywall}
                      className="inline-flex items-center gap-1 rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 hover:bg-yellow-500/20 transition-colors text-[10px] text-yellow-400"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      LinkedIn
                    </button>
                  }
                >
                  {linkedinLink}
                </ContactInfoGate>
              )
            )}

            {/* Email */}
            {emailInfo && (
              isDemo ? emailLink : (
                <ContactInfoGate
                  feature="Email Addresses"
                  description="Upgrade to access email addresses and generate personalized outreach messages."
                  fallback={
                    <button
                      onClick={handleShowPaywall}
                      className="inline-flex items-center gap-1 rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 hover:bg-yellow-500/20 transition-colors text-[10px] text-yellow-400"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Email
                    </button>
                  }
                >
                  {emailLink}
                </ContactInfoGate>
              )
            )}

            {/* Careers URL */}
            {url && url !== apply_url && isValidActionableUrl(url, { context: 'careers_url' }) && (
              <a
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-colors text-[10px] text-purple-700 dark:text-purple-400"
                aria-label="Careers"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                  <path d="M10 6h4a2 2 0 0 1 2 2v1h-8V8a2 2 0 0 1 2-2Zm-4 5h12a2 2 0 0 1 2 2v6H4v-6a2 2 0 0 1 2-2Z" />
                </svg>
                Careers
              </a>
            )}

            {/* Company Website */}
            {company_url && company_url !== apply_url && company_url !== url && isValidActionableUrl(company_url, { context: 'company_url' }) && (() => {
              const domain = getDomainFromUrl(company_url);
              if (!domain) return null;
              const href = company_url.startsWith('http') ? company_url : `https://${company_url}`;
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-1.5 py-0.5 hover:bg-neutral-50 dark:border-white/10 dark:bg-[#141522] dark:hover:bg-[#18192a] transition-colors text-[10px]"
                  aria-label="Website"
                >
                  <img
                    src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
                    alt=""
                    className="h-3 w-3 rounded-sm"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/globe.svg'; }}
                  />
                  Website
                </a>
              );
            })()}
          </div>
        </div>

        {/* Looking For tags */}
        <div className="h-[50px] mt-3">
          <div className="text-[9px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Looking for</div>
          <div className="flex flex-wrap gap-1 overflow-hidden">
            {tags.length > 0 ? (
              tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="tag inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] leading-tight">
                  {tag}
                </span>
              ))
            ) : (
              <span className="tag inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] leading-tight">
                Open to opportunities
              </span>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2">
          <div className="grid grid-cols-2 gap-1.5 text-xs text-neutral-400 mb-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-medium uppercase tracking-wider mb-0.5">Added</span>
              <span className="text-neutral-600 dark:text-neutral-300">
                {savedAt && savedAt.toDate ? new Date(savedAt.toDate()).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-medium uppercase tracking-wider mb-0.5">Last Outreach</span>
              <span className="text-neutral-600 dark:text-neutral-300">{lastOutreach}</span>
            </div>
            {outreachStage && (
              <>
                <div className="flex flex-col">
                  <span className="text-[9px] font-medium uppercase tracking-wider mb-0.5">Current Stage</span>
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${getStageBadgeClass(outreachStage)}`}>
                      {outreachStageDisplay}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-medium uppercase tracking-wider mb-0.5">Channel</span>
                  <span className="text-neutral-600 dark:text-neutral-300 capitalize">
                    {outreachMessageType === 'email' ? 'Email' : 'LinkedIn'}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className={`grid gap-2 ${showApply ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {showApply && (
              <a
                href={apply_url!.startsWith('http') ? apply_url! : `https://${apply_url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="focus-ring inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm justify-center border border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-500/30 dark:bg-green-500/10 dark:hover:bg-green-500/20 transition-colors text-green-700 dark:text-green-400 font-semibold"
                aria-label="Apply"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                </svg>
                Apply
              </a>
            )}

            <button
              data-tour={generateButtonTourAttr}
              onClick={handleGenerate}
              className={`focus-ring inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm justify-center ${
                isPaid
                  ? 'btn-primary'
                  : 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/30 text-yellow-400'
              }`}
            >
              {isPaid ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              Generate Outreach
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
