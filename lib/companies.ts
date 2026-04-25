import 'server-only';
import { unstable_cache } from 'next/cache';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase/server';
import { deriveCompanySlug, normalizeCompanyName, getDomainFromSlugEntry } from './company-slug';
import { isNA } from './entry-helpers';

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
  contactCount: number;
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
  const domain = getDomainFromSlugEntry(entries.find(e => e.company_url) ?? entries[0]) ?? null;
  const bestCompanyInfo = entries.find(e => !isNA(e.company_info))?.company_info ?? '';

  const deduped = dedupeContacts(entries);

  const dates = entries.map(e => e.published).filter(Boolean).sort().reverse();
  return {
    slug,
    displayName,
    domain,
    bestCompanyInfo,
    entryIds: entries.map(e => e.id),
    roleCount: entries.length,
    lastPublished: dates[0] ?? '',
    contactCount: deduped.length,
  };
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

const getCachedIndex = unstable_cache(
  async (): Promise<{ records: CompanyRecord[]; entriesBySlug: Record<string, EntryRecord[]> }> => {
    const entries = await fetchAllEntries();
    const index = buildIndex(entries);
    const records: CompanyRecord[] = [];
    const entriesBySlug: Record<string, EntryRecord[]> = {};

    for (const [slug, slugEntries] of index) {
      records.push(buildCompanyRecord(slug, slugEntries));
      entriesBySlug[slug] = slugEntries;
    }

    records.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return { records, entriesBySlug };
  },
  ['companies-index'],
  { revalidate: 3600, tags: ['companies'] }
);

export async function listCompanies(): Promise<CompanyRecord[]> {
  const { records } = await getCachedIndex();
  return records;
}

export async function getCompanyBySlug(slug: string): Promise<CompanyDetail | null> {
  const { records, entriesBySlug } = await getCachedIndex();
  const company = records.find(r => r.slug === slug);
  if (!company) return null;
  const entries = entriesBySlug[slug] ?? [];
  const contacts = dedupeContacts(entries);
  return { company, entries, contacts };
}

