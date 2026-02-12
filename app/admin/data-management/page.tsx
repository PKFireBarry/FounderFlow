'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Navigation from '../../components/Navigation';
import { isValidActionableUrl } from '../../../lib/url-validation';

interface EntryItem {
  id: string;
  name: string;
  company: string;
  role: string;
  company_info: string;
  published: string;
  linkedinurl: string;
  email: string;
  company_url: string;
  apply_url: string;
  url: string;
  looking_for: string;
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
}

type SortField = 'name' | 'company' | 'published';
type SortDir = 'asc' | 'desc';

const EMPTY_FORM: Omit<EntryItem, 'id' | 'published'> = {
  name: '', company: '', role: '', company_info: '',
  linkedinurl: '', email: '', company_url: '',
  apply_url: '', url: '', looking_for: '',
};

export default function DataManagementPage() {
  const { isLoaded, userId } = useAuth();
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<FilterStats | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('published');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Edit/Create modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EntryItem | null>(null); // null = create mode
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (isLoaded && userId) { loadEntries(); }
  }, [isLoaded, userId]);

  useEffect(() => { applyFilters(); setPage(1); }, [entries, filterType, searchQuery, sortField, sortDir]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/data-management');
      const data = await response.json();
      if (data.success) {
        setEntries(data.entries);
        setStats(data.stats);
        setTotalCount(data.totalCount ?? data.entries.length);
        setError(null);
      } else {
        setError(data.error || 'Failed to load entries');
      }
    } catch (err) {
      setError('Network error loading entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...entries];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        (typeof e.name === 'string' && e.name.toLowerCase().includes(q)) ||
        (typeof e.company === 'string' && e.company.toLowerCase().includes(q)) ||
        (typeof e.role === 'string' && e.role.toLowerCase().includes(q)) ||
        (typeof e.company_info === 'string' && e.company_info.toLowerCase().includes(q))
      );
    }

    // Filter type — treat falsy, whitespace-only, and common placeholders as "no value"
    const isEmptyValue = (v: any): boolean => {
      if (!v) return true;
      if (typeof v !== 'string') return true;
      const normalized = v.toLowerCase().trim();
      return normalized === '' || ['n/a', 'na', 'unknown', 'none', '-', '--', 'null', 'undefined'].includes(normalized);
    };

    switch (filterType) {
      case 'no-email': filtered = filtered.filter(e => isEmptyValue(e.email)); break;
      case 'no-linkedin': filtered = filtered.filter(e => isEmptyValue(e.linkedinurl)); break;
      case 'no-company-url': filtered = filtered.filter(e => isEmptyValue(e.company_url)); break;
      case 'invalid-names': filtered = filtered.filter(e => isEmptyValue(e.name)); break;
      case 'invalid-companies': filtered = filtered.filter(e => isEmptyValue(e.company)); break;
      case 'invalid-roles': filtered = filtered.filter(e => isEmptyValue(e.role)); break;
      case 'incomplete':
        filtered = filtered.filter(e => {
          return (isEmptyValue(e.email) && isEmptyValue(e.linkedinurl) && isEmptyValue(e.company_url)) || isEmptyValue(e.name) || isEmptyValue(e.company) || isEmptyValue(e.role);
        });
        break;
      case 'duplicates': {
        const combos: Record<string, string[]> = {};
        entries.forEach(e => {
          const key = `${String(e.name || '').toLowerCase().trim()}|||${String(e.company || '').toLowerCase().trim()}`;
          if (key !== '|||') {
            combos[key] = combos[key] || [];
            combos[key].push(e.id);
          }
        });
        const dupIds = new Set(Object.values(combos).filter(ids => ids.length > 1).flat());
        filtered = filtered.filter(e => dupIds.has(e.id));
        break;
      }
    }

    // Sort
    // Sort
    filtered.sort((a, b) => {
      if (sortField === 'published') {
        // Handle date sorting
        const dateA = a.published ? new Date(a.published).getTime() : 0;
        const dateB = b.published ? new Date(b.published).getTime() : 0;

        // Handle invalid dates (NaN) by treating them as 0 (oldest)
        const valA = isNaN(dateA) ? 0 : dateA;
        const valB = isNaN(dateB) ? 0 : dateB;

        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      // Handle string sorting for other fields
      let aVal = String(a[sortField] || '').toLowerCase();
      let bVal = String(b[sortField] || '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    setFilteredEntries(filtered);
  }, [entries, filterType, searchQuery, sortField, sortDir]);

  // ─── Selection ────────────────────────────────────────
  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };
  const selectAll = () => setSelectedIds(new Set(filteredEntries.map(e => e.id)));
  const clearSelection = () => setSelectedIds(new Set());

  // ─── Delete ───────────────────────────────────────────
  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected entries? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/admin/data-management', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryIds: Array.from(selectedIds) }),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ type: 'success', text: `Deleted ${result.deletedCount} entries` });
        setSelectedIds(new Set());
        await loadEntries();
      } else {
        setError(result.error || 'Delete failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Edit / Create ───────────────────────────────────
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
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingEntry) {
        // Update
        const res = await fetch('/api/admin/data-management', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId: editingEntry.id, updates: formData }),
        });
        const result = await res.json();
        if (result.success) {
          setToast({ type: 'success', text: `Updated ${formData.name || formData.company}` });
          setModalOpen(false);
          await loadEntries();
        } else { setToast({ type: 'error', text: result.error }); }
      } else {
        // Create
        if (!formData.name && !formData.company) {
          setToast({ type: 'error', text: 'Name or company is required' });
          setSaving(false);
          return;
        }
        const res = await fetch('/api/admin/data-management', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (result.success) {
          setToast({ type: 'success', text: `Created entry for ${formData.name || formData.company}` });
          setModalOpen(false);
          await loadEntries();
        } else { setToast({ type: 'error', text: result.error }); }
      }
    } catch (err) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  // ─── CSV Export ───────────────────────────────────────
  const exportCSV = () => {
    const headers = ['name', 'company', 'role', 'email', 'linkedinurl', 'company_url', 'apply_url', 'url', 'company_info', 'looking_for', 'published'];
    const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const rows = filteredEntries.map(e => headers.map(h => escape(e[h] || '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `founderflow-data-${filterType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', text: `Exported ${filteredEntries.length} entries` });
  };

  // ─── Date formatting ─────────────────────────────────
  const formatDate = (isoStr: string): string => {
    if (!isoStr) return 'Unknown';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr; // fallback: show raw string
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ─── Helpers ──────────────────────────────────────────
  const getDomain = (input?: string): string | null => {
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
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
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

  return (
    <div className="min-h-screen bg-[#0f1015]">
      <Navigation />

      <div className="mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        <div className="bg-gradient-to-br from-[#11121b] via-[#11121b] to-[#13141f] rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="border-b border-white/10 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">Data Management</h1>
              <p className="text-neutral-400 mt-2 text-sm">Edit, create, filter, export, and clean up your founder data.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={openCreate} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-green-600/20 hover:scale-105">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Entry
              </button>
              <button onClick={exportCSV} disabled={filteredEntries.length === 0} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-600/20 hover:scale-105 disabled:hover:scale-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium flex items-center justify-between ${toast.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}>
              <span>{toast.text}</span>
              <button onClick={() => setToast(null)} className="ml-4 opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300 font-medium">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (() => {
            const statsData = [
              { label: 'Total Entries', value: totalCount || stats.total, color: 'blue', filter: 'all', icon: '📊' },
              { label: 'No Email', value: stats.withoutEmail, color: 'orange', filter: 'no-email', icon: '📧' },
              { label: 'No LinkedIn', value: stats.withoutLinkedIn, color: 'purple', filter: 'no-linkedin', icon: '💼' },
              { label: 'No Website', value: stats.withoutCompanyUrl, color: 'green', filter: 'no-company-url', icon: '🌐' },
              { label: 'Bad Names', value: stats.invalidNames, color: 'red', filter: 'invalid-names', icon: '👤' },
              { label: 'Bad Companies', value: stats.invalidCompanies, color: 'yellow', filter: 'invalid-companies', icon: '🏢' },
              { label: 'Bad Roles', value: stats.invalidRoles, color: 'pink', filter: 'invalid-roles', icon: '🎯' },
            ];

            const colorClasses: Record<string, { bg: string; border: string; label: string; value: string; hover: string; glow: string }> = {
              blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   label: 'text-blue-300',   value: 'text-blue-100', hover: 'hover:bg-blue-500/20 hover:border-blue-500/50', glow: 'hover:shadow-lg hover:shadow-blue-500/20' },
              orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'text-orange-300', value: 'text-orange-100', hover: 'hover:bg-orange-500/20 hover:border-orange-500/50', glow: 'hover:shadow-lg hover:shadow-orange-500/20' },
              purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'text-purple-300', value: 'text-purple-100', hover: 'hover:bg-purple-500/20 hover:border-purple-500/50', glow: 'hover:shadow-lg hover:shadow-purple-500/20' },
              green:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  label: 'text-green-300',  value: 'text-green-100', hover: 'hover:bg-green-500/20 hover:border-green-500/50', glow: 'hover:shadow-lg hover:shadow-green-500/20' },
              red:    { bg: 'bg-red-500/10',    border: 'border-red-500/30',    label: 'text-red-300',    value: 'text-red-100', hover: 'hover:bg-red-500/20 hover:border-red-500/50', glow: 'hover:shadow-lg hover:shadow-red-500/20' },
              yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'text-yellow-300', value: 'text-yellow-100', hover: 'hover:bg-yellow-500/20 hover:border-yellow-500/50', glow: 'hover:shadow-lg hover:shadow-yellow-500/20' },
              pink:   { bg: 'bg-pink-500/10',   border: 'border-pink-500/30',   label: 'text-pink-300',   value: 'text-pink-100', hover: 'hover:bg-pink-500/20 hover:border-pink-500/50', glow: 'hover:shadow-lg hover:shadow-pink-500/20' },
            };

            return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {statsData.map(s => {
                const c = colorClasses[s.color];
                const isActive = filterType === s.filter;
                return (
                  <button
                    key={s.label}
                    onClick={() => setFilterType(s.filter)}
                    className={`${c.bg} border ${c.border} ${c.hover} ${c.glow} rounded-xl p-4 transition-all duration-200 text-left group cursor-pointer ${isActive ? 'ring-2 ring-white/20 scale-[1.02]' : 'hover:scale-[1.02]'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`font-semibold ${c.label} text-xs uppercase tracking-wide`}>{s.label}</div>
                      <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">{s.icon}</span>
                    </div>
                    <div className={`text-3xl font-bold ${c.value} tabular-nums`}>{s.value.toLocaleString()}</div>
                    {isActive && <div className="mt-2 text-[10px] text-white/60 uppercase tracking-widest">Active Filter</div>}
                  </button>
                );
              })}
            </div>
            );
          })()}

          {/* Search & Filter Toolbar */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[240px] relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search name, company, role..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#18192a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-[#18192a] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
              >
                <option value="all">All Entries</option>
                <option value="no-email">Missing Email</option>
                <option value="no-linkedin">Missing LinkedIn</option>
                <option value="no-company-url">Missing Company URL</option>
                <option value="invalid-names">Invalid Names</option>
                <option value="invalid-companies">Invalid Companies</option>
                <option value="invalid-roles">Invalid Roles</option>
                <option value="incomplete">Incomplete / Junk</option>
                <option value="duplicates">🔁 Duplicates</option>
              </select>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2">
              <span className="text-neutral-400 text-xs font-medium">Sort by:</span>
              <div className="flex items-center gap-1">
                {(['name', 'company', 'published'] as SortField[]).map(f => (
                  <button
                    key={f}
                    onClick={() => toggleSort(f)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${sortField === f ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}<SortIcon field={f} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            {/* Result count */}
            <div className="text-neutral-400 text-sm">
              {totalCount > entries.length
                ? `Showing ${entries.length.toLocaleString()} of ${totalCount.toLocaleString()} entries`
                : `${filteredEntries.length.toLocaleString()} ${filteredEntries.length === 1 ? 'entry' : 'entries'}`}
            </div>
          </div>

          {/* Selection Controls - Contextual (only show when items selected) */}
          {selectedIds.size > 0 && (
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {selectedIds.size} selected
                </div>
                <button
                  onClick={selectAll}
                  disabled={filteredEntries.length === 0}
                  className="text-blue-200 hover:text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select All ({filteredEntries.length})
                </button>
                <button
                  onClick={clearSelection}
                  className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
                >
                  Clear Selection
                </button>
              </div>
              <button
                onClick={deleteSelected}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm inline-flex items-center gap-2 shadow-lg hover:shadow-red-600/30"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete {selectedIds.size} {selectedIds.size === 1 ? 'Entry' : 'Entries'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Data Table */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex flex-col items-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
                  <div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-purple-500/20" />
                </div>
                <p className="mt-4 text-neutral-300 font-medium">Loading entries...</p>
              </div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-24 bg-white/[0.01] rounded-xl border border-white/5">
              <div className="text-6xl mb-4 opacity-30">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2">No entries found</h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">No entries match the current filter. Try adjusting your search or filter settings.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10 shadow-xl">
              {/* Pagination info */}
              {filteredEntries.length > pageSize && (
                <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-white/[0.02] to-white/[0.04] border-b border-white/10">
                  <span className="text-neutral-400 text-sm font-medium">
                    Showing <span className="text-white font-semibold">{((page - 1) * pageSize + 1).toLocaleString()}–{Math.min(page * pageSize, filteredEntries.length).toLocaleString()}</span> of <span className="text-white font-semibold">{filteredEntries.length.toLocaleString()}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 text-sm">Per page:</span>
                    <select
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                      className="bg-[#18192a] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500/50 cursor-pointer"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              )}
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-white/10 bg-gradient-to-r from-[#11121b] to-[#13141f]">
                    <th className="px-4 py-3.5 text-left w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredEntries.length && filteredEntries.length > 0}
                        onChange={() => selectedIds.size === filteredEntries.length ? clearSelection() : selectAll()}
                        className="rounded border-white/20 bg-white/5 checked:bg-purple-600 checked:border-purple-600 focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-neutral-300 uppercase tracking-widest">Company</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-neutral-300 uppercase tracking-widest">Contact</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-neutral-300 uppercase tracking-widest hidden md:table-cell">Role</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-neutral-300 uppercase tracking-widest hidden lg:table-cell">Links</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-neutral-300 uppercase tracking-widest hidden xl:table-cell">Published</th>
                    <th className="px-4 py-3.5 text-right text-[10px] font-bold text-neutral-300 uppercase tracking-widest w-16">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.slice((page - 1) * pageSize, page * pageSize).map((entry, idx) => {
                    const domain = getDomain(entry.company_url || entry.url);
                    const hasLinkedIn = entry.linkedinurl && entry.linkedinurl !== 'N/A' && entry.linkedinurl.trim();
                    const hasEmail = entry.email && entry.email !== 'N/A' && entry.email.trim() && entry.email.includes('@');
                    const hasWebsite = entry.company_url && entry.company_url !== 'N/A' && isValidActionableUrl(entry.company_url, { context: 'company_url' });

                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-white/5 transition-all duration-200 hover:bg-white/[0.04] ${selectedIds.has(entry.id) ? 'bg-purple-500/10 border-purple-500/20' : idx % 2 === 1 ? 'bg-white/[0.01]' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(entry.id)}
                            onChange={() => toggleSelect(entry.id)}
                            className="rounded border-white/20 bg-white/5 checked:bg-purple-600 checked:border-purple-600 focus:ring-2 focus:ring-purple-500/50 cursor-pointer transition-all"
                          />
                        </td>

                        {/* Company */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/5 flex items-center justify-center overflow-hidden shadow-md">
                              {domain ? (
                                <img src={`https://icons.duckduckgo.com/ip3/${domain}.ico`} alt="" className="w-5 h-5 rounded-sm" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                <span className="text-neutral-400 text-xs font-bold">{(entry.company || '??').slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate max-w-[200px] text-[15px]">
                                {entry.company || <span className="text-red-400 italic text-sm font-normal">—</span>}
                              </div>
                              {entry.company_info && (
                                <div className="text-xs text-neutral-400 truncate max-w-[200px] mt-0.5">{entry.company_info}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Name */}
                        <td className="px-4 py-3">
                          <span className="text-white font-medium">{entry.name || <span className="text-neutral-500 italic font-normal">—</span>}</span>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20 max-w-[160px] truncate">
                            {entry.role ? (entry.role.split(',')[0].trim() || 'Founder') : 'Founder'}
                          </span>
                        </td>

                        {/* Links */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex gap-1.5">
                            {hasLinkedIn ? (
                              <a href={entry.linkedinurl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center hover:bg-blue-500/30 hover:border-blue-500/50 transition-all group" title="LinkedIn">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" /></svg>
                              </a>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center" title="No LinkedIn">
                                <svg className="w-3 h-3 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </div>
                            )}
                            {hasEmail ? (
                              <a href={`mailto:${entry.email}`} className="w-7 h-7 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center hover:bg-green-500/30 hover:border-green-500/50 transition-all group" title={entry.email}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5 text-green-400 group-hover:text-green-300"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              </a>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center" title="No email">
                                <svg className="w-3 h-3 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </div>
                            )}
                            {hasWebsite ? (
                              <a href={entry.company_url.startsWith('http') ? entry.company_url : `https://${entry.company_url}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-neutral-500/20 border border-neutral-500/30 flex items-center justify-center hover:bg-neutral-500/30 hover:border-neutral-500/50 transition-all group" title="Website">
                                <svg className="h-3.5 w-3.5 text-neutral-300 group-hover:text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                              </a>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center" title="No website">
                                <svg className="w-3 h-3 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Published */}
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="text-neutral-400 text-xs font-medium">{formatDate(entry.published)}</span>
                        </td>

                        {/* Edit button */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openEdit(entry)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-purple-600/30 hover:border-purple-500/50 border border-white/10 flex items-center justify-center transition-all ml-auto group"
                            title="Edit entry"
                          >
                            <svg className="w-4 h-4 text-neutral-300 group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination controls */}
              {(() => {
                const totalPages = Math.ceil(filteredEntries.length / pageSize);
                if (totalPages <= 1) return null;
                return (
                  <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-white/[0.02] to-white/[0.04] border-t border-white/10">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 text-sm mr-2">Page</span>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (page <= 4) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = page - 3 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold transition-all duration-200 ${
                              page === pageNum
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/30 scale-110'
                                : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white hover:scale-105'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <span className="text-neutral-400 text-sm ml-2">of {totalPages}</span>
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ─── Edit / Create Modal ──────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl bg-[#11121b] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#11121b] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">
                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Row: Name + Company */}
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

              {/* Row: Role */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Role / Title</label>
                <input type="text" value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))} placeholder="CEO, CTO..." className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
              </div>

              {/* Row: Email + LinkedIn */}
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

              {/* Row: Company URL + Apply URL */}
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

              {/* Row: Roles/Careers URL */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Roles Page URL</label>
                <input type="url" value={formData.url} onChange={e => setFormData(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
              </div>

              {/* Company Info */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Company Description</label>
                <textarea rows={2} value={formData.company_info} onChange={e => setFormData(f => ({ ...f, company_info: e.target.value }))} placeholder="What does the company do?" className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20 resize-none" />
              </div>

              {/* Looking For */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Looking For (comma-separated tags)</label>
                <input type="text" value={formData.looking_for} onChange={e => setFormData(f => ({ ...f, looking_for: e.target.value }))} placeholder="Backend Engineer, Product Manager..." className="w-full bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-white/20" />
              </div>
            </div>

            {/* Footer */}
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
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    Saving...
                  </>
                ) : editingEntry ? 'Save Changes' : 'Create Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}