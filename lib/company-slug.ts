import { isNA } from './entry-helpers';
import { isValidActionableUrl } from './url-validation';

const SLUG_STOPLIST = new Set(['stealth', 'unknown', 'na', 'anonymous', 'none']);

const CORP_SUFFIX_RE = /\b(inc|llc|ltd|co|corp|corporation|company|studios|labs|holdings)\.?\b/gi;

export interface EntryForSlug {
  company_url?: string;
  company?: string;
}

function isOnlyNumeric(s: string): boolean {
  return /^\d+$/.test(s);
}

export function deriveCompanySlug(entry: EntryForSlug): string | null {
  if (entry.company_url && isValidActionableUrl(entry.company_url)) {
    try {
      let url = entry.company_url.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      const hostname = new URL(url).hostname.toLowerCase();
      const withoutWww = hostname.replace(/^www\./, '');
      const parts = withoutWww.split('.');
      // firecrawl.dev → firecrawl, acme.co.uk → acme
      const slug = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
      const cleaned = slug.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (cleaned && !isOnlyNumeric(cleaned) && !SLUG_STOPLIST.has(cleaned)) {
        return cleaned;
      }
    } catch {
      // fall through
    }
  }

  if (!isNA(entry.company)) {
    const slug = String(entry.company)
      .toLowerCase()
      .replace(CORP_SUFFIX_RE, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (slug && !isOnlyNumeric(slug) && !SLUG_STOPLIST.has(slug)) {
      return slug;
    }
  }

  return null;
}

export function normalizeCompanyName(names: string[]): string {
  const valid = names.filter(n => !isNA(n) && n.trim().length > 0);
  if (valid.length === 0) return 'Unknown Company';
  return valid.reduce((best, current) =>
    current.trim().length > best.trim().length ? current : best
  );
}

export function getDomainFromSlugEntry(entry: EntryForSlug): string | null {
  if (!entry.company_url || !isValidActionableUrl(entry.company_url)) return null;
  try {
    let url = entry.company_url.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
