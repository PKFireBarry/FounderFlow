"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CompanyRecord } from '../../lib/companies';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PAGE_SIZE = 60;

interface Props {
  companies: CompanyRecord[];
}

export default function CompanyIndexFilter({ companies }: Props) {
  const [query, setQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = companies;
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(c => c.displayName.toLowerCase().includes(q));
    } else if (activeLetter) {
      list = list.filter(c => c.displayName.toUpperCase().startsWith(activeLetter));
    }
    return list;
  }, [companies, query, activeLetter]);

  const paged = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = filtered.length > paged.length;

  const handleLetter = (l: string) => {
    setActiveLetter(prev => prev === l ? '' : l);
    setQuery('');
    setPage(1);
  };

  return (
    <div>
      {/* Search + A–Z bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: 'rgba(255,255,255,.25)' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search companies…"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveLetter(''); setPage(1); }}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg transition-colors"
            style={{
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.1)',
              color: '#fff',
              outline: 'none',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(180,151,214,.4)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)')}
          />
        </div>
        <div className="flex flex-wrap gap-0.5 items-center">
          {LETTERS.map(l => (
            <button
              key={l}
              onClick={() => handleLetter(l)}
              className="w-7 h-7 text-[11px] font-semibold rounded transition-all"
              style={{
                background: activeLetter === l ? 'rgba(180,151,214,.18)' : 'transparent',
                color: activeLetter === l ? 'rgba(180,151,214,.9)' : 'rgba(255,255,255,.28)',
                border: activeLetter === l ? '1px solid rgba(180,151,214,.3)' : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (activeLetter !== l) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,.65)';
              }}
              onMouseLeave={e => {
                if (activeLetter !== l) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,.28)';
              }}
            >
              {l}
            </button>
          ))}
          {activeLetter && (
            <button
              onClick={() => { setActiveLetter(''); setPage(1); }}
              className="ml-1 text-[11px] px-2 py-1 rounded transition-colors"
              style={{ color: 'rgba(255,255,255,.3)', border: '1px solid rgba(255,255,255,.08)' }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {(query || activeLetter) && (
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,.28)' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {activeLetter ? ` starting with "${activeLetter}"` : ''}
        </p>
      )}

      {paged.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'rgba(255,255,255,.25)' }}>
          <p className="text-sm">No companies found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {paged.map(company => (
            <Link
              key={company.slug}
              href={`/companies/${company.slug}`}
              className="group flex flex-col gap-2 p-3 rounded-xl transition-all"
              style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.07)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.06)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(180,151,214,.22)';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(0,0,0,.3)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.03)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,.07)';
                (e.currentTarget as HTMLAnchorElement).style.transform = '';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '';
              }}
            >
              <div className="flex items-center gap-2">
                {company.domain ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://icons.duckduckgo.com/ip3/${company.domain}.ico`}
                    alt=""
                    width={18}
                    height={18}
                    className="rounded flex-shrink-0"
                    style={{ opacity: 0.85 }}
                  />
                ) : (
                  <div
                    className="w-[18px] h-[18px] rounded flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                    style={{ background: 'rgba(5,32,74,.5)', color: 'var(--lavender-web)', border: '1px solid rgba(5,32,74,.8)' }}
                  >
                    {company.displayName[0]?.toUpperCase()}
                  </div>
                )}
                <span
                  className="text-[13px] font-medium truncate transition-colors"
                  style={{ color: 'rgba(255,255,255,.75)' }}
                >
                  {company.displayName}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    background: 'rgba(180,151,214,.1)',
                    border: '1px solid rgba(180,151,214,.18)',
                    color: 'rgba(180,151,214,.65)',
                  }}
                >
                  {company.roleCount} {company.roleCount === 1 ? 'role' : 'roles'}
                </span>
                {company.contactCount > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      background: 'rgba(255,255,255,.04)',
                      border: '1px solid rgba(255,255,255,.07)',
                      color: 'rgba(255,255,255,.28)',
                    }}
                  >
                    {company.contactCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setPage(p => p + 1)}
            className="btn btn-ghost btn-sm"
          >
            Load more — {(filtered.length - paged.length).toLocaleString()} remaining
          </button>
        </div>
      )}
    </div>
  );
}
