import 'server-only';
import { unstable_cache } from 'next/cache';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase/server';
import { deriveCompanySlug, normalizeCompanyName, getDomainFromSlugEntry } from './company-slug';
import { isNA, extractRoleKeywords } from './entry-helpers';

export interface EntryRecord {
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
}

export interface CompanyRecord {
  slug: string;
  displayName: string;
  domain: string | null;
  bestCompanyInfo: string;
  entryIds: string[];
  roleCount: number;
  lastPublished: string;
  firstPublished: string;
  contactCount: number;
  roleKeywords: string[];
}

export interface CompanyDetail {
  company: CompanyRecord;
  entries: EntryRecord[];
  contacts: ContactRecord[];
}

export interface ContactRecord {
  name: string;
  role: string;
  email: string;
  linkedinurl: string;
  company_url: string;
  entryId: string;
}

async function fetchAllEntries(): Promise<EntryRecord[]> {
  const entryCollection = collection(db, 'entry');
  const entryQuery = query(entryCollection, orderBy('published', 'desc'));
  const snapshot = await getDocs(entryQuery);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    let publishedStr = '';
    if (data.published) {
      if (data.published.toDate && typeof data.published.toDate === 'function') {
        try { publishedStr = data.published.toDate().toISOString().split('T')[0]; } catch { publishedStr = ''; }
      } else if (typeof data.published === 'string') {
        publishedStr = data.published;
      }
    }
    return {
      id: doc.id,
      name: String(data.name || ''),
      company: String(data.company || ''),
      role: String(data.role || ''),
      company_info: String(data.company_info || ''),
      published: publishedStr,
      linkedinurl: String(data.linkedinurl || ''),
      email: String(data.email || ''),
      company_url: String(data.company_url || ''),
      apply_url: String(data.apply_url || ''),
      url: String(data.url || ''),
      looking_for: String(data.looking_for || ''),
    };
  });
}

function buildIndex(entries: EntryRecord[]): Map<string, EntryRecord[]> {
  const index = new Map<string, EntryRecord[]>();
  for (const entry of entries) {
    const slug = deriveCompanySlug(entry);
    if (!slug) continue;
    const group = index.get(slug) ?? [];
    group.push(entry);
    index.set(slug, group);
  }
  return index;
}

function buildCompanyRecord(slug: string, entries: EntryRecord[]): CompanyRecord {
  const displayName = normalizeCompanyName(entries.map(e => e.company));
  const domain = entries.map(e => getDomainFromSlugEntry(e)).find(Boolean) ?? null;
  const bestCompanyInfo = entries.find(e => !isNA(e.company_info))?.company_info ?? '';

  const deduped = dedupeContacts(entries);

  const dates = entries.map(e => e.published).filter(Boolean).sort().reverse();

  const roleKeywords = Array.from(
    new Set(entries.flatMap(e => extractRoleKeywords(e.looking_for)))
  );

  return {
    slug,
    displayName,
    domain,
    bestCompanyInfo,
    entryIds: entries.map(e => e.id),
    roleCount: entries.length,
    lastPublished: dates[0] ?? '',
    firstPublished: dates[dates.length - 1] ?? '',
    contactCount: deduped.length,
    roleKeywords,
  };
}

export function roleToSlug(role: string): string {
  return role.toLowerCase().replace(/\s+/g, '-');
}

const MIN_COMPANIES_PER_ROLE_HUB = 5;

export interface RoleHub {
  role: string;
  slug: string;
  companies: CompanyRecord[];
}

/**
 * Groups companies by extracted role keyword, for hub pages that give each
 * company page a real inbound link (most have none otherwise). Roles with too
 * few companies are dropped rather than shipped as another thin page.
 */
export async function listRoleHubs(): Promise<RoleHub[]> {
  const companies = await listCompanies();
  const byRole = new Map<string, CompanyRecord[]>();

  for (const company of companies) {
    for (const role of company.roleKeywords) {
      const group = byRole.get(role) ?? [];
      group.push(company);
      byRole.set(role, group);
    }
  }

  return Array.from(byRole.entries())
    .filter(([, companies]) => companies.length >= MIN_COMPANIES_PER_ROLE_HUB)
    .map(([role, companies]) => ({ role, slug: roleToSlug(role), companies }))
    .sort((a, b) => b.companies.length - a.companies.length);
}

export async function getRoleHubBySlug(slug: string): Promise<RoleHub | null> {
  const hubs = await listRoleHubs();
  return hubs.find(h => h.slug === slug) ?? null;
}

/**
 * Companies sharing at least one role keyword with the given company, ranked
 * by how many keywords they share. Gives every company page real sibling
 * links instead of the zero it has today.
 */
export async function getRelatedCompanies(slug: string, limit = 6): Promise<CompanyRecord[]> {
  const companies = await listCompanies();
  const target = companies.find(c => c.slug === slug);
  if (!target || target.roleKeywords.length === 0) return [];

  const targetKeywords = new Set(target.roleKeywords);

  return companies
    .filter(c => c.slug !== slug)
    .map(c => ({
      company: c,
      sharedCount: c.roleKeywords.filter(k => targetKeywords.has(k)).length,
    }))
    .filter(({ sharedCount }) => sharedCount > 0)
    .sort((a, b) => b.sharedCount - a.sharedCount)
    .slice(0, limit)
    .map(({ company }) => company);
}

