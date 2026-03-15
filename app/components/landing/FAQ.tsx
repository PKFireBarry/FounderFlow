'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How is FounderFlow different from LinkedIn?',
    answer:
      'LinkedIn is a network built around connections you already have. FounderFlow is a curated directory of 3,000+ early-stage founders you would never find otherwise, because they are not posting jobs anywhere. We give you their contact info and a way to reach out. LinkedIn does not.',
  },
  {
    question: 'Is the founder directory really free?',
    answer:
      'Yes. Anyone can browse all 3,000+ founders, see company details, and view public application links without paying anything. Pro unlocks verified emails, LinkedIn profiles, and the outreach tools.',
  },
  {
    question: 'How do you verify contact information?',
    answer:
      'We manually research and cross-reference contact details across public sources, LinkedIn, and company websites. We update records regularly and flag anything we cannot confirm. It is not perfect, but it is a lot better than guessing.',
  },
  {
    question: 'Can I use the outreach tools for free?',
    answer:
      'The message builder and Kanban CRM are Pro features. You can start a 7-day free trial with no credit card and use everything before deciding if it is worth three dollars a month.',
  },
  {
    question: "What is included in Pro?",
    answer:
      'Verified email addresses and LinkedIn profiles for every founder, the outreach message builder, and a full Kanban CRM to track your conversations. All of it for $3 per month.',
  },
  {
    question: 'How often is the directory updated?',
    answer:
      'We add new founders and refresh existing records weekly. If you find something outdated, you can flag it and we will fix it.',
  },
  {
    question: 'Can I export my saved contacts?',
    answer:
      'Not yet. Export is on the roadmap. For now, everything lives in your dashboard and Kanban board inside the app.',
  },
  {
    question: 'Is there a limit to how many founders I can save?',
    answer:
      'No limit. Save as many as you want on any plan.',
  },
  {
    question: "Do founders know they are listed?",
    answer:
      'The directory is built from publicly available information, the same kind of research a good recruiter would do manually. Founders are listed based on public company and team data. We do not scrape private sources.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. No contracts, no cancellation fees. Cancel from your account settings and you will not be charged again.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className="mx-auto max-w-6xl px-4 py-16 sm:py-24"
      aria-labelledby="faq-heading"
    >
      {/* Two-column layout: sidebar + accordion */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-16">
        {/* Left column - heading + CTA (40%) */}
        <div className="lg:col-span-2 mb-10 lg:mb-0 lg:sticky lg:top-24 lg:self-start">
          <h2
            id="faq-heading"
            className="font-display text-3xl sm:text-4xl text-white mb-4"
            style={{ lineHeight: '1.15', letterSpacing: '-0.02em' }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-neutral-400 text-base leading-relaxed mb-8">
            Everything you need to know about Founder Flow. Can&apos;t find what
            you&apos;re looking for?
          </p>
          <a
            href="mailto:support@founderflow.space"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: 'var(--wisteria)' }}
          >
            <span>Get in touch</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>

        {/* Right column - accordion (60%) */}
        <div className="lg:col-span-3">
          <div className="divide-y divide-white/8">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="group">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full text-left py-5 flex items-start justify-between gap-4 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="font-display text-lg sm:text-xl text-white group-hover:text-[var(--wisteria)] transition-colors pr-4">
                      {faq.question}
                    </span>
                    <span
                      className={`faq-icon mt-1.5 ${isOpen ? 'open' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  <div
                    id={`faq-answer-${index}`}
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div
                      className="text-neutral-400 leading-relaxed text-base pl-0"
                      style={{
                        borderLeft: isOpen
                          ? '2px solid var(--wisteria)'
                          : '2px solid transparent',
                        paddingLeft: '16px',
                        transition: 'border-color var(--transition-base)',
                      }}
                    >
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
