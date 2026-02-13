/**
 * Pure helper functions extracted from the opportunities page monolith.
 * These handle all data-cleaning, junk removal, and normalization
 * of scraped founder data from Firestore.
 */

// ───── Types ─────────────────────────────────────────────────────────────

export interface EntryDoc {
  id: string;
  __createdAtMillis?: number;
  __updatedAtMillis?: number;
  [key: string]: any;
}

export type EntryCardProps = {
  id: string;
  company: string | null;
  companyDomain: string | null;
  companyInfo: string | null;
  published: string;
  name: string | null;
  role: string | null;
  lookingForTags: string[];
  restCount: number;
  companyUrl: string | null;
  rolesUrl: string | null;
  apply_url: string | null;
  linkedinUrl: string | null;
  emailHref: string | null;
};

/** Shape passed to FounderDetailModal / FounderSidePanel */
export interface FounderData {
  id: string;
  company: string | null;
  companyInfo: string | null;
  name: string | null;
  role: string | null;
  lookingForTags: string[];
  restCount: number;
  companyUrl: string | null;
  rolesUrl: string | null;
  apply_url: string | null;
  linkedinUrl: string | null;
  emailHref: string | null;
  published: string;
}

/** Shape expected by IntegratedOutreachModal */
export interface JobData {
  company?: string;
  company_info?: string;
  name?: string;
  role?: string;
  looking_for?: string;
  company_url?: string;
  url?: string;
  apply_url?: string;
  linkedinurl?: string;
  email?: string;
  published?: any;
}

// ───── Value normalisation (junk / NA detection) ────────────────────────

/**
 * Returns true when a value is null, empty, or one of many "N/A"-like
 * strings commonly found in scraped data.  Strips zero-width chars
 * and normalises punctuation before comparing.
 */
export function isNA(value: any): boolean {
  if (value == null) return true;
  const s = String(value)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toLowerCase();
  if (!s) return true;
  const stripped = s.replace(/[\s\./\\_\-–⁄]/g, "");
  return (
    s === "N/A" ||
    s === "-" ||
    stripped === "na" ||
    stripped === "none" ||
    stripped === "null" ||
    stripped === "undefined" ||
    stripped === "tbd"
  );
}

/** Returns the first value that is not null/undefined and not NA-like. */
export function firstNonNA<T = any>(...values: T[]): T | null {
  for (const v of values) {
    if (v == null) continue;
    if (typeof v === "string" && isNA(v)) continue;
    return v;
  }
  return null;
}

// ───── Email / URL helpers ──────────────────────────────────────────────

export function cleanEmail(raw: any): string | null {
  if (isNA(raw)) return null;
  let s = String(raw).trim();
  if (s.toLowerCase().startsWith("mailto:")) s = s.slice(7);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s;
}

export function mailtoHref(email: string | null): string | null {
  if (!email) return null;
  return `mailto:${email}`;
}

export function asHttpUrl(raw: any): string | null {
  if (isNA(raw)) return null;
  let s = String(raw).trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    return u.toString();
  } catch {
    return null;
  }
}

export function prettyDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getDomainFromUrl(input?: string | null): string | null {
  if (!input) return null;
  let str = input.trim();
  if (str.toLowerCase().startsWith("mailto:")) {
    const email = str.slice(7);
    const parts = email.split("@");
    return parts[1] ? parts[1].toLowerCase() : null;
  }
  if (str.includes("@") && !/^https?:\/\//i.test(str)) {
    const parts = str.split("@");
    return parts[1] ? parts[1].toLowerCase() : null;
  }
  try {
    if (!/^https?:\/\//i.test(str)) {
      str = `https://${str}`;
    }
    const u = new URL(str);
    return u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    const host = str.replace(/^https?:\/\/(www\.)?/i, "").split("/")[0];
    return host ? host.toLowerCase() : null;
  }
}

// ───── Tags ─────────────────────────────────────────────────────────────

export function tagsFrom(value: any, max = 6): string[] {
  if (isNA(value)) return [];
  const items = String(value)
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !isNA(t));
  const uniq: string[] = [];
  for (const t of items) if (!uniq.includes(t)) uniq.push(t);
  return uniq.slice(0, max);
}

// ───── LinkedIn / URL classification ────────────────────────────────────

export function isLinkedInUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /(^|\.)linkedin\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}

export function canonicalizeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    return `${u.protocol}//${u.hostname.toLowerCase()}${path}`;
  } catch {
    return null;
  }
}

