"use client";

import { useState } from 'react';
import { EntryRecord, ContactRecord } from '../../../lib/companies';
import { isNA } from '../../../lib/entry-helpers';
import ContactInfoGate from '../../components/ContactInfoGate';
import IntegratedOutreachModal from '../../components/IntegratedOutreachModal';

interface Props {
  entries: EntryRecord[];
  contacts: ContactRecord[];
  recentEntries: EntryRecord[];
  olderEntries: EntryRecord[];
  companyDisplayName: string;
  companyInfo: string;
}

interface OutreachTarget {
  contact: ContactRecord;
}

export default function CompanyPageTabs({
  recentEntries,
  olderEntries,
  contacts,
  companyDisplayName,
  companyInfo,
}: Props) {
  const [tab, setTab] = useState<'roles' | 'contacts'>('roles');
  const [outreachTarget, setOutreachTarget] = useState<OutreachTarget | null>(null);

  const totalRoles = recentEntries.length + olderEntries.length;

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: '1.5rem' }}>
        <TabBtn label="Roles" count={totalRoles} active={tab === 'roles'} onClick={() => setTab('roles')} />
        <TabBtn label="Contacts" count={contacts.length} active={tab === 'contacts'} onClick={() => setTab('contacts')} />
      </div>

      {tab === 'roles' && (
        <RolesTab recentEntries={recentEntries} olderEntries={olderEntries} />
      )}

      {tab === 'contacts' && (
        <ContactsTab
          contacts={contacts}
          companyDisplayName={companyDisplayName}
          companyInfo={companyInfo}
          onOutreach={c => setOutreachTarget({ contact: c })}
        />
      )}

      {outreachTarget && (
        <IntegratedOutreachModal
          jobData={{
            company: companyDisplayName,
            company_info: companyInfo,
            name: outreachTarget.contact.name,
            role: outreachTarget.contact.role,
            email: outreachTarget.contact.email,
            linkedinurl: outreachTarget.contact.linkedinurl,
            company_url: outreachTarget.contact.company_url,
          }}
          userProfile={null}
          onClose={() => setOutreachTarget(null)}
        />
      )}
    </>
  );
}

function TabBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all -mb-px"
      style={{
        borderBottom: active ? '2px solid var(--wisteria)' : '2px solid transparent',
        color: active ? '#fff' : 'rgba(255,255,255,.38)',
      }}
    >
      {label}
      <span
        className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums"
        style={{
          background: active ? 'rgba(180,151,214,.18)' : 'rgba(255,255,255,.06)',
          color: active ? 'rgba(180,151,214,.9)' : 'rgba(255,255,255,.25)',
          border: active ? '1px solid rgba(180,151,214,.25)' : '1px solid rgba(255,255,255,.08)',
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ── Roles tab ──────────────────────────────────────────────────────────────

function hasChannel(e: EntryRecord) {
  return !isNA(e.apply_url) || !isNA(e.email) || !isNA(e.linkedinurl);
}

function RolesTab({ recentEntries, olderEntries }: { recentEntries: EntryRecord[]; olderEntries: EntryRecord[] }) {
  const recent = recentEntries.filter(hasChannel);
  const older = olderEntries.filter(hasChannel);

  if (recent.length === 0 && older.length === 0) {
    return <p className="text-sm" style={{ color: 'rgba(255,255,255,.3)' }}>No roles found.</p>;
  }

  return (
    <div className="space-y-5">
      {recent.length > 0 && (
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
            style={{ color: 'rgba(180,151,214,.55)' }}
          >
            Last 90 days
          </p>
          <div
            className="overflow-hidden"
            style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,.08)' }}
          >
            {recent.map((e, i) => (
              <RoleRow key={e.id} entry={e} isLast={i === recent.length - 1} />
            ))}
          </div>
        </div>
      )}
      {older.length > 0 && (
        <div>
          {recent.length > 0 && (
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
              style={{ color: 'rgba(255,255,255,.22)' }}
            >
              Older
            </p>
          )}
          <div
            className="overflow-hidden"
            style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,.08)' }}
          >
            {older.map((e, i) => (
              <RoleRow key={e.id} entry={e} isLast={i === older.length - 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleRow({ entry, isLast }: { entry: EntryRecord; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  const hasApply = !isNA(entry.apply_url);
  const hasEmail = !isNA(entry.email);
  const hasLinkedIn = !isNA(entry.linkedinurl);
  const hasAnyChannel = hasApply || hasEmail || hasLinkedIn;

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,.05)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
        style={{ background: open ? 'rgba(180,151,214,.04)' : undefined }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.02)'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = ''; }}
      >
        {/* Chevron */}
        <svg
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            width: '13px', height: '13px',
            color: open ? 'rgba(180,151,214,.7)' : 'rgba(255,255,255,.18)',
            transform: open ? 'rotate(90deg)' : 'none',
          }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,.88)' }}>
            {!isNA(entry.looking_for) ? entry.looking_for : 'Open role'}
          </p>
          {(!isNA(entry.name) || !isNA(entry.role)) && !open && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,.32)' }}>
              {[!isNA(entry.name) ? entry.name : null, !isNA(entry.role) ? entry.role : 'Founder'].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {entry.published && (
            <span className="text-[11px] tabular-nums" style={{ color: 'rgba(255,255,255,.22)' }}>
              {entry.published}
            </span>
          )}
          {hasAnyChannel && (
            <div className="flex items-center gap-1">
              {hasApply && <ChannelDot type="apply" />}
              {hasEmail && <ChannelDot type="email" />}
              {hasLinkedIn && <ChannelDot type="linkedin" />}
            </div>
          )}
        </div>
      </button>

      {open && (
        <div
          className="px-4 pb-5 pt-2"
          style={{ background: 'rgba(0,0,0,.2)', borderTop: '1px solid rgba(255,255,255,.05)' }}
        >
          <div className="ml-[25px] space-y-3.5">
            {!isNA(entry.looking_for) && (
              <DetailBlock label="Looking for" value={entry.looking_for} />
            )}
            {!isNA(entry.company_info) && (
              <DetailBlock label="About the company" value={entry.company_info} />
            )}
            {!isNA(entry.name) && (
              <DetailBlock label="Contact" value={entry.name} />
            )}
            {entry.published && (
              <DetailBlock label="Posted" value={entry.published} />
            )}

            {/* Action buttons */}
            {hasAnyChannel && (
              <div className="flex flex-wrap gap-2 pt-1">
                {hasApply && (
                  <a
                    href={entry.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="btn btn-ghost btn-sm"
                  >
                    Apply ↗
                  </a>
                )}
                {hasEmail && (
                  <ContactInfoGate feature="Email" description="Upgrade to view email addresses.">
                    <a
                      href={`mailto:${entry.email}`}
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      style={{
                        border: '1px solid rgba(74,222,128,.22)',
                        background: 'rgba(74,222,128,.08)',
                        color: 'rgba(74,222,128,.85)',
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </a>
                  </ContactInfoGate>
                )}
                {hasLinkedIn && (
                  <ContactInfoGate feature="LinkedIn" description="Upgrade to view LinkedIn profiles.">
                    <a
                      href={entry.linkedinurl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      style={{
                        border: '1px solid rgba(96,165,250,.22)',
                        background: 'rgba(96,165,250,.08)',
                        color: 'rgba(96,165,250,.85)',
                      }}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </a>
                  </ContactInfoGate>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelDot({ type }: { type: 'apply' | 'email' | 'linkedin' }) {
  const styles: Record<string, { bg: string; label: string }> = {
    apply: { bg: 'rgba(255,255,255,.22)', label: 'Apply' },
    email: { bg: 'rgba(74,222,128,.5)', label: 'Email' },
    linkedin: { bg: 'rgba(96,165,250,.5)', label: 'LinkedIn' },
  };
  const s = styles[type];
  return (
    <span
      title={s.label}
      className="w-1.5 h-1.5 rounded-full"
      style={{ background: s.bg }}
    />
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,.22)' }}>
        {label}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.65)' }}>{value}</p>
    </div>
  );
}

// ── Contacts tab ───────────────────────────────────────────────────────────

function ContactsTab({
  contacts,
  companyDisplayName,
  companyInfo,
  onOutreach,
}: {
  contacts: ContactRecord[];
  companyDisplayName: string;
  companyInfo: string;
  onOutreach: (c: ContactRecord) => void;
}) {
  if (contacts.length === 0) {
    return <p className="text-sm" style={{ color: 'rgba(255,255,255,.3)' }}>No contacts found.</p>;
  }

  return (
    <div
      className="overflow-hidden"
      style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,.08)' }}
    >
      {contacts.map((contact, i) => {
        const hasEmail = !isNA(contact.email);
        const hasLinkedIn = !isNA(contact.linkedinurl);
        const isLast = i === contacts.length - 1;

        return (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5 transition-colors"
            style={{
              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,.05)',
            }}
          >
            {/* Avatar initials */}
            <div
              className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(5,32,74,.35)', border: '1px solid rgba(5,32,74,.8)', color: 'var(--lavender-web)' }}
            >
              {contact.name?.trim()
                ? contact.name.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('')
                : '?'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,.88)' }}>
                {!isNA(contact.name) ? contact.name : 'Unknown'}
              </div>
              {!isNA(contact.role) && (
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.38)' }}>{contact.role}</div>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {hasEmail && (
                <ContactInfoGate
                  feature="Email Address"
                  description="Upgrade to see email addresses and generate personalized outreach."
                  fallback={
                    <span
                      className="text-[11px] px-2 py-1 rounded-md cursor-not-allowed"
                      style={{ border: '1px solid rgba(74,222,128,.12)', background: 'rgba(74,222,128,.04)', color: 'rgba(74,222,128,.3)' }}
                    >
                      Email
                    </span>
                  }
                >
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-[11px] px-2 py-1 rounded-md transition-colors"
                    style={{ border: '1px solid rgba(74,222,128,.22)', background: 'rgba(74,222,128,.08)', color: 'rgba(74,222,128,.85)' }}
                  >
                    Email
                  </a>
                </ContactInfoGate>
              )}
              {hasLinkedIn && (
                <ContactInfoGate
                  feature="LinkedIn Profile"
                  description="Upgrade to see LinkedIn profiles and generate personalized outreach."
                  fallback={
                    <span
                      className="text-[11px] px-2 py-1 rounded-md cursor-not-allowed"
                      style={{ border: '1px solid rgba(96,165,250,.12)', background: 'rgba(96,165,250,.04)', color: 'rgba(96,165,250,.3)' }}
                    >
                      LinkedIn
                    </span>
                  }
                >
                  <a
                    href={contact.linkedinurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] px-2 py-1 rounded-md transition-colors"
                    style={{ border: '1px solid rgba(96,165,250,.22)', background: 'rgba(96,165,250,.08)', color: 'rgba(96,165,250,.85)' }}
                  >
                    LinkedIn
                  </a>
                </ContactInfoGate>
              )}
              <ContactInfoGate
                feature="Outreach Generation"
                description="Upgrade to generate personalized outreach messages."
              >
                <button
                  onClick={() => onOutreach(contact)}
                  className="text-[11px] px-2 py-1 rounded-md transition-colors"
                  style={{
                    border: '1px solid rgba(180,151,214,.22)',
                    background: 'rgba(180,151,214,.08)',
                    color: 'rgba(180,151,214,.8)',
                  }}
                >
                  Outreach
                </button>
              </ContactInfoGate>
            </div>
          </div>
        );
      })}
    </div>
  );
}