function normalizeName(raw: string): string {
  if (isNA(raw)) return '';
  return raw.toLowerCase().trim().replace(/\s+/g, ' ');
}

function firstToken(name: string): string {
  return name.split(' ')[0] ?? '';
}

function secondToken(name: string): string {
  return name.split(' ')[1] ?? '';
}

function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const fa = firstToken(a), fb = firstToken(b);
  if (fa !== fb) return false;
  const sa = secondToken(a), sb = secondToken(b);
  // one has only first name → treat as same person
  if (!sa || !sb) return true;
  // both have last name → same or one is an initial of the other
  if (sa === sb) return true;
  if (sa[0] === sb[0] && (sa.length === 1 || sb.length === 1)) return true;
  return false;
}

function pickBestName(names: string[]): string {
  const valid = names.filter(n => !isNA(n) && n.trim().length > 0);
  if (!valid.length) return '';
  // Prefer longest (most complete) name
  return valid.reduce((best, cur) => cur.trim().length > best.trim().length ? cur : best);
}

function mergeContacts(entries: EntryRecord[]): ContactRecord[] {
  // Most recent first — we prefer the newer data when merging fields
  const sorted = [...entries].sort((a, b) => {
    if (!a.published && !b.published) return 0;
    if (!a.published) return 1;
    if (!b.published) return -1;
    return b.published.localeCompare(a.published);
  });

  const groups: EntryRecord[][] = [];

  for (const entry of sorted) {
    const norm = normalizeName(entry.name);
    if (!norm) continue; // skip entries with no usable name

    const matchIndex = groups.findIndex(g => namesMatch(normalizeName(g[0].name), norm));
    if (matchIndex >= 0) {
      groups[matchIndex].push(entry);
    } else {
      groups.push([entry]);
    }
  }

  return groups.map(group => {
    // Pick best non-NA value for each field, preferring most recent (group is already sorted)
    const pick = (fn: (e: EntryRecord) => string) =>
      group.map(fn).find(v => !isNA(v)) ?? '';

    return {
      name: pickBestName(group.map(e => e.name)),
      role: pick(e => e.role),
      email: pick(e => e.email),
      linkedinurl: pick(e => e.linkedinurl),
      company_url: pick(e => e.company_url),
      entryId: group[0].id,
    };
  });
}

// Keep old name as alias so buildCompanyRecord can call it
function dedupeContacts(entries: EntryRecord[]): ContactRecord[] {
  return mergeContacts(entries);
}

// Short-lived in-process memo (NOT persisted to Next's Data Cache) so that a
// burst of calls — e.g. all ~2,100 company pages hitting a cold per-slug
// cache during the same build — share one Firestore read instead of one
// each. This is purely a same-process dedupe window, not a data cache, so
// it never risks the 2MB unstable_cache size limit itself.
//
// Holds the resolved array (not a long-lived promise): awaiting one promise
// shared across many requests chains every request's async graph together, and
// Next's dev-mode async tracker (visitAsyncNode) overflows the stack walking it
// ("Maximum call stack size exceeded" / "frame.join is not a function").
let allEntriesMemo: { entries: EntryRecord[]; fetchedAt: number } | null = null;
let allEntriesInflight: Promise<EntryRecord[]> | null = null;
const ALL_ENTRIES_MEMO_TTL_MS = 5 * 60 * 1000;

async function getAllEntriesMemoized(): Promise<EntryRecord[]> {
  if (allEntriesMemo && Date.now() - allEntriesMemo.fetchedAt <= ALL_ENTRIES_MEMO_TTL_MS) {
    return allEntriesMemo.entries;
  }
  if (!allEntriesInflight) {
    allEntriesInflight = fetchAllEntries()
      .then(entries => {
        allEntriesMemo = { entries, fetchedAt: Date.now() };
        return entries;
      })
      .finally(() => {
        allEntriesInflight = null;
      });
  }
  return allEntriesInflight;
}

const getCachedRecords = unstable_cache(
  async (): Promise<CompanyRecord[]> => {
    const entries = await getAllEntriesMemoized();
    const index = buildIndex(entries);
    const records = Array.from(index, ([slug, slugEntries]) => buildCompanyRecord(slug, slugEntries));
    records.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return records;
  },
  ['companies-records-v2'],
  { revalidate: 3600, tags: ['companies'] }
);

// Cached per-slug rather than as one shared map: a map holding every
// company's full entries in a single unstable_cache entry previously blew
// past the 2MB per-entry limit once the dataset grew (this is what caused
// the "frame.join is not a function" crash on company pages — Next's error
// formatting choking while trying to report the real oversized-cache error).
// One company's entries (typically 1-3) never comes close to that limit,
// regardless of how large the overall dataset grows.
const getCachedEntriesForSlug = unstable_cache(
  async (slug: string): Promise<EntryRecord[]> => {
    const entries = await getAllEntriesMemoized();
    const index = buildIndex(entries);
    return index.get(slug) ?? [];
  },
  ['company-entries-for-slug-v2'],
  { revalidate: 3600, tags: ['companies'] }
);

export async function listCompanies(): Promise<CompanyRecord[]> {
  return getCachedRecords();
}

export async function getCompanyBySlug(slug: string): Promise<CompanyDetail | null> {
  const [records, entries] = await Promise.all([getCachedRecords(), getCachedEntriesForSlug(slug)]);
  const company = records.find(r => r.slug === slug);
  if (!company) return null;
  const contacts = dedupeContacts(entries);
  return { company, entries, contacts };
}

