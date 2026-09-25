// Shared, pure link/contact-resolution helpers for directory entries.
// Used both client-side (OpportunitiesClient) and server-side (the
// /api/opportunities routes, which need to know exactly which raw field
// resolves to the paywalled email/LinkedIn value so it can be redacted).

export function isNA(value: any): boolean {
  if (value == null) return true;
  const s = String(value)
    .replace(/[​-‍﻿]/g, "")
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

export function firstNonNA<T = any>(...values: T[]): T | null {
  for (const v of values) {
    if (v == null) continue;
    if (typeof v === "string" && isNA(v)) continue;
    return v;
  }
  return null;
}

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
    ) return true;
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

  if (fromApplyUrl) {
    const canon = canonicalizeUrl(fromApplyUrl)!;
    if (!used.has(canon)) {
      apply_url = fromApplyUrl;
      used.add(canon);
    }
  }

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
