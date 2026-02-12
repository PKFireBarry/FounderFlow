'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How is Founder Flow different from LinkedIn?",
    answer: "Founder Flow is specifically curated for early-stage founders and seed-stage companies. Unlike LinkedIn, we focus exclusively on pre-Series A startups, providing verified contact information and tools designed for reaching out to founders before they scale. Our AI-powered outreach generator and kanban tracking system are built specifically for this use case."
  },
  {
    question: "Is the founder directory really free?",
    answer: "Yes! The directory with 500+ verified founders is completely free to browse and search. You can save unlimited contacts to your dashboard. We offer a Pro plan ($3/month) that unlocks AI-powered outreach generation, advanced filtering, priority support, and the visual kanban board for tracking your conversations."
  },
  {
    question: "How do you verify contact information?",
    answer: "We verify all founder information through multiple sources including LinkedIn profiles, company websites, public funding announcements, and direct verification. Our team manually reviews each entry to ensure accuracy. If you find outdated information, you can report it and we'll update it within 24 hours."
  },
  {
    question: "Can I use the AI outreach generator for free?",
    answer: "The AI outreach generator is a Pro feature ($3/month). It creates personalized messages based on your resume/profile and the founder's background. Free users can still browse the directory, save contacts, and manually track outreach. We offer a 7-day free trial of Pro features when you sign up."
  },
  {
    question: "What's included in the Pro plan?",
    answer: "Pro ($3/month) includes: unlimited AI-powered outreach message generation, advanced search filters (funding stage, location, tech stack), visual kanban board for tracking conversations, priority support, early access to new features, and export functionality for your saved contacts."
  },
  {
    question: "How often is the founder directory updated?",
    answer: "We add 20-30 new founders every week from fresh funding announcements, startup communities, and manual curation. The directory is continuously updated to ensure you're always discovering the newest early-stage companies. We also remove outdated entries monthly."
  },
  {
    question: "Can I export my saved contacts?",
    answer: "Yes! Pro users can export their saved contacts to CSV format at any time. This includes all contact information, your notes, and outreach status. Free users can view and manage their contacts within the dashboard but don't have export capabilities."
  },
  {
    question: "Is there a limit to how many founders I can save?",
    answer: "No limits! Both free and Pro users can save unlimited founders to their dashboard. The difference is that Pro users get advanced organization features, the kanban board for tracking conversations, and the ability to export their saved contacts."
  },
  {
    question: "Do founders know they're listed in your directory?",
    answer: "Our directory aggregates publicly available information from funding announcements, company websites, and professional networks. All information listed is already public. We're building a feature for founders to claim and enhance their profiles, adding details about what they're looking for in collaborators and team members."
  },
  {
    question: "Can I cancel my Pro subscription anytime?",
    answer: "Absolutely. You can cancel your Pro subscription anytime from the billing page. You'll continue to have Pro access until the end of your billing period, then automatically switch to the free plan. No cancellation fees, no questions asked. Your saved contacts and data remain accessible."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-12 sm:py-20"
      aria-labelledby="faq-heading"
    >
      <div className="mb-2">
        <h2 id="faq-heading" className="text-xl sm:text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
          Frequently Asked Questions
        </h2>
      </div>

      {/* FAQ Accordion */}
      <div className="mt-4 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-white/10 rounded-lg overflow-hidden bg-white/5 transition-all duration-200 hover:border-[var(--wisteria)]/30"
            >
              {/* Question Button */}
              <button
                onClick={() => toggleItem(index)}
                className="w-full text-left px-6 py-6 flex items-center justify-between gap-4 transition-colors hover:text-[var(--wisteria)]"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-display text-lg text-white pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--wisteria)] flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* Answer */}
              <div
                id={`faq-answer-${index}`}
                className={`transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                <div className="px-6 pb-6 text-neutral-400 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

      {/* Contact CTA */}
      <div className="mt-12 text-center">
        <p className="text-neutral-400 mb-4 text-sm">
          Still have questions?
        </p>
        <a
          href="mailto:support@founderflow.space"
          className="inline-flex items-center gap-2 text-[var(--wisteria)] font-semibold hover:text-[var(--lavender-web)] transition-colors text-sm"
        >
          <span>Get in touch with our team</span>
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
    </section>
  );
}
