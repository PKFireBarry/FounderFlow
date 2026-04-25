"use client";

import { useState } from 'react';
import { ContactRecord } from '../../../lib/companies';
import ContactInfoGate from '../../components/ContactInfoGate';
import IntegratedOutreachModal from '../../components/IntegratedOutreachModal';
import { isNA } from '../../../lib/entry-helpers';

interface Props {
  contacts: ContactRecord[];
  companyDisplayName: string;
  companyInfo: string;
}

interface OutreachTarget {
  contact: ContactRecord;
  companyDisplayName: string;
  companyInfo: string;
}

export default function ContactsSection({ contacts, companyDisplayName, companyInfo }: Props) {
  const [outreachTarget, setOutreachTarget] = useState<OutreachTarget | null>(null);

  if (contacts.length === 0) {
    return <p className="text-white/30 text-sm">No contacts found.</p>;
  }

  return (
    <>
      <div className="rounded-lg border border-white/10 divide-y divide-white/5">
        {contacts.map((contact, i) => {
          const hasEmail = !isNA(contact.email);
          const hasLinkedIn = !isNA(contact.linkedinurl);

          return (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/90">{!isNA(contact.name) ? contact.name : 'Unknown'}</div>
                {!isNA(contact.role) && (
                  <div className="text-xs text-white/40 mt-0.5">{contact.role}</div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasEmail && (
                  <ContactInfoGate
                    feature="Email Address"
                    description="Upgrade to see email addresses and generate personalized outreach."
                    fallback={
                      <span className="text-xs px-2 py-0.5 rounded border border-green-500/20 bg-green-500/10 text-green-400/50 cursor-not-allowed">
                        Email
                      </span>
                    }
                  >
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-xs px-2 py-0.5 rounded border border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
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
                      <span className="text-xs px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400/50 cursor-not-allowed">
                        LinkedIn
                      </span>
                    }
                  >
                    <a
                      href={contact.linkedinurl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
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
                    onClick={() => setOutreachTarget({ contact, companyDisplayName, companyInfo })}
                    className="text-xs px-2 py-0.5 rounded border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                  >
                    Outreach
                  </button>
                </ContactInfoGate>
              </div>
            </div>
          );
        })}
      </div>

      {outreachTarget && (
        <IntegratedOutreachModal
          jobData={{
            company: outreachTarget.companyDisplayName,
            company_info: outreachTarget.companyInfo,
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
