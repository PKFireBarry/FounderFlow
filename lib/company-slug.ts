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

// Two-part public suffixes, so acme.co.uk resolves to "acme" rather than "co".
// Hand-maintained (no public-suffix dependency); covers the ones that show up in
// startup/company URLs. Anything missing degrades to the old behavior.
const MULTI_PART_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'co.nz',
  'co.in', 'co.jp', 'co.kr', 'co.za', 'co.il', 'co.id', 'com.br', 'com.mx',
  'com.ar', 'com.sg', 'com.hk', 'com.tr', 'com.cn',
]);

// Registrable domains that are platforms, not the company's own site. An entry
// pointing at one of these says nothing about which company it is, so it must
// not be used to derive a slug (or shown as the company's website) — otherwise
// every entry linking to e.g. LinkedIn collapses into a single "linkedin" page.
const PLATFORM_DOMAINS = new Set([
  'linkedin.com', 'lnkd.in', 'x.com', 'twitter.com', 't.co', 'facebook.com', 'fb.com',
  'instagram.com', 'youtube.com', 'youtu.be', 'tiktok.com', 'github.com', 'github.io',
  'gitlab.com', 'medium.com', 'substack.com', 'notion.so', 'notion.site', 'notion.com',
  'crunchbase.com', 'angel.co', 'wellfound.com', 'ycombinator.com', 'producthunt.com',
  'linktr.ee', 'calendly.com', 'bit.ly', 'google.com', 'airtable.com', 'typeform.com',
  'forms.gle', 'wixsite.com', 'carrd.co', 'webflow.io', 'vercel.app', 'netlify.app',
  'herokuapp.com', 'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'linkedin.cn', 'pitchbook.com', 'apple.com', 'dropbox.com', 'bloomberg.com',
]);

function parseHostname(rawUrl: string): { label: string; domain: string } | null {
  let url = rawUrl.trim();
  if (!url.startsWith('http')) url = 'https://' + url;
  const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  const parts = hostname.split('.');
  if (parts.length < 2) return { label: parts[0], domain: hostname };
  const lastTwo = parts.slice(-2).join('.');
  if (parts.length >= 3 && MULTI_PART_SUFFIXES.has(lastTwo)) {
    return { label: parts[parts.length - 3], domain: parts.slice(-3).join('.') };
  }
  return { label: parts[parts.length - 2], domain: lastTwo };
}

export function deriveCompanySlug(entry: EntryForSlug): string | null {
  if (entry.company_url && isValidActionableUrl(entry.company_url)) {
    try {
      const parsed = parseHostname(entry.company_url);
      if (parsed && !PLATFORM_DOMAINS.has(parsed.domain)) {
        const cleaned = parsed.label.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (cleaned && !isOnlyNumeric(cleaned) && !SLUG_STOPLIST.has(cleaned)) {
          return cleaned;
        }
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
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const parsed = parseHostname(entry.company_url);
    if (parsed && PLATFORM_DOMAINS.has(parsed.domain)) return null;
    return hostname;
  } catch {
    return null;
  }
}
