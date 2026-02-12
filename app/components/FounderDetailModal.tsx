"use client";

import { useState } from 'react';
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
  isHomePage?: boolean; // New prop to indicate if this is the home page (sample data)
}

export default function FounderDetailModal({ founderData, onClose, onSave, isSaved, isHomePage = false }: FounderDetailModalProps) {
  // Helper functions from dashboard
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

  return (
    <div
      className="modal-backdrop flex items-center justify-center p-4 z-50 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="modal-content text-neutral-100 w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in"
        style={{
          background: '#11121b',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - floating top right */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
          style={{
            color: 'rgba(255, 255, 255, 0.6)'
          }}
          aria-label="Close modal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Body - Premium design with better spacing */}
        <div className="overflow-y-auto max-h-[90vh] p-8">
          {/* Header with logo, name, role */}
          <div className="flex items-start gap-6 mb-8">
            {/* Company logo - larger and more prominent */}
            <div className="flex h-20 w-20 items-center justify-center rounded-xl overflow-hidden flex-shrink-0" style={{
              background: 'rgba(5,32,74,.20)',
              border: '1px solid var(--oxford-blue)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              {avatarInfo.faviconUrl ? (
                <img
                  src={avatarInfo.faviconUrl}
                  alt={`${avatarInfo.displayName} logo`}
                  className="w-14 h-14 rounded-lg"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const nextElement = target.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <span
                className={`font-bold text-3xl text-[var(--lavender-web)] ${avatarInfo.faviconUrl ? 'hidden' : 'flex'}`}
              >
                {avatarInfo.initials}
              </span>
            </div>

            {/* Company name and role */}
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
                {(() => {
                  const company = founderData.company?.trim().toLowerCase() || '';
                  const unknownValues = ['unknown', 'unknown company', 'n/a', 'na', ''];
                  return unknownValues.includes(company) ? "Stealth Company" : founderData.company;
                })()}
              </h2>

              {/* Name and Role inline */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {founderData.name && founderData.name !== founderData.company && (
                  <>
                    <span className="text-base font-medium text-neutral-200">{founderData.name}</span>
                    <span className="text-neutral-600">•</span>
                  </>
                )}
                <span className="text-base font-medium" style={{ color: 'var(--lavender-web)' }}>
                  {founderData.role || "Founder"}
                </span>
              </div>

              {/* Company description */}
              {founderData.companyInfo && (
                <p className="text-sm text-neutral-300 leading-relaxed mb-5">
                  {founderData.companyInfo}
                </p>
              )}

              {/* Save button - more prominent */}
              <button
                onClick={handleSave}
                className={`${isSaved ? 'btn btn-ghost' : 'btn btn-primary'}`}
              >
                <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="font-semibold">{isSaved ? "Saved" : "Save"}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <section className="mb-8">
            <h3 className="text-base font-bold text-white mb-4" style={{ letterSpacing: '-0.01em' }}>Contact</h3>
            <div className="grid gap-3.5">
              {founderData.linkedinUrl && isValidActionableUrl(founderData.linkedinUrl, { context: 'linkedin_url' }) && (
                isHomePage ? (
                  // Home page: premium locked state
                  <div className="relative group">
                    <div className="card-dark p-5 cursor-pointer transition-all hover-lift" style={{
                      background: 'linear-gradient(135deg, rgba(180,151,214,.08), rgba(5,32,74,.12))',
                      border: '1px solid rgba(180,151,214,.25)'
                    }}>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110" style={{
                          background: 'linear-gradient(135deg, rgba(180,151,214,.2), rgba(225,226,239,.15))',
                          border: '1px solid rgba(180,151,214,.4)',
                          boxShadow: '0 2px 8px rgba(180, 151, 214, 0.2)'
                        }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[var(--lavender-web)]">
                            <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-base font-semibold text-white mb-1">LinkedIn Profile</div>
                          <div className="flex items-center gap-2 text-sm text-[var(--wisteria)]">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="font-medium">Sign in to unlock</span>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-[var(--lavender-web)] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Opportunities page: Use ContactInfoGate logic
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
                    <a
                      href={founderData.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-dark p-5 hover-lift transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110" style={{
                          background: 'rgba(180,151,214,.15)',
                          border: '1px solid rgba(180,151,214,.35)',
                          boxShadow: '0 2px 6px rgba(180, 151, 214, 0.15)'
                        }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[var(--lavender-web)]">
                            <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-base font-semibold text-white group-hover:text-[var(--lavender-web)] transition-colors">LinkedIn Profile</div>
                          <div className="text-sm text-neutral-400">Connect professionally</div>
                        </div>
                        <svg className="h-5 w-5 text-neutral-500 group-hover:text-[var(--lavender-web)] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </a>
                  </ContactInfoGate>
                )
              )}

              {emailInfo && (
                isHomePage ? (
                  // Home page: premium locked state
                  <div className="relative group">
                    <div className="card-dark p-5 cursor-pointer transition-all hover-lift" style={{
                      background: 'linear-gradient(135deg, rgba(180,151,214,.08), rgba(5,32,74,.12))',
                      border: '1px solid rgba(180,151,214,.25)'
                    }}>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110" style={{
                          background: 'linear-gradient(135deg, rgba(180,151,214,.2), rgba(225,226,239,.15))',
                          border: '1px solid rgba(180,151,214,.4)',
                          boxShadow: '0 2px 8px rgba(180, 151, 214, 0.2)'
                        }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[var(--lavender-web)]">
                            <path d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Z" />
                            <path d="m4 6 8 6 8-6" opacity=".35" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold text-white mb-1">Email Address</div>
                          <div className="flex items-center gap-2 text-sm text-[var(--wisteria)]">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="font-medium">Sign in to unlock</span>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-[var(--lavender-web)] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Opportunities page: Use ContactInfoGate logic
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
                    <a
                      href={emailInfo.href}
                      className="card-dark p-5 hover-lift transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110" style={{
                          background: 'rgba(180,151,214,.15)',
                          border: '1px solid rgba(180,151,214,.35)',
                          boxShadow: '0 2px 6px rgba(180, 151, 214, 0.15)'
                        }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[var(--lavender-web)]">
                            <path d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Z" />
                            <path d="m4 6 8 6 8-6" opacity=".35" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold text-white group-hover:text-[var(--lavender-web)] transition-colors">Email Address</div>
                          <div className="text-sm text-neutral-400 truncate">{emailInfo.email}</div>
                        </div>
                        <svg className="h-5 w-5 text-neutral-500 group-hover:text-[var(--lavender-web)] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </a>
                  </ContactInfoGate>
                )
              )}

              {/* Apply URL */}
              {founderData.apply_url && isValidActionableUrl(founderData.apply_url, { context: 'apply_url' }) && (
                isHomePage ? (
                  // Home page: premium locked state
                  <div className="relative group">
                    <div className="card-dark p-5 cursor-pointer transition-all hover-lift" style={{
                      background: 'linear-gradient(135deg, rgba(180,151,214,.08), rgba(5,32,74,.12))',
                      border: '1px solid rgba(180,151,214,.25)'
                    }}>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110" style={{
                          background: 'linear-gradient(135deg, rgba(180,151,214,.2), rgba(225,226,239,.15))',
                          border: '1px solid rgba(180,151,214,.4)',
                          boxShadow: '0 2px 8px rgba(180, 151, 214, 0.2)'
                        }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[var(--lavender-web)]">
                            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-base font-semibold text-white mb-1">Apply Now</div>
                          <div className="flex items-center gap-2 text-sm text-[var(--wisteria)]">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="font-medium">Sign in to unlock</span>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-[var(--lavender-web)] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Opportunities page: CTA
                  <a
                    href={founderData.apply_url.startsWith('http') ? founderData.apply_url : `https://${founderData.apply_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-dark p-5 hover-lift transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110" style={{
                        background: 'rgba(180,151,214,.15)',
                        border: '1px solid rgba(180,151,214,.35)',
                        boxShadow: '0 2px 6px rgba(180, 151, 214, 0.15)'
                      }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[var(--lavender-web)]">
                          <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold text-white group-hover:text-[var(--lavender-web)] transition-colors">Apply Now</div>
                        <div className="text-sm text-neutral-400">Direct application</div>
                      </div>
                      <svg className="h-5 w-5 text-neutral-500 group-hover:text-[var(--lavender-web)] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                )
              )}

              {/* Roles/Careers URL */}
              {founderData.rolesUrl && isValidActionableUrl(founderData.rolesUrl, { context: 'careers_url' }) && (
                <a
                  href={founderData.rolesUrl.startsWith('http') ? founderData.rolesUrl : `https://${founderData.rolesUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-dark p-5 hover-lift transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110" style={{
                      background: 'rgba(180,151,214,.15)',
                      border: '1px solid rgba(180,151,214,.35)',
                      boxShadow: '0 2px 6px rgba(180, 151, 214, 0.15)'
                    }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[var(--lavender-web)]">
                        <path d="M10 6h4a2 2 0 0 1 2 2v1h-8V8a2 2 0 0 1 2-2Zm-4 5h12a2 2 0 0 1 2 2v6H4v-6a2 2 0 0 1 2-2Z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-white group-hover:text-[var(--lavender-web)] transition-colors">Careers Page</div>
                      <div className="text-sm text-neutral-400 truncate">{getDomainFromUrl(founderData.rolesUrl)}</div>
                    </div>
                    <svg className="h-5 w-5 text-neutral-500 group-hover:text-[var(--lavender-web)] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              )}

              {/* Company Website */}
              {founderData.companyUrl && isValidActionableUrl(founderData.companyUrl, { context: 'company_url' }) && (() => {
                const domain = getDomainFromUrl(founderData.companyUrl);
                if (!domain) return null;
                const href = founderData.companyUrl.startsWith('http') ? founderData.companyUrl : `https://${founderData.companyUrl}`;
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-dark p-5 hover-lift transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center overflow-hidden transition-all group-hover:scale-110" style={{
                        background: 'rgba(180,151,214,.15)',
                        border: '1px solid rgba(180,151,214,.35)',
                        boxShadow: '0 2px 6px rgba(180, 151, 214, 0.15)'
                      }}>
                        <img
                          src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
                          alt=""
                          className="h-7 w-7 rounded-sm"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/globe.svg'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-white group-hover:text-[var(--lavender-web)] transition-colors">Company Website</div>
                        <div className="text-sm text-neutral-400 truncate">{domain}</div>
                      </div>
                      <svg className="h-5 w-5 text-neutral-500 group-hover:text-[var(--lavender-web)] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                );
              })()}
            </div>
          </section>

          {/* Looking For */}
          {founderData.lookingForTags.length > 0 && (
            <section className="mb-8">
              <h3 className="text-base font-bold text-white mb-4" style={{ letterSpacing: '-0.01em' }}>Looking For</h3>
              <div className="card-dark p-5" style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  {founderData.lookingForTags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-base font-medium transition-colors hover:text-white"
                      style={{ color: 'var(--lavender-web)' }}
                    >
                      {tag}
                      {index < founderData.lookingForTags.length - 1 && (
                        <span className="ml-3 text-neutral-600">•</span>
                      )}
                    </span>
                  ))}
                  {(founderData.restCount || 0) > 0 && (
                    <>
                      <span className="text-neutral-600">•</span>
                      <span className="text-base font-medium text-neutral-400">
                        +{founderData.restCount} more
                      </span>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Additional Details */}
          <section>
            <h3 className="text-base font-bold text-white mb-4" style={{ letterSpacing: '-0.01em' }}>Details</h3>
            <div className="card-dark p-5" style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Published</div>
              <div className="text-base text-white font-medium">
                {founderData.published !== "N/A" ? founderData.published : 'Unknown'}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
