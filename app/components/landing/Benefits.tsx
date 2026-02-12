'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, CheckCircle, Sparkles, BarChart3 } from 'lucide-react';

interface Step {
  icon: React.ElementType;
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: Search,
    number: '01',
    title: 'Browse the Founder Directory',
    description:
      'Search 500+ verified early-stage founders with advanced filters. Find matches by industry, funding stage, location, and tech stack.',
  },
  {
    icon: CheckCircle,
    number: '02',
    title: 'Get Verified Contact Info',
    description:
      'Access direct email addresses and LinkedIn profiles—no guessing at formats or hunting through profiles. Everything accurate and ready.',
  },
  {
    icon: Sparkles,
    number: '03',
    title: 'Generate AI-Powered Outreach',
    description:
      'Create personalized messages in seconds. Our AI analyzes your background and the founder\'s profile to craft authentic outreach.',
  },
  {
    icon: BarChart3,
    number: '04',
    title: 'Track on Your Kanban Board',
    description:
      'Manage every conversation on an intuitive drag-and-drop board. Move contacts through stages, add notes, never lose track.',
  },
];

export default function Benefits() {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-step-index'));
            if (!isNaN(index)) {
              setVisibleSteps((prev) => new Set(prev).add(index));
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-6xl px-4 py-16 sm:py-24"
      aria-labelledby="benefits-heading"
    >
      {/* Section heading */}
      <div className="text-center mb-16">
        <h2
          id="benefits-heading"
          className="font-display text-3xl sm:text-4xl text-white"
          style={{ lineHeight: '1.15', letterSpacing: '-0.02em' }}
        >
          How Founder Flow Works
        </h2>
        <p className="mt-4 text-neutral-400 max-w-xl mx-auto text-base">
          Four steps from discovery to meaningful connection.
        </p>
      </div>

      {/* Step flow with timeline */}
      <div className="step-timeline relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isEven = index % 2 === 0;
          const isVisible = visibleSteps.has(index);
          const animClass = isVisible
            ? isEven
              ? 'animate-fade-in-left'
              : 'animate-fade-in-right'
            : 'opacity-0';

          return (
            <div
              key={index}
              ref={(el) => { stepRefs.current[index] = el; }}
              data-step-index={index}
              className={`relative mb-12 last:mb-0 lg:grid lg:grid-cols-2 lg:gap-12 ${animClass}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Timeline dot */}
              <div className="hidden lg:block absolute left-1/2 top-6 -translate-x-1/2 z-10">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    borderColor: 'var(--wisteria)',
                    background: '#0c0d16',
                    boxShadow: '0 0 12px rgba(180, 151, 214, 0.4)',
                  }}
                />
              </div>

              {/* Mobile timeline dot */}
              <div className="lg:hidden absolute left-[24px] top-6 -translate-x-1/2 z-10">
                <div
                  className="w-3 h-3 rounded-full border-2"
                  style={{
                    borderColor: 'var(--wisteria)',
                    background: '#0c0d16',
                  }}
                />
              </div>

              {/* Card - alternating sides on desktop */}
              <div
                className={`lg:col-span-1 ${
                  isEven ? 'lg:col-start-1' : 'lg:col-start-2'
                } ml-10 lg:ml-0`}
              >
                <div
                  className="relative glass-card p-6 sm:p-8 rounded-xl group"
                  style={{
                    borderLeft: `3px solid ${
                      index % 2 === 0
                        ? 'var(--wisteria)'
                        : 'var(--lavender-web)'
                    }`,
                  }}
                >
                  {/* Watermark number */}
                  <span className="step-watermark right-4 sm:right-6">
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(180,151,214,0.15), rgba(180,151,214,0.05))',
                      border: '1px solid rgba(180,151,214,0.25)',
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: 'var(--wisteria)' }}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-2xl text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-neutral-400 leading-relaxed text-base">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Empty spacer for alternating layout */}
              {isEven ? (
                <div className="hidden lg:block lg:col-start-2" />
              ) : (
                <div className="hidden lg:block lg:col-start-1 lg:row-start-1" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
