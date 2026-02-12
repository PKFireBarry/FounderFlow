/**
 * URL Validation for SSRF Protection
 * Validates URLs before scraping to prevent Server-Side Request Forgery attacks
 */

// Blocked hostname patterns to prevent internal network access
const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS metadata endpoint
  'metadata.google.internal', // GCP metadata endpoint
  'metadata.azure.com', // Azure metadata endpoint
];

// Blocked IP ranges (private networks)
const BLOCKED_IP_PREFIXES = [
  '10.', // Private network 10.0.0.0/8
  '172.16.', '172.17.', '172.18.', '172.19.', // Private network 172.16.0.0/12
  '172.20.', '172.21.', '172.22.', '172.23.',
  '172.24.', '172.25.', '172.26.', '172.27.',
  '172.28.', '172.29.', '172.30.', '172.31.',
  '192.168.', // Private network 192.168.0.0/16
];

// Optional: Whitelist of allowed domains for scraping
// If empty, all domains except blocked ones are allowed
const ALLOWED_DOMAINS = [
  'linkedin.com',
  'twitter.com',
  'x.com',
  'github.com',
  'medium.com',
  'substack.com',
  'notion.site',
  'notion.so',
  'angel.co',
  'wellfound.com',
  'crunchbase.com',
  'producthunt.com',
  // Add more trusted domains as needed
];

/**
 * Validates a URL for safe scraping
 * @param url - The URL to validate
 * @param enforceWhitelist - If true, only allow whitelisted domains
 * @returns true if URL is safe to scrape
 */
export function validateScrapingUrl(url: string, enforceWhitelist: boolean = false): boolean {
  try {
    const parsed = new URL(url);

    // 1. Protocol check - only allow HTTPS
    if (parsed.protocol !== 'https:') {
      console.warn(`[URL Validation] Blocked non-HTTPS URL: ${url}`);
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Check for blocked hostnames
    if (BLOCKED_HOSTNAMES.some(blocked => hostname === blocked || hostname.includes(blocked))) {
      console.warn(`[URL Validation] Blocked internal hostname: ${hostname}`);
      return false;
    }

    // 3. Check for blocked IP prefixes
    if (BLOCKED_IP_PREFIXES.some(prefix => hostname.startsWith(prefix))) {
      console.warn(`[URL Validation] Blocked private IP range: ${hostname}`);
      return false;
    }

    // 4. Block .local domains
    if (hostname.endsWith('.local')) {
      console.warn(`[URL Validation] Blocked .local domain: ${hostname}`);
      return false;
    }

    // 5. Optional: Whitelist check
    if (enforceWhitelist && ALLOWED_DOMAINS.length > 0) {
      const isWhitelisted = ALLOWED_DOMAINS.some(domain =>
        hostname === domain || hostname.endsWith(`.${domain}`)
      );

      if (!isWhitelisted) {
        console.warn(`[URL Validation] Domain not in whitelist: ${hostname}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.warn(`[URL Validation] Invalid URL format: ${url}`, error);
    return false;
  }
}

/**
 * Validates multiple URLs
 * @param urls - Array of URLs to validate
 * @param enforceWhitelist - If true, only allow whitelisted domains
 * @returns Object with valid and invalid URLs
 */
export function validateMultipleUrls(
  urls: string[],
  enforceWhitelist: boolean = false
): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const url of urls) {
    if (validateScrapingUrl(url, enforceWhitelist)) {
      valid.push(url);
    } else {
      invalid.push(url);
    }
  }

  return { valid, invalid };
}

/**
 * Extracts domain from URL for logging/reporting
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}
