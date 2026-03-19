"use client";

import { useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import ContactInfoGate from './ContactInfoGate';
import PaywallModal from './PaywallModal';
import { useSubscription } from '../hooks/useSubscription';
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
  anonFreePreview?: boolean;
}

export default function FounderDetailModal({ founderData, onClose, onSave, isSaved, isHomePage = false, anonFreePreview = false }: FounderDetailModalProps) {
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
    if (!input) return null;
    let raw = input.trim();
    if (raw.toLowerCase().startsWith('mailto:')) raw = raw.slice(7);
    if (!raw.includes('@')) return null;
    return { email: raw, href: `mailto:${raw}` };
  };

  const getAvatarInfo = (name?: string | null, company?: string | null, companyUrl?: string | null, url?: string | null) => {
    const websiteUrl = companyUrl || url;
    let faviconUrl = null;

    if (websiteUrl) {
      const domain = getDomainFromUrl(websiteUrl);
      if (domain) {
        faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      }
    }

    let initials = 'UN';
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        initials = parts[0].slice(0, 2).toUpperCase();
      }
    } else if (company) {
      const parts = company.split(' ');
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        initials = parts[0].slice(0, 2).toUpperCase();
      }
    }

    return { faviconUrl, initials, displayName: name || company || 'Unknown' };
  };

  const { isSignedIn } = useUser();
  const { isPaid } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const avatarInfo = getAvatarInfo(founderData.name, founderData.company, founderData.companyUrl, founderData.rolesUrl);
  const emailInfo = getEmailInfo(founderData.emailHref);

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

  const companyName = (!founderData.company || founderData.company === 'Unknown' || founderData.company === 'Unknown Company' || founderData.company === 'N/A') ? "Stealth Company" : founderData.company;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#11121b] text-neutral-100 rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-hidden border border-white/10 sm:border-white/15 flex flex-col"
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,.5), 0 0 80px rgba(180,151,214,.06)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — compact with inline avatar */}
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3 sm:px-5 sm:py-4 flex-shrink-0">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl overflow-hidden flex-shrink-0" style={{
            background: 'rgba(5,32,74,.25)',
            color: 'var(--lavender-web)',
            border: '1px solid rgba(5,32,74,.6)'
          }}>
            {avatarInfo.faviconUrl ? (
              <img
                src={avatarInfo.faviconUrl}
                alt={`${avatarInfo.displayName} favicon`}
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-sm"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const nextElement = target.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'block';
                  }
                }}
              />
            ) : null}
            <span className={`font-semibold text-sm sm:text-base ${avatarInfo.faviconUrl ? 'hidden' : 'block'}`}>
              {avatarInfo.initials}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-white truncate">{companyName}</h3>
            {founderData.name && founderData.name !== founderData.company && (
              <p className="text-xs text-neutral-400 truncate">{founderData.name}</p>
            )}
          </div>
          {isSignedIn && (
            <button
              onClick={handleSave}
              className="focus-ring flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: isSaved ? 'rgba(180,151,214,.15)' : 'linear-gradient(135deg,var(--wisteria),var(--lavender-web))',
                color: isSaved ? 'var(--wisteria)' : '#0f1018',
                border: isSaved ? '1px solid rgba(180,151,214,.3)' : 'none',
              }}
            >
              <svg className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {isSaved ? "Saved" : "Save"}
            </button>
          )}
          <button
            onClick={onClose}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" /></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <div className="px-4 py-3 sm:px-5 sm:py-4 grid gap-3 sm:gap-4">

            {/* Company info + role — condensed */}
            <section className="rounded-xl border border-white/8 bg-white/[.02] p-3 sm:p-4">
              {founderData.companyInfo && (
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-3">{founderData.companyInfo}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-medium text-neutral-500 uppercase tracking-wider">Role</span>
                {founderData.role ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide" style={{
                    border: '1px solid rgba(180,151,214,.3)',
                    background: 'rgba(180,151,214,.12)',
                    color: 'var(--wisteria)'
                  }}>
                    {founderData.role}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide" style={{
                    border: '1px solid rgba(180,151,214,.3)',
                    background: 'rgba(180,151,214,.12)',
                    color: 'var(--wisteria)'
                  }}>
                    Founder
                  </span>
                )}
                {founderData.published !== "N/A" && (
                  <>
                    <span className="text-neutral-600">·</span>
                    <span className="text-[10px] text-neutral-500">{founderData.published}</span>
                  </>
                )}
              </div>
            </section>

            {/* Contact & Links — full detail view */}
            <section className="grid gap-2">
              <h5 className="text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider">Contact & Links</h5>
              <div className="grid grid-cols-1 gap-1.5">
                {founderData.linkedinUrl && isValidActionableUrl(founderData.linkedinUrl, { context: 'linkedin_url' }) && (
                  isHomePage ? (
                    <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[.02] px-3 py-2.5 opacity-50 cursor-not-allowed">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-blue-500 flex-shrink-0">
                        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium">LinkedIn Profile</div>
                        <div className="text-[10px] text-neutral-500">Sign in to view profile</div>
                      </div>
                    </div>
                  ) : (
                    <ContactInfoGate
                      feature="LinkedIn Profiles"
                      description="Upgrade to access LinkedIn profiles and generate personalized outreach messages."
                      bypassGate={anonFreePreview}
                      fallback={!isSignedIn ? (
                        <SignInButton mode="modal" forceRedirectUrl="/opportunities?welcome=1">
                          <div className="flex items-center gap-3 rounded-lg border border-[var(--wisteria)]/30 bg-[var(--wisteria)]/10 px-3 py-2.5 cursor-pointer hover:bg-[var(--wisteria)]/20 transition-colors">
                            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--wisteria)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium" style={{ color: 'var(--wisteria)' }}>LinkedIn Profile</div>
                              <div className="text-[10px]" style={{ color: 'rgba(180,151,214,0.7)' }}>Sign up free to view profile</div>
                            </div>
                          </div>
                        </SignInButton>
                      ) : undefined}
                    >
                      <a
                        href={founderData.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[.02] px-3 py-2.5 hover:bg-white/[.05] transition-colors group"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-blue-500 flex-shrink-0">
                          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium">LinkedIn Profile</div>
                          <div className="text-[10px] text-neutral-500 truncate group-hover:text-blue-400 transition-colors">{founderData.linkedinUrl}</div>
                        </div>
                        <svg className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    </ContactInfoGate>
                  )
                )}

                {emailInfo && (
                  isHomePage ? (
                    <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[.02] px-3 py-2.5 opacity-50 cursor-not-allowed">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-green-500 flex-shrink-0">
                        <path d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Z" />
                        <path d="m4 6 8 6 8-6" opacity=".35" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium">Email Address</div>
                        <div className="text-[10px] text-neutral-500">Sign in to view email</div>
                      </div>
                    </div>
                  ) : (
                    <ContactInfoGate
                      feature="Email Addresses"
                      description="Upgrade to access email addresses and generate personalized outreach messages."
                      bypassGate={anonFreePreview}
                      fallback={!isSignedIn ? (
                        <SignInButton mode="modal" forceRedirectUrl="/opportunities?welcome=1">
                          <div className="flex items-center gap-3 rounded-lg border border-[var(--wisteria)]/30 bg-[var(--wisteria)]/10 px-3 py-2.5 cursor-pointer hover:bg-[var(--wisteria)]/20 transition-colors">
                            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--wisteria)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium" style={{ color: 'var(--wisteria)' }}>Email Address</div>
                              <div className="text-[10px]" style={{ color: 'rgba(180,151,214,0.7)' }}>Sign up free to view email</div>
                            </div>
                          </div>
                        </SignInButton>
                      ) : undefined}
                    >
                      <a
                        href={emailInfo.href}
                        className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[.02] px-3 py-2.5 hover:bg-white/[.05] transition-colors group"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-green-500 flex-shrink-0">
                          <path d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Z" />
                          <path d="m4 6 8 6 8-6" opacity=".35" />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium">Email Address</div>
                          <div className="text-[10px] text-neutral-500 truncate group-hover:text-green-400 transition-colors">{emailInfo.email}</div>
                        </div>
                        <svg className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </a>
                    </ContactInfoGate>
                  )
                )}

                {founderData.apply_url && isValidActionableUrl(founderData.apply_url, { context: 'apply_url' }) && (
                  isHomePage ? (
                    <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2.5 opacity-50 cursor-not-allowed">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-green-400 flex-shrink-0">
                        <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-green-400">Apply Now</div>
                        <div className="text-[10px] text-neutral-500">Sign in to apply directly</div>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={founderData.apply_url.startsWith('http') ? founderData.apply_url : `https://${founderData.apply_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2.5 hover:bg-green-500/10 transition-colors group"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-green-400 flex-shrink-0">
                        <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-green-400">Apply Now</div>
                        <div className="text-[10px] text-neutral-500 truncate group-hover:text-green-400 transition-colors">{getDomainFromUrl(founderData.apply_url) || 'Direct application'}</div>
                      </div>
                      <svg className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  )
                )}

                {founderData.rolesUrl && isValidActionableUrl(founderData.rolesUrl, { context: 'careers_url' }) && (
                  isHomePage ? (
                    <div className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2.5 opacity-50 cursor-not-allowed">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-purple-400 flex-shrink-0">
                        <path d="M10 6h4a2 2 0 0 1 2 2v1h-8V8a2 2 0 0 1 2-2Zm-4 5h12a2 2 0 0 1 2 2v6H4v-6a2 2 0 0 1 2-2Z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-purple-400">Careers Page</div>
                        <div className="text-[10px] text-neutral-500">Sign in to view careers</div>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={founderData.rolesUrl.startsWith('http') ? founderData.rolesUrl : `https://${founderData.rolesUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2.5 hover:bg-purple-500/10 transition-colors group"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-purple-400 flex-shrink-0">
                        <path d="M10 6h4a2 2 0 0 1 2 2v1h-8V8a2 2 0 0 1 2-2Zm-4 5h12a2 2 0 0 1 2 2v6H4v-6a2 2 0 0 1 2-2Z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-purple-400">Careers Page</div>
                        <div className="text-[10px] text-neutral-500 truncate group-hover:text-purple-400 transition-colors">{getDomainFromUrl(founderData.rolesUrl)}</div>
                      </div>
                      <svg className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  )
                )}

                {founderData.companyUrl && isValidActionableUrl(founderData.companyUrl, { context: 'company_url' }) && (() => {
                  const domain = getDomainFromUrl(founderData.companyUrl);
                  if (!domain) return null;
                  const href = founderData.companyUrl!.startsWith('http') ? founderData.companyUrl! : `https://${founderData.companyUrl}`;
                  return isHomePage ? (
                    <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[.02] px-3 py-2.5 opacity-50 cursor-not-allowed">
                      <img
                        src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
                        alt=""
                        className="h-4 w-4 rounded-sm flex-shrink-0"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/globe.svg'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium">Company Website</div>
                        <div className="text-[10px] text-neutral-500">Sign in to visit website</div>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[.02] px-3 py-2.5 hover:bg-white/[.05] transition-colors group"
                    >
                      <img
                        src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
                        alt=""
                        className="h-4 w-4 rounded-sm flex-shrink-0"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/globe.svg'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium">Company Website</div>
                        <div className="text-[10px] text-neutral-500 truncate group-hover:text-white transition-colors">{domain}</div>
                      </div>
                      <svg className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  );
                })()}
              </div>
            </section>

            {/* Looking For tags */}
            {founderData.lookingForTags.length > 0 && (
              <section className="grid gap-2">
                <h5 className="text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider">Looking For</h5>
                <div className="flex flex-wrap gap-1.5">
                  {founderData.lookingForTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs"
                      style={{
                        border: '1px solid rgba(180,151,214,.3)',
                        background: 'rgba(180,151,214,.12)',
                        color: 'var(--lavender-web)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {(founderData.restCount || 0) > 0 && (
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs bg-neutral-800 text-neutral-400">
                      +{founderData.restCount} more
                    </span>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer — sticky */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3 border-t border-white/8 flex-shrink-0 bg-[#11121b]">
          <button
            onClick={onClose}
            className="focus-ring rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            Close
          </button>
          {!isSignedIn ? (
            <div className="flex items-center gap-2">
              <SignInButton mode="modal" forceRedirectUrl="/opportunities?welcome=1">
                <button className="focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: 'linear-gradient(135deg,var(--wisteria),var(--lavender-web))', color: '#0f1018' }}>
                  Sign up free
                </button>
              </SignInButton>
              <span className="text-[10px] text-neutral-600 hidden sm:inline">No credit card needed</span>
            </div>
          ) : !isPaid ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: 'linear-gradient(135deg,var(--wisteria),var(--lavender-web))', color: '#0f1018' }}
              >
                Upgrade — $3/mo
              </button>
              <span className="text-[10px] text-neutral-600 hidden sm:inline">Unlock all features</span>
            </div>
          ) : null}
        </div>
      </div>
      <PaywallModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Pro Features"
        description="Upgrade to access LinkedIn profiles, email addresses, and AI-powered outreach generation."
      />
    </div>
  );
}
