"use client";

import { DEMO_CONTACT } from './demoData';

interface Props {
  onGenerateClick: () => void;
}

export default function MockContactCard({ onGenerateClick }: Props) {
  return (
    <div
      data-tour="tour-mock-card"
      className="rounded-2xl border border-white/10 bg-[#11121b] shadow-2xl p-5 flex flex-col gap-4"
      style={{ width: 340, pointerEvents: 'auto' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 font-semibold text-base"
          style={{
            background: 'rgba(5,32,74,.20)',
            color: 'var(--lavender-web)',
            border: '1px solid var(--oxford-blue)',
          }}
        >
          MC
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white text-sm truncate">{DEMO_CONTACT.company}</div>
          <div className="text-xs text-neutral-400 mt-0.5 truncate">{DEMO_CONTACT.name}</div>
          <div className="mt-1.5 flex gap-1 flex-wrap">
            {DEMO_CONTACT.role.split(',').slice(0, 1).map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  border: '1px solid rgba(180,151,214,.3)',
                  background: 'rgba(180,151,214,.12)',
                  color: 'var(--wisteria)',
                }}
              >
                {r.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Company info */}
      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
        {DEMO_CONTACT.company_info}
      </p>

      {/* Looking for tags */}
      <div className="flex flex-wrap gap-1">
        {DEMO_CONTACT.looking_for.split(',').map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] leading-tight"
            style={{
              border: '1px solid rgba(255,255,255,.1)',
              background: 'rgba(255,255,255,.05)',
              color: '#aaa',
            }}
          >
            {t.trim()}
          </span>
        ))}
      </div>

      {/* Demo badge */}
      <div
        className="rounded-lg px-2 py-1 text-[10px] text-center font-medium"
        style={{ background: 'rgba(180,151,214,.08)', color: 'var(--wisteria)', border: '1px solid rgba(180,151,214,.15)' }}
      >
        Demo contact — for illustration only
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          data-tour="tour-mock-generate"
          onClick={onGenerateClick}
          className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(90deg,#b497d6,#e1e2ef)', color: '#0f1018' }}
        >
          Generate Outreach
        </button>
      </div>
    </div>
  );
}