export function isJobBoardUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    const p = u.pathname.toLowerCase();
    if (
      h.includes("greenhouse.io") ||
      h.includes("lever.co") ||
      h.includes("workable.com") ||
      h.includes("ashbyhq.com") ||
      h.includes("myworkdayjobs.com") ||
      h.includes("jobvite.com") ||
      h.includes("bamboohr.com")
    )
      return true;
    return /careers|jobs|open-roles|apply|join-us/.test(p);
  } catch {
    return false;
  }
}

export function isBadCompanyDomain(url: string | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host === "gmail.com" || host === "mail.google.com";
  } catch {
    return false;
  }
}

// ───── Link de-duplication / assignment ─────────────────────────────────

/**
 * Given a raw entry from Firestore, deterministically assigns URLs to
 * the four link slots (companyUrl, rolesUrl, apply_url, linkedinUrl)
 * plus email.  Handles many field-name aliases and ensures the same URL
 * is never used for two slots.
 */
export function chooseLinks(it: any) {
  const used = new Set<string>();

  const fromCompany = asHttpUrl(
    it?.company_url ?? it?.companyUrl ?? it?.website ?? it?.site ?? it?.homepage ?? it?.url_website
  );
  const fromLinkedIn = asHttpUrl(
    it?.linkedinurl ?? it?.linkedin_url ?? it?.linkedin ?? it?.li
  );
  const fromFlexUrl = asHttpUrl(
    it?.url ?? it?.roles_url ?? it?.careers ?? it?.jobs_url ?? it?.open_roles_url
  );
  const fromApplyUrl = asHttpUrl(it?.apply_url);
  const flexEmail = cleanEmail(it?.url);
  const email = cleanEmail(it?.email) || flexEmail;

  let linkedinUrl: string | null = null;
  let rolesUrl: string | null = null;
  let apply_url: string | null = null;
  let companyUrl: string | null = null;

  // 1) LinkedIn
  for (const cand of [fromLinkedIn, fromCompany, fromFlexUrl, fromApplyUrl]) {
    if (cand && isLinkedInUrl(cand)) {
      const canon = canonicalizeUrl(cand)!;
      if (!used.has(canon)) {
        linkedinUrl = cand;
        used.add(canon);
        break;
      }
    }
  }

  // 2) Apply URL
  if (fromApplyUrl) {
    const canon = canonicalizeUrl(fromApplyUrl)!;
    if (!used.has(canon)) {
      apply_url = fromApplyUrl;
      used.add(canon);
    }
  }

  // 3) Roles / jobs
  for (const cand of [fromFlexUrl, fromCompany]) {
    if (cand && isJobBoardUrl(cand)) {
      const canon = canonicalizeUrl(cand)!;
      if (!used.has(canon)) {
        rolesUrl = cand;
        used.add(canon);
        break;
      }
    }
  }

  // 4) Company website (non-LinkedIn, non-job-board, not gmail)
  for (const cand of [fromCompany, fromFlexUrl]) {
    if (cand && !isLinkedInUrl(cand) && !isJobBoardUrl(cand) && !isBadCompanyDomain(cand)) {
      const canon = canonicalizeUrl(cand)!;
      if (!used.has(canon)) {
        companyUrl = cand;
        used.add(canon);
        break;
      }
    }
  }

  const companyDomain = prettyDomain(companyUrl);

  return { companyUrl, rolesUrl, apply_url, linkedinUrl, emailHref: mailtoHref(email), companyDomain } as const;
}

// ───── Date parsing ─────────────────────────────────────────────────────

export function asDate(raw: any): Date | null {
  if (!raw) return null;
  try {
    if (typeof raw?.toDate === "function") return raw.toDate();
    if (typeof raw?.toMillis === "function") return new Date(raw.toMillis());
    if (raw?.type === "firestore/timestamp/1.0" && (raw?.seconds || raw?._seconds)) {
      const s = Number(raw.seconds ?? raw._seconds);
      if (!Number.isNaN(s)) return new Date(s * 1000);
    }
    if (raw?.seconds || raw?._seconds) {
      const s = Number(raw.seconds ?? raw._seconds);
      if (!Number.isNaN(s)) return new Date(s * 1000);
    }
    if (typeof raw === "number") {
      if (raw > 1e12) return new Date(raw);
      if (raw > 1e9) return new Date(raw * 1000);
      return new Date(raw);
    }
    if (typeof raw === "string") {
      const n = Number(raw);
      if (!Number.isNaN(n) && raw.trim() !== "") return asDate(n);
      const t = Date.parse(raw);
      if (!Number.isNaN(t)) return new Date(t);
    }
  } catch {
    // ignore
  }
  return null;
}

