'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, CheckCircle, Sparkles, BarChart3 } from 'lucide-react';

interface Benefit {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const benefits: Benefit[] = [
  {
    icon: Search,
    title: "Searchable Founder Directory",
    description: "Browse 500+ verified early-stage founders with advanced filters. Search by industry, funding stage, location, and tech stack to find perfect matches for your goals.",
    color: "#b497d6"
  },
  {
    icon: CheckCircle,
    title: "Verified Contact Information",
    description: "Get direct access to verified email addresses and LinkedIn profiles. No more guessing at email formats or hunting through profiles. Everything's accurate and ready to use.",
    color: "#e1e2ef"
  },
  {
    icon: Sparkles,
    title: "AI-Powered Outreach",
    description: "Generate personalized outreach messages in seconds. Our AI analyzes your background and the founder's profile to create authentic, human-sounding messages that get responses.",
    color: "#b497d6"
  },
  {
    icon: BarChart3,
    title: "Visual CRM Tracking",
    description: "Track all your conversations on an intuitive kanban board. Drag and drop contacts through stages, add notes, and never lose track of important relationships.",
    color: "#e1e2ef"
  }
];

export default function Benefits() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-7xl px-4 py-12 sm:py-20"
      aria-labelledby="benefits-heading"
    >
      <div className="mb-6">
        <h2 id="benefits-heading" className="text-xl sm:text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
          Everything You Need to Connect
        </h2>
      </div>

      {/* Benefits Grid - 2x2 on Desktop */}
      <div className="mt-4 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className={`group rounded-2xl border border-white/10 bg-[#11121b] p-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${benefit.color}22, ${benefit.color}11)`,
                    border: `1px solid ${benefit.color}33`
                  }}
                >
                  <Icon
                    className="w-8 h-8"
                    style={{ color: benefit.color }}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>

                {/* Title */}
                <h3 className="font-display text-2xl text-white mb-4 group-hover:text-[var(--wisteria)] transition-colors">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-neutral-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
      </div>
    </section>
  );
}
