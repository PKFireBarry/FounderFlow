"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { CompanyRecord } from '../../../lib/companies';

interface Props {
  slug: string;
  company: CompanyRecord;
}

export default function CompanyActions({ slug, company }: Props) {
  const { isSignedIn } = useUser();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ savedCount: number; skippedCount: number } | null>(null);
  const [error, setError] = useState('');

  const saveAll = async () => {
    if (!isSignedIn) return;
    setSaving(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/companies/${slug}/save-all`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save');
      setResult({ savedCount: data.savedCount, skippedCount: data.skippedCount });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (!isSignedIn) return null;

  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <button
        onClick={saveAll}
        disabled={saving}
        className="btn btn-ghost btn-sm flex items-center gap-1.5"
      >
        {saving ? (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )}
        Save all {company.roleCount}
      </button>

      {result && (
        <span className="text-xs font-medium" style={{ color: 'rgba(74,222,128,.8)' }}>
          ✓ {result.savedCount} saved{result.skippedCount > 0 ? `, ${result.skippedCount} skipped` : ''}
        </span>
      )}
      {error && (
        <span className="text-xs" style={{ color: 'rgba(248,113,113,.8)' }}>{error}</span>
      )}
    </div>
  );
}
