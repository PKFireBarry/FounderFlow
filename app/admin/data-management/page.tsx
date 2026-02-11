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
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('published');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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

  useEffect(() => { applyFilters(); }, [entries, filterType, searchQuery, sortField, sortDir]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/data-management');
      const data = await response.json();
      if (data.success) {
        setEntries(data.entries);
        setStats(data.stats);
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

    // Filter type
    const isEmpty = (v: string) => !v || v === 'N/A' || v.trim() === '';
    const isInvalid = (v: any) => !v || (typeof v === 'string' && ['n/a', 'na', 'unknown', ''].includes(v.toLowerCase().trim()));

    switch (filterType) {
      case 'no-email': filtered = filtered.filter(e => isEmpty(e.email)); break;
      case 'no-linkedin': filtered = filtered.filter(e => isEmpty(e.linkedinurl)); break;
      case 'no-company-url': filtered = filtered.filter(e => isEmpty(e.company_url)); break;
      case 'invalid-names': filtered = filtered.filter(e => isInvalid(e.name)); break;
      case 'invalid-companies': filtered = filtered.filter(e => isInvalid(e.company)); break;
      case 'invalid-roles': filtered = filtered.filter(e => isInvalid(e.role)); break;
      case 'incomplete':
        filtered = filtered.filter(e => {
          return (isEmpty(e.email) && isEmpty(e.linkedinurl) && isEmpty(e.company_url)) || isInvalid(e.name) || isInvalid(e.company) || isInvalid(e.role);
        });
        break;
      case 'duplicates': {
        const combos: Record<string, string[]> = {};
        entries.forEach(e => {
          const key = `${(e.name || '').toLowerCase().trim()}|||${(e.company || '').toLowerCase().trim()}`;
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
      let aVal = (a[sortField] || '').toLowerCase();
      let bVal = (b[sortField] || '').toLowerCase();
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

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="bg-[#11121b] rounded-xl border border-white/10 p-6">
          {/* Header */}
          <div className="border-b border-white/10 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Data Management</h1>
              <p className="text-neutral-400 mt-1 text-sm">Edit, create, filter, export, and clean up your founder data.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Entry
              </button>
              <button onClick={exportCSV} disabled={filteredEntries.length === 0} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
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
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
              {[
                { label: 'Total', value: stats.total, color: 'blue' },
                { label: 'No Email', value: stats.withoutEmail, color: 'orange' },
                { label: 'No LinkedIn', value: stats.withoutLinkedIn, color: 'purple' },
                { label: 'No Website', value: stats.withoutCompanyUrl, color: 'green' },
                { label: 'Bad Names', value: stats.invalidNames, color: 'red' },
                { label: 'Bad Companies', value: stats.invalidCompanies, color: 'yellow' },
                { label: 'Bad Roles', value: stats.invalidRoles, color: 'pink' },
              ].map(s => (
                <div key={s.label} className={`bg-${s.color}-500/20 border border-${s.color}-500/30 rounded-lg p-3`}>
                  <div className={`font-semibold text-${s.color}-200 text-xs`}>{s.label}</div>
                  <div className={`text-xl font-bold text-${s.color}-100`}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <input
              type="text"
              placeholder="Search name, company, role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] bg-[#18192a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
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
              <option value="duplicates">🔁 Duplicates</option>
            </select>
          </div>

          {/* Sort Buttons + Selection Controls */}
          <div className="flex flex-wrap gap-3 items-center mb-6 text-sm">
            {/* Sort */}
            <div className="flex items-center gap-1 mr-4">
              <span className="text-neutral-500 text-xs mr-1">Sort:</span>
              {(['name', 'company', 'published'] as SortField[]).map(f => (
                <button key={f} onClick={() => toggleSort(f)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${sortField === f ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}<SortIcon field={f} />
                </button>
              ))}
            </div>

            {/* Selection */}
            <span className="text-neutral-400 text-xs">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filteredEntries.length} entries`}
            </span>
            <button onClick={selectAll} disabled={filteredEntries.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-xs">
              Select All
            </button>
            <button onClick={clearSelection} disabled={selectedIds.size === 0} className="bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-xs">
              Clear
            </button>
            <button onClick={deleteSelected} disabled={deleting || selectedIds.size === 0} className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-xs">
              {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
            </button>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center text-neutral-300">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                Loading entries...
              </div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-base font-semibold mb-1">No entries found</h3>
              <p className="text-sm">No entries match the current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-3 py-2.5 text-left w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredEntries.length && filteredEntries.length > 0}
                        onChange={() => selectedIds.size === filteredEntries.length ? clearSelection() : selectAll()}
                        className="rounded"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Company</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Contact</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider hidden md:table-cell">Role</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider hidden lg:table-cell">Links</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-wider hidden xl:table-cell">Published</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-neutral-400 uppercase tracking-wider w-16">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(entry => {
                    const domain = getDomain(entry.company_url || entry.url);
                    const hasLinkedIn = entry.linkedinurl && entry.linkedinurl !== 'N/A' && entry.linkedinurl.trim();
                    const hasEmail = entry.email && entry.email !== 'N/A' && entry.email.trim() && entry.email.includes('@');
                    const hasWebsite = entry.company_url && entry.company_url !== 'N/A' && isValidActionableUrl(entry.company_url, { context: 'company_url' });

                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-white/5 transition-colors hover:bg-white/[0.03] ${selectedIds.has(entry.id) ? 'bg-blue-500/5' : ''}`}
                      >
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={selectedIds.has(entry.id)} onChange={() => toggleSelect(entry.id)} className="rounded" />
                        </td>

                        {/* Company */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-neutral-800 flex items-center justify-center overflow-hidden">
                              {domain ? (
                                <img src={`https://icons.duckduckgo.com/ip3/${domain}.ico`} alt="" className="w-5 h-5 rounded-sm" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                <span className="text-neutral-500 text-[10px] font-bold">{(entry.company || '??').slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-white truncate max-w-[180px]">
                                {entry.company || <span className="text-red-400 italic text-xs">Unknown</span>}
                              </div>
                              {entry.company_info && (
                                <div className="text-[11px] text-neutral-500 truncate max-w-[180px]">{entry.company_info}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Name */}
                        <td className="px-3 py-2.5">
                          <span className="text-white text-sm">{entry.name || <span className="text-red-400 italic text-xs">Unknown</span>}</span>
                        </td>

                        {/* Role */}
                        <td className="px-3 py-2.5 hidden md:table-cell">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20 max-w-[140px] truncate">
                            {(entry.role || 'Founder').split(',')[0].trim()}
                          </span>
                        </td>

                        {/* Links */}
                        <td className="px-3 py-2.5 hidden lg:table-cell">
                          <div className="flex gap-1">
                            {hasLinkedIn ? (
                              <a href={entry.linkedinurl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors" title="LinkedIn">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-blue-400"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" /></svg>
                              </a>
                            ) : (
                              <span className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center" title="No LinkedIn"><span className="text-red-400 text-[9px]">LI</span></span>
                            )}
                            {hasEmail ? (
                              <a href={`mailto:${entry.email}`} className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center hover:bg-green-500/30 transition-colors" title={entry.email}>
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-green-400"><path d="M2 6l10 7 10-7v12H2z" opacity=".5" /><path d="M22 6l-10 7L2 6h20z" /></svg>
                              </a>
                            ) : (
                              <span className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center" title="No email"><span className="text-red-400 text-[9px]">@</span></span>
                            )}
                            {hasWebsite ? (
                              <a href={entry.company_url.startsWith('http') ? entry.company_url : `https://${entry.company_url}`} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded bg-neutral-500/20 flex items-center justify-center hover:bg-neutral-500/30 transition-colors" title="Website">
                                <svg className="h-3 w-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                              </a>
                            ) : (
                              <span className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center" title="No website"><span className="text-red-400 text-[9px]">🌐</span></span>
                            )}
                          </div>
                        </td>

                        {/* Published */}
                        <td className="px-3 py-2.5 hidden xl:table-cell">
                          <span className="text-neutral-400 text-xs">{entry.published || 'Unknown'}</span>
                        </td>

                        {/* Edit button */}
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => openEdit(entry)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors ml-auto"
                            title="Edit entry"
                          >
                            <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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