export function getEntryDateMs(it: any): number {
  const raw = firstNonNA(
    it?.published,
    it?.publishedAt,
    it?.published_at,
    it?.date,
    it?.createdAt,
    it?.created_at,
    it?.created,
    it?.timestamp,
    it?.__createdAtMillis,
    it?.__updatedAtMillis,
    it?.published?.seconds,
    it?.published?._seconds
  );
  const d = asDate(raw);
  return d ? d.getTime() : 0;
}

export function formatPublished(raw: any): string {
  const d = asDate(raw);
  if (!d) return "N/A";
  const abs = d.toLocaleDateString();
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 0) return abs;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  let rel = "today";
  if (days === 1) rel = "1 day ago";
  else if (days > 1 && days < 30) rel = `${days} days ago`;
  else if (days >= 30 && days < 365) rel = `${Math.floor(days / 30)} mo ago`;
  else if (days >= 365) rel = `${Math.floor(days / 365)} yr ago`;
  return `${abs} • ${rel}`;
}

/** Short relative date for list rows, e.g. "3d", "2mo", "1yr" */
export function relativeDate(raw: any): string {
  const d = asDate(raw);
  if (!d) return "—";
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "soon";
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}yr`;
}

// ───── Data mapping ─────────────────────────────────────────────────────

/** Normalise a raw Firestore entry into FounderData for display components. */
export function toFounderData(it: EntryDoc): FounderData {
  const company = isNA(it.company) ? null : String(it.company);
  const companyInfo = isNA(it.company_info) ? null : String(it.company_info);
  const role = isNA(it.role) ? null : String(it.role);
  const name = isNA(it.name) ? null : String(it.name);
  const lookingForTags = tagsFrom(it.looking_for, 6);
  const allTags = String(it.looking_for ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !isNA(t));
  const restCount = Math.max(0, allTags.length - lookingForTags.length);
  const { companyUrl, rolesUrl, apply_url, linkedinUrl, emailHref } = chooseLinks(it);
  const published = formatPublished(it.published);

  return {
    id: it.id,
    company,
    companyInfo,
    name,
    role,
    lookingForTags,
    restCount,
    companyUrl,
    rolesUrl,
    apply_url,
    linkedinUrl,
    emailHref,
    published,
  };
}

/** Convert FounderData → JobData shape for IntegratedOutreachModal */
export function toJobData(f: FounderData): JobData {
  return {
    company: f.company ?? undefined,
    company_info: f.companyInfo ?? undefined,
    name: f.name ?? undefined,
    role: f.role ?? undefined,
    looking_for: f.lookingForTags.join(", "),
    company_url: f.companyUrl ?? undefined,
    url: f.rolesUrl ?? undefined,
    apply_url: f.apply_url ?? undefined,
    linkedinurl: f.linkedinUrl ?? undefined,
    email: f.emailHref?.replace("mailto:", "") ?? undefined,
    published: f.published,
  };
}

/** Build the save payload matching the shape written to Firestore saved_jobs. */
export function toSavePayload(f: FounderData) {
  return {
    id: f.id,
    company: f.company,
    company_info: f.companyInfo,
    name: f.name,
    role: f.role,
    looking_for: f.lookingForTags.join(", "),
    company_url: f.companyUrl,
    url: f.rolesUrl,
    apply_url: f.apply_url,
    linkedinurl: f.linkedinUrl,
    email: f.emailHref?.replace("mailto:", ""),
    published: f.published,
  };
}

/** Get avatar info (favicon URL + initials) for a founder entry. */
export function getAvatarInfo(
  name?: string | null,
  company?: string | null,
  companyUrl?: string | null,
  rolesUrl?: string | null
) {
  const websiteUrl = companyUrl || rolesUrl;
  let faviconUrl: string | null = null;

  if (websiteUrl && !isNA(websiteUrl)) {
    const domain = getDomainFromUrl(websiteUrl);
    if (domain) {
      faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    }
  }

  let initials = "UN";
  if (name && !isNA(name)) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = parts[0].slice(0, 2).toUpperCase();
    }
  } else if (company && !isNA(company)) {
    const parts = company.split(" ");
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = parts[0].slice(0, 2).toUpperCase();
    }
  }

  const displayName = name || company || "Unknown";
  return { faviconUrl, initials, displayName };
}

/** Get email info from a raw email/mailto string. */
export function getEmailInfo(input?: string | null): { email: string; href: string } | null {
  if (!input || isNA(input)) return null;
  let raw = input.trim();
  if (raw.toLowerCase().startsWith("mailto:")) raw = raw.slice(7);
  if (!raw.includes("@")) return null;
  return { email: raw, href: `mailto:${raw}` };
}
