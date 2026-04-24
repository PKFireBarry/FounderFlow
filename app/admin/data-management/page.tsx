'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import Navigation from '../../components/Navigation';
import { isValidActionableUrl } from '../../../lib/url-validation';

interface EntryItem {
  id: string;
  name: string;
  company: string;
  role: string;
  company_info: string;
  published: string; // ISO date "YYYY-MM-DD" or "Unknown"
  linkedinurl: string;
  email: string;
  company_url: string;
  apply_url: string;
  url: string;
  looking_for: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface FilterStats {
  total: number;
  withoutEmail: number;
  withoutLinkedIn: number;
  withoutCompanyUrl: number;
  invalidNames: number;
  invalidCompanies: number;
  invalidRoles: number;
  missingMultipleCritical: number;
  duplicateCount: number;
}

type SortField = 'name' | 'company' | 'published';
type SortDir = 'asc' | 'desc';
type FilterType =
  | 'all' | 'no-email' | 'no-linkedin' | 'no-company-url'
  | 'invalid-names' | 'invalid-companies' | 'invalid-roles'
  | 'incomplete' | 'missing-critical' | 'duplicates';

const EMPTY_FORM = {
  name: '', company: '', role: '', company_info: '',
  linkedinurl: '', email: '', company_url: '',
  apply_url: '', url: '', looking_for: '', published: '',
};

const isEmpty = (v: string) => !v || v === 'N/A' || v.trim() === '';
const isInvalid = (v: unknown) =>
  !v || (typeof v === 'string' && ['n/a', 'na', 'unknown', ''].includes(v.toLowerCase().trim()));

function missingCriticalCount(e: EntryItem): number {
  let n = 0;
  if (isEmpty(e.email)) n++;
  if (isEmpty(e.linkedinurl)) n++;
  if (isEmpty(e.company_url)) n++;
  if (isInvalid(e.role)) n++;
  return n;
}

function formatDate(iso: string): string {
  if (!iso || iso === 'Unknown') return 'Unknown';
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getDomain(input?: string): string | null {
  if (!input) return null;
  let str = input.trim();
  if (str.toLowerCase().startsWith('mailto:')) return str.slice(7).split('@')[1]?.toLowerCase() || null;
  if (str.includes('@') && !/^https?:\/\//i.test(str)) return str.split('@')[1]?.toLowerCase() || null;
  try {
    if (!/^https?:\/\//i.test(str)) str = `https://${str}`;
    return new URL(str).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return str.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0]?.toLowerCase() || null;
  }
}

export default function DataManagementPage() {
  const { isLoaded, userId } = useAuth();
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [sortField, setSortField] = useState<SortField>('published');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EntryItem | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (isLoaded && userId) loadEntries();
  }, [isLoaded, userId]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/data-management');
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries);
        setError(null);
      } else {
        setError(data.error || 'Failed to load entries');
      }
    } catch {
      setError('Network error loading entries');
    } finally {
      setLoading(false);
    }
  };

  const duplicateIds = useMemo(() => {
    const combos: Record<string, string[]> = {};
    entries.forEach(e => {
      const key = `${(e.name || '').toLowerCase().trim()}|||${(e.company || '').toLowerCase().trim()}`;
      if (key !== '|||') {
        combos[key] = combos[key] || [];
        combos[key].push(e.id);
      }
    });
    return new Set(Object.values(combos).filter(ids => ids.length > 1).flat());
  }, [entries]);

  const stats = useMemo<FilterStats>(() => {
    const s: FilterStats = {
      total: entries.length,
      withoutEmail: 0,
      withoutLinkedIn: 0,
      withoutCompanyUrl: 0,
      invalidNames: 0,
      invalidCompanies: 0,
      invalidRoles: 0,
      missingMultipleCritical: 0,
      duplicateCount: duplicateIds.size,
    };
    entries.forEach(e => {
      if (isEmpty(e.email)) s.withoutEmail++;
      if (isEmpty(e.linkedinurl)) s.withoutLinkedIn++;
      if (isEmpty(e.company_url)) s.withoutCompanyUrl++;
      if (isInvalid(e.name)) s.invalidNames++;
      if (isInvalid(e.company)) s.invalidCompanies++;
      if (isInvalid(e.role)) s.invalidRoles++;
      if (missingCriticalCount(e) >= 2) s.missingMultipleCritical++;
    });
    return s;
  }, [entries, duplicateIds]);

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.name?.toLowerCase().includes(q) ||
        e.company?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q) ||
        e.company_info?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
      );
    }

    if (dateFrom) filtered = filtered.filter(e => e.published && e.published >= dateFrom);
    if (dateTo) filtered = filtered.filter(e => e.published && e.published <= dateTo);

    switch (filterType) {
      case 'no-email': filtered = filtered.filter(e => isEmpty(e.email)); break;
      case 'no-linkedin': filtered = filtered.filter(e => isEmpty(e.linkedinurl)); break;
      case 'no-company-url': filtered = filtered.filter(e => isEmpty(e.company_url)); break;
      case 'invalid-names': filtered = filtered.filter(e => isInvalid(e.name)); break;
      case 'invalid-companies': filtered = filtered.filter(e => isInvalid(e.company)); break;
      case 'invalid-roles': filtered = filtered.filter(e => isInvalid(e.role)); break;
      case 'incomplete':
        filtered = filtered.filter(e =>
          (isEmpty(e.email) && isEmpty(e.linkedinurl) && isEmpty(e.company_url)) ||
          isInvalid(e.name) || isInvalid(e.company) || isInvalid(e.role)
        );
        break;
      case 'missing-critical':
        filtered = filtered.filter(e => missingCriticalCount(e) >= 2);
        break;
      case 'duplicates':
        filtered = filtered.filter(e => duplicateIds.has(e.id));
        filtered.sort((a, b) => {
          const ka = `${(a.name || '').toLowerCase()}|||${(a.company || '').toLowerCase()}`;
          const kb = `${(b.name || '').toLowerCase()}|||${(b.company || '').toLowerCase()}`;
          return ka.localeCompare(kb);
        });
        return filtered;
    }

    filtered.sort((a, b) => {
      if (sortField === 'published') {
        const va = a.published && a.published !== 'Unknown' ? a.published : '0000-00-00';
        const vb = b.published && b.published !== 'Unknown' ? b.published : '0000-00-00';
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const av = (a[sortField] || '').toLowerCase();
      const bv = (b[sortField] || '').toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [entries, filterType, searchQuery, sortField, sortDir, dateFrom, dateTo, duplicateIds]);

  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };
  const selectAllFiltered = () => setSelectedIds(new Set(filteredEntries.map(e => e.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected entries? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/data-management', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryIds: Array.from(selectedIds) }),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ type: 'success', text: `Deleted ${result.deletedCount} entries` });
        const deleted = new Set(selectedIds);
        setSelectedIds(new Set());
        setEntries(prev => prev.filter(e => !deleted.has(e.id)));
      } else {
        setToast({ type: 'error', text: result.error || 'Delete failed' });
      }
    } catch (err) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' });
    } finally {
      setDeleting(false);
    }
  };

  const deleteSingle = async (entry: EntryItem) => {
    if (!window.confirm(`Delete "${entry.name || entry.company}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/data-management', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryIds: [entry.id] }),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ type: 'success', text: `Deleted ${entry.name || entry.company}` });
        setEntries(prev => prev.filter(e => e.id !== entry.id));
        if (expandedId === entry.id) setExpandedId(null);
      } else {
        setToast({ type: 'error', text: result.error || 'Delete failed' });
      }
    } catch {
      setToast({ type: 'error', text: 'Delete failed' });
    }
  };

  const openCreate = () => {
    setEditingEntry(null);
    setFormData({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (entry: EntryItem) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name || '',
      company: entry.company || '',
      role: entry.role || '',
      company_info: entry.company_info || '',
      linkedinurl: entry.linkedinurl || '',
      email: entry.email || '',
      company_url: entry.company_url || '',
      apply_url: entry.apply_url || '',
      url: entry.url || '',
      looking_for: entry.looking_for || '',
      published: entry.published && entry.published !== 'Unknown' ? entry.published : '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingEntry) {
        const res = await fetch('/api/admin/data-management', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId: editingEntry.id, updates: formData }),
        });
        const result = await res.json();
        if (result.success) {
          setToast({ type: 'success', text: `Updated ${formData.name || formData.company}` });
          setModalOpen(false);
          setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...e, ...formData } : e));
        } else {
          setToast({ type: 'error', text: result.error || 'Save failed — check console' });
        }
      } else {
        if (!formData.name && !formData.company) {
          setToast({ type: 'error', text: 'Name or company is required' });
          setSaving(false);
          return;
        }
        const res = await fetch('/api/admin/data-management', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (result.success) {
          setToast({ type: 'success', text: `Created entry for ${formData.name || formData.company}` });
          setModalOpen(false);
          await loadEntries();
        } else {
          setToast({ type: 'error', text: result.error || 'Create failed' });
        }
      }
    } catch (err) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = ['name', 'company', 'role', 'email', 'linkedinurl', 'company_url', 'apply_url', 'url', 'company_info', 'looking_for', 'published'];
    const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const rows = filteredEntries.map(e => headers.map(h => esc(e[h] || '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `founderflow-${filterType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', text: `Exported ${filteredEntries.length} entries` });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-[10px]">
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  if (!isLoaded) return <div className="p-8 text-white">Loading...</div>;

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

  const STAT_CARDS = [
    { label: 'Total', value: stats.total, color: 'blue', filter: 'all' as FilterType },
    { label: 'No Email', value: stats.withoutEmail, color: 'orange', filter: 'no-email' as FilterType },
    { label: 'No LinkedIn', value: stats.withoutLinkedIn, color: 'purple', filter: 'no-linkedin' as FilterType },
    { label: 'No Website', value: stats.withoutCompanyUrl, color: 'green', filter: 'no-company-url' as FilterType },
    { label: 'Bad Names', value: stats.invalidNames, color: 'red', filter: 'invalid-names' as FilterType },
    { label: 'Bad Cos', value: stats.invalidCompanies, color: 'yellow', filter: 'invalid-companies' as FilterType },
    { label: 'Bad Roles', value: stats.invalidRoles, color: 'pink', filter: 'invalid-roles' as FilterType },
    { label: 'Missing 2+', value: stats.missingMultipleCritical, color: 'rose', filter: 'missing-critical' as FilterType },
    { label: 'Dupes', value: stats.duplicateCount, color: 'amber', filter: 'duplicates' as FilterType },
  ];

  return (
    <div className="min-h-screen bg-[#0f1015]">
      <Navigation />

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="bg-[#11121b] rounded-xl border border-white/10 p-6">

          {/* Header */}
          <div className="border-b border-white/10 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Data Management</h1>
              <p className="text-neutral-400 mt-1 text-sm">
                {loading ? 'Loading all entries...' : `${entries.length.toLocaleString()} total entries`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Entry
              </button>
              <button
                onClick={exportCSV}
                disabled={filteredEntries.length === 0}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium flex items-center justify-between ${toast.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
              <span>{toast.text}</span>
              <button onClick={() => setToast(null)} className="ml-4 opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300 font-medium">{error}</p>
            </div>
          )}

          {/* Stats Cards — clickable shortcuts */}
          {!loading && entries.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-6">
              {STAT_CARDS.map(s => (
                <button
                  key={s.label}
                  onClick={() => setFilterType(s.filter)}
                  className={`text-left rounded-lg p-2.5 transition-all border ${
                    filterType === s.filter
                      ? `bg-${s.color}-500/25 border-${s.color}-500/50 ring-1 ring-${s.color}-500/30`
                      : `bg-${s.color}-500/10 border-${s.color}-500/20 hover:bg-${s.color}-500/20`
                  }`}
                >
                  <div className={`font-medium text-${s.color}-300 text-[10px] leading-tight`}>{s.label}</div>
                  <div className={`text-lg font-bold text-${s.color}-100 mt-0.5`}>{s.value.toLocaleString()}</div>
                </button>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center mb-3">
            <input
              type="text"
              placeholder="Search name, company, role, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as FilterType)}
              className="bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
            >
              <option value="all">All Entries</option>
              <option value="no-email">Missing Email</option>
              <option value="no-linkedin">Missing LinkedIn</option>
              <option value="no-company-url">Missing Company URL</option>
              <option value="invalid-names">Invalid Names</option>
              <option value="invalid-companies">Invalid Companies</option>
              <option value="invalid-roles">Invalid Roles</option>
              <option value="incomplete">Incomplete / Junk</option>
              <option value="missing-critical">Missing 2+ Critical Fields</option>
              <option value="duplicates">Duplicates (by name+company)</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex flex-wrap gap-3 items-center mb-4 text-sm">
            <span className="text-neutral-500 text-xs">Published:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-[#18192a] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-white/30 [color-scheme:dark]"
            />
            <span className="text-neutral-500 text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-[#18192a] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-white/30 [color-scheme:dark]"
            />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-neutral-400 hover:text-white underline">
                Clear dates
              </button>
            )}
          </div>

          {/* Sort + bulk controls */}
          <div className="flex flex-wrap gap-3 items-center mb-5">
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-xs mr-1">Sort:</span>
              {(['name', 'company', 'published'] as SortField[]).map(f => (
                <button
                  key={f}
                  onClick={() => toggleSort(f)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${sortField === f ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}<SortIcon field={f} />
                </button>
              ))}
            </div>
            <span className="text-neutral-400 text-xs">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filteredEntries.length.toLocaleString()} shown`}
            </span>
            <button
              onClick={selectAllFiltered}
              disabled={filteredEntries.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-xs"
            >
              Select All Filtered
            </button>
            <button
              onClick={clearSelection}
              disabled={selectedIds.size === 0}
              className="bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-xs"
            >
              Clear
            </button>
            <button
              onClick={deleteSelected}
              disabled={deleting || selectedIds.size === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-xs"
            >
              {deleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center text-neutral-300">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                Loading all entries from database...
              </div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-base font-semibold mb-1">No entries found</h3>
              <p className="text-sm">No entries match the current filter.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-3 py-2.5 text-left w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredEntries.length && filteredEntries.length > 0}
                        onChange={() => selectedIds.size === filteredEntries.length ? clearSelection() : selectAllFiltered()}
                        className="rounded"
                      />
                    </th>
                    <th className="px-1 py-2.5 w-6" />
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => toggleSort('name')}
                    >
                      Name <SortIcon field="name" />
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => toggleSort('company')}
                    >
                      Company <SortIcon field="company" />
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider hidden md:table-cell">Role</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider hidden lg:table-cell">Links</th>
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider hidden xl:table-cell cursor-pointer hover:text-white"
                      onClick={() => toggleSort('published')}
                    >
                      Published <SortIcon field="published" />
                    </th>
                    <th className="px-2 py-2.5 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, idx) => {
                    const isExpanded = expandedId === entry.id;
                    const isSelected = selectedIds.has(entry.id);
                    const domain = getDomain(entry.company_url || entry.url);
                    const hasLinkedIn = !isEmpty(entry.linkedinurl);
                    const hasEmail = !isEmpty(entry.email) && entry.email.includes('@');
                    const hasWebsite = !isEmpty(entry.company_url) && isValidActionableUrl(entry.company_url, { context: 'company_url' });
                    const critMissing = missingCriticalCount(entry);

                    const isDupeGroupStart = filterType === 'duplicates' && idx > 0 && (
                      `${(entry.name || '').toLowerCase()}|||${(entry.company || '').toLowerCase()}` !==
                      `${(filteredEntries[idx - 1].name || '').toLowerCase()}|||${(filteredEntries[idx - 1].company || '').toLowerCase()}`
                    );

                    return (
                      <React.Fragment key={entry.id}>
                        <tr className={`border-b border-white/5 transition-colors ${isDupeGroupStart ? 'border-t-2 border-yellow-500/20' : ''} ${isExpanded ? 'bg-white/[0.05]' : isSelected ? 'bg-blue-500/5' : 'hover:bg-white/[0.02]'}`}>
                          <td className="px-3 py-2.5">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(entry.id)} className="rounded" />
                          </td>
                          <td className="px-1 py-2.5">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-300 transition-colors"
                            >
                              <svg className={`w-3 h-3 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 h-7 w-7 rounded-md bg-neutral-800 flex items-center justify-center overflow-hidden">
                                {domain ? (
                                  <img
                                    src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
                                    alt=""
                                    className="w-4 h-4 rounded-sm"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <span className="text-neutral-500 text-[9px] font-bold">{(entry.company || '?').slice(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <span className={`font-medium text-sm ${isInvalid(entry.name) ? 'text-red-400 italic text-xs' : 'text-white'}`}>
                                {entry.name || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-sm ${isInvalid(entry.company) ? 'text-red-400 italic text-xs' : 'text-neutral-200'}`}>
                              {entry.company || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 hidden md:table-cell">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold border max-w-[140px] truncate ${isInvalid(entry.role) ? 'bg-red-500/10 text-red-300 border-red-500/20' : 'bg-purple-500/15 text-purple-300 border-purple-500/20'}`}>
                              {(entry.role || 'Founder').split(',')[0].trim()}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 hidden lg:table-cell">
                            <div className="flex gap-1 items-center">
                              {hasLinkedIn ? (
                                <a href={entry.linkedinurl} target="_blank" rel="noopener noreferrer" className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors" title="LinkedIn">
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5 text-blue-400"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" /></svg>
                                </a>
                              ) : (
                                <span className="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center" title="No LinkedIn"><span className="text-red-400 text-[8px]">LI</span></span>
                              )}
                              {hasEmail ? (
                                <a href={`mailto:${entry.email}`} className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center hover:bg-green-500/30 transition-colors" title={entry.email}>
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5 text-green-400"><path d="M2 6l10 7 10-7v12H2z" opacity=".5" /><path d="M22 6l-10 7L2 6h20z" /></svg>
                                </a>
                              ) : (
                                <span className="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center" title="No email"><span className="text-red-400 text-[8px]">@</span></span>
                              )}
                              {hasWebsite ? (
                                <a href={entry.company_url.startsWith('http') ? entry.company_url : `https://${entry.company_url}`} target="_blank" rel="noopener noreferrer" className="w-5 h-5 rounded bg-neutral-500/20 flex items-center justify-center hover:bg-neutral-500/30 transition-colors" title="Website">
                                  <svg className="h-2.5 w-2.5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                                </a>
                              ) : (
                                <span className="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center" title="No website"><span className="text-red-400 text-[8px]">W</span></span>
                              )}
                              {critMissing >= 2 && (
                                <span className="text-[10px] text-orange-400 font-bold ml-0.5" title={`Missing ${critMissing}/4 critical fields`}>
                                  -{critMissing}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 hidden xl:table-cell">
                            <span className="text-neutral-400 text-xs">{formatDate(entry.published)}</span>
                          </td>
                          <td className="px-2 py-2.5">
                            <button
                              onClick={() => deleteSingle(entry)}
                              className="w-6 h-6 rounded flex items-center justify-center text-neutral-700 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete entry"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        </tr>

                        {/* Expanded detail panel */}
                        {isExpanded && (
                          <tr className="border-b border-white/5 bg-[#0d0e18]">
                            <td colSpan={8} className="px-6 py-5">
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 mb-4 text-xs">
                                {[
                                  { label: 'Email', value: entry.email, href: entry.email && entry.email.includes('@') ? `mailto:${entry.email}` : undefined },
                                  { label: 'LinkedIn', value: entry.linkedinurl, href: entry.linkedinurl || undefined },
                                  { label: 'Company URL', value: entry.company_url, href: entry.company_url ? (entry.company_url.startsWith('http') ? entry.company_url : `https://${entry.company_url}`) : undefined },
                                  { label: 'Apply URL', value: entry.apply_url, href: entry.apply_url ? (entry.apply_url.startsWith('http') ? entry.apply_url : `https://${entry.apply_url}`) : undefined },
                                  { label: 'Roles Page URL', value: entry.url, href: entry.url ? (entry.url.startsWith('http') ? entry.url : `https://${entry.url}`) : undefined },
                                  { label: 'Published', value: formatDate(entry.published) },
                                  { label: 'Entry ID', value: entry.id },
                                ].map(({ label, value, href }) => (
                                  <div key={label}>
                                    <div className="text-neutral-500 font-medium mb-0.5 uppercase tracking-wider text-[10px]">{label}</div>
                                    {value && href ? (
                                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all">
                                        {value}
                                      </a>
                                    ) : (
                                      <span className={isEmpty(value || '') ? 'text-red-400/60 italic' : 'text-neutral-200 break-all'}>
                                        {value || 'empty'}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {(entry.looking_for || entry.company_info) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs border-t border-white/5 pt-3">
                                  {entry.looking_for && (
                                    <div>
                                      <div className="text-neutral-500 font-medium mb-1 uppercase tracking-wider text-[10px]">Looking For</div>
                                      <div className="text-neutral-200">{entry.looking_for}</div>
                                    </div>
                                  )}
                                  {entry.company_info && (
                                    <div>
                                      <div className="text-neutral-500 font-medium mb-1 uppercase tracking-wider text-[10px]">Company Info</div>
                                      <div className="text-neutral-200 line-clamp-4">{entry.company_info}</div>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => openEdit(entry)}
                                  className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  Edit Entry
                                </button>
                                <button
                                  onClick={() => deleteSingle(entry)}
                                  className="inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl bg-[#11121b] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#11121b] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">
                {editingEntry ? `Edit: ${editingEntry.name || editingEntry.company}` : 'Add New Entry'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Full Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Company</label>
                  <input type="text" value={formData.company} onChange={e => setFormData(f => ({ ...f, company: e.target.value }))} placeholder="Acme Inc." className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Role / Title</label>
                  <input type="text" value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))} placeholder="CEO, CTO..." className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Published Date</label>
                  <input type="date" value={formData.published} onChange={e => setFormData(f => ({ ...f, published: e.target.value }))} className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20 [color-scheme:dark]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="jane@acme.com" className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">LinkedIn URL</label>
                  <input type="url" value={formData.linkedinurl} onChange={e => setFormData(f => ({ ...f, linkedinurl: e.target.value }))} placeholder="https://linkedin.com/in/..." className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Company Website</label>
                  <input type="url" value={formData.company_url} onChange={e => setFormData(f => ({ ...f, company_url: e.target.value }))} placeholder="https://acme.com" className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Apply / Careers URL</label>
                  <input type="url" value={formData.apply_url} onChange={e => setFormData(f => ({ ...f, apply_url: e.target.value }))} placeholder="https://acme.com/careers" className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Roles Page URL</label>
                <input type="url" value={formData.url} onChange={e => setFormData(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Company Description</label>
                <textarea rows={3} value={formData.company_info} onChange={e => setFormData(f => ({ ...f, company_info: e.target.value }))} placeholder="What does the company do?" className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Looking For</label>
                <textarea rows={2} value={formData.looking_for} onChange={e => setFormData(f => ({ ...f, looking_for: e.target.value }))} placeholder="Backend Engineer, Product Manager..." className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20 resize-none" />
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#11121b] border-t border-white/10 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-neutral-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2"
              >
                {saving ? (
                  <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />Saving...</>
                ) : editingEntry ? 'Save Changes' : 'Create Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
