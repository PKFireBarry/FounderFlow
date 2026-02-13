'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Navigation from '../../components/Navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Trial {
    id: string; // This is the token
    durationDays: number;
    createdAt: string;
    linkExpiresAt: string;
    redeemedBy: string | null;
    redeemedAt: string | null;
    note: string | null;
    createdVia: string | null;
    redeemedEmail?: string;
    redeemedName?: string;
    redeemedImageUrl?: string;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function TrialLinksPage() {
    const { isLoaded, userId } = useAuth();
    const [trials, setTrials] = useState<Trial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters & Pagination State
    const [filter, setFilter] = useState('all'); // 'all', 'redeemed', 'available', 'expired'
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationData | null>(null);

    useEffect(() => {
        async function fetchTrials() {
            setLoading(true);
            setError('');
            try {
                const queryParams = new URLSearchParams({
                    page: page.toString(),
                    limit: '20', // Show 20 per page
                    status: filter,
                });

                const response = await fetch(`/api/admin/trials?${queryParams.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch trials');
                const data = await response.json();
                setTrials(data.trials);
                setPagination(data.pagination);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            // Debounce slightly or just run
            fetchTrials();
        }
    }, [userId, page, filter]);

    // Reset page when filter changes
    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setPage(1);
    };

    if (!isLoaded) return <div className="p-8">Loading...</div>;

    if (!userId) {
        return (
            <div className="min-h-screen bg-[#0f1015]">
                <Navigation />
                <div className="p-8">
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-white">
                        <h2 className="font-semibold">Access Denied</h2>
                        <p className="text-red-300">Please sign in to access admin features.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1015]">
            <Navigation />

            <div className="mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Dashboard
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-white">Trial Links</h1>
                        <p className="text-neutral-400 mt-2">
                            Monitor and manage trial links generated for users.
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 bg-[#11121b] border border-white/10 rounded-lg p-1">
                        {['all', 'available', 'redeemed', 'expired'].map((f) => (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${filter === f
                                        ? 'bg-pink-500/20 text-pink-300 shadow-sm'
                                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <svg className="animate-spin h-8 w-8 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
                        Error: {error}
                    </div>
                ) : (
                    <div className="bg-[#11121b] border border-white/5 rounded-xl overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-neutral-400">
                                <thead className="bg-white/5 text-neutral-200 uppercase font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Token / Note</th>
                                        <th className="px-6 py-4">Created</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Expires</th>
                                        <th className="px-6 py-4">Redeemed By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {trials.map((trial) => {
                                        const isExpired = new Date(trial.linkExpiresAt) < new Date();
                                        const isRedeemed = !!trial.redeemedBy;
                                        let statusColor = 'bg-green-500/10 text-green-400 border-green-500/20';
                                        let statusText = 'Available';

                                        if (isRedeemed) {
                                            statusColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                                            statusText = 'Redeemed';
                                        } else if (isExpired) {
                                            statusColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                                            statusText = 'Expired';
                                        }

                                        return (
                                            <tr key={trial.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-mono text-white mb-1 truncate max-w-[150px]" title={trial.id}>
                                                        {trial.id}
                                                    </div>
                                                    {trial.note && (
                                                        <div className="text-xs text-neutral-500 italic truncate max-w-[200px]">
                                                            {trial.note}
                                                        </div>
                                                    )}
                                                    {trial.createdVia && trial.createdVia !== 'none' && (
                                                        <div className="text-[10px] text-neutral-600 uppercase tracking-wider mt-0.5">
                                                            Via: {trial.createdVia}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {format(new Date(trial.createdAt), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 text-white">
                                                    {trial.durationDays} days
                                                </td>
                                                <td className="px-6 py-4">
                                                    {format(new Date(trial.linkExpiresAt), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {trial.redeemedBy ? (
                                                        <div className="flex items-center gap-3">
                                                            {trial.redeemedImageUrl && (
                                                                <img src={trial.redeemedImageUrl} alt="" className="w-8 h-8 rounded-full bg-neutral-800" />
                                                            )}
                                                            <div>
                                                                <div className="text-white font-medium">{trial.redeemedName || 'Unknown User'}</div>
                                                                <div className="text-xs text-neutral-500">{trial.redeemedEmail || trial.redeemedBy}</div>
                                                                <div className="text-[10px] mt-0.5 text-blue-400/80">
                                                                    {trial.redeemedAt && format(new Date(trial.redeemedAt), 'MMM d, HH:mm')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-neutral-600">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {trials.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                                                No trial links found matching criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="bg-white/5 border-t border-white/5 px-6 py-4 flex items-center justify-between">
                                <div className="text-sm text-neutral-400">
                                    Page <span className="text-white font-medium">{pagination.page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span>
                                    <span className="mx-2 text-neutral-600">|</span>
                                    Total: {pagination.total}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="px-3 py-1.5 rounded-lg border border-white/10 text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-neutral-300"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                        disabled={page >= pagination.totalPages}
                                        className="px-3 py-1.5 rounded-lg border border-white/10 text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-neutral-300"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
