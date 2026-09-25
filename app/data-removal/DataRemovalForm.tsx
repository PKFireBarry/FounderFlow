'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function DataRemovalForm() {
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/data-removal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, name, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ ok: true, message: data.message });
        setIdentifier('');
        setName('');
        setReason('');
      } else {
        setResult({ ok: false, message: data.error || 'Something went wrong. Please try again.' });
      }
    } catch {
      setResult({ ok: false, message: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-neutral-300">
      <Navigation />
      <div className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">Request Data Removal</h1>
        <p className="text-sm leading-relaxed text-neutral-400 mb-10">
          If you appear in the FounderFlow directory — your name, email, or LinkedIn profile is
          shown as a company contact — but you never signed up for FounderFlow, you can ask us to
          remove your information. Fill out the form below and we&apos;ll review your request.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-white mb-1.5">
              Your email or LinkedIn URL, as it appears on FounderFlow <span className="text-neutral-500">(required)</span>
            </label>
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@company.com or linkedin.com/in/yourname"
              className="w-full rounded-lg border border-white/10 bg-[#141522] px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <p className="mt-1.5 text-xs text-neutral-500">
              This helps us find your exact record. It doesn&apos;t need to match perfectly — we&apos;ll follow up if we can&apos;t locate it.
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-1.5">
              Your name <span className="text-neutral-500">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#141522] px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-white mb-1.5">
              Anything else we should know? <span className="text-neutral-500">(optional)</span>
            </label>
            <textarea
              id="reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#141522] px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>

          {result && (
            <p className={`text-sm ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.message}
            </p>
          )}
        </form>

        <p className="mt-10 text-xs text-neutral-500">
          Questions? Contact us at{' '}
          <a href="mailto:info@founderflow.space" className="text-white underline underline-offset-2 hover:text-neutral-200">
            info@founderflow.space
          </a>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
