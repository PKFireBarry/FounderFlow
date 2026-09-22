'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Navigation from '../../components/Navigation';

interface RemovalRequestItem {
  id: string;
  submittedValue: string;
  matchedField: 'email' | 'linkedinurl' | null;
  entryId: string | null;
  entrySummary?: { name: string; company: string };
  name?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export default function RemovalRequestsPage() {
  const { isLoaded, userId } = useAuth();
  const [requests, setRequests] = useState<RemovalRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/removal-requests?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests);
      } else {
        setError(data.error || 'Failed to load requests');
      }
    } catch {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isLoaded && userId) load();
  }, [isLoaded, userId, load]);

  async function resolve(requestId: string, action: 'approve' | 'reject') {
    setActingOn(requestId);
    try {
      const res = await fetch('/api/admin/removal-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await load();
      } else {
        setError(data.error || `Failed to ${action} request`);
      }
    } catch {
      setError(`Failed to ${action} request`);
    } finally {
      setActingOn(null);
    }
  }

  if (!isLoaded) return <div className="p-8 text-white">Loading...</div>;

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
        <p>You must be signed in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-neutral-300">
      <Navigation />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Data Removal Requests</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'pending' | 'all')}
            className="rounded-lg border border-white/10 bg-[#141522] px-3 py-1.5 text-sm text-white"
          >
            <option value="pending">Pending only</option>
            <option value="all">All requests</option>
          </select>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-neutral-500">No {statusFilter === 'pending' ? 'pending' : ''} requests.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-white/10 bg-[#11121b] p-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white break-all">{r.submittedValue}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Matched: {r.matchedField ? `${r.matchedField}${r.entryId ? ` → entry ${r.entryId}` : ''}` : 'no matching entry found'}
                    </div>
                    {r.entrySummary && (
                      <div className="mt-1 text-xs text-neutral-400">
                        {r.entrySummary.name || 'Unknown'} — {r.entrySummary.company || 'Unknown company'}
                      </div>
                    )}
                    {r.name && <div className="mt-1 text-xs text-neutral-400">Submitted by: {r.name}</div>}
                    {r.reason && <div className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">{r.reason}</div>}
                    <div className="mt-2 text-[11px] text-neutral-600">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                      {r.status !== 'pending' && r.reviewedBy && ` · ${r.status} by ${r.reviewedBy}`}
                    </div>
                  </div>
                  {r.status === 'pending' ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => resolve(r.id, 'approve')}
                        disabled={actingOn === r.id}
                        className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        Approve &amp; delete entry
                      </button>
                      <button
                        onClick={() => resolve(r.id, 'reject')}
                        disabled={actingOn === r.id}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/5 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-500/10 text-neutral-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
