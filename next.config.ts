import type { NextConfig } from "next";

// Report-Only for now: an enforced CSP that's wrong in production would silently break
// Clerk sign-in or Stripe checkout, and there's no way to load-test this environment's
// actual Clerk/PostHog domains before shipping. Report-Only can never block anything —
// it only surfaces violations in the browser console — so once real traffic shows the
// policy doesn't false-positive on anything, swap the header name to enforce it.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.founderflow.space https://js.stripe.com https://us.i.posthog.com https://us-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://us.i.posthog.com https://us-assets.i.posthog.com https://api.stripe.com https://clerk.founderflow.space https://*.clerk.accounts.dev",
  "frame-src https://js.stripe.com https://clerk.founderflow.space https://*.clerk.accounts.dev",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Content-Security-Policy-Report-Only', value: CSP_REPORT_ONLY },
        ],
      },
    ];
  },
  // Empty Turbopack config to acknowledge Next.js 16+ Turbopack defaults
  // PDF.js handling works without special config in Turbopack
  turbopack: {},
  // Keep webpack config for fallback compatibility if needed
  webpack: (config, { isServer }) => {
    // Handle PDF.js worker and canvas issues
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }

    // Ignore PDF.js worker files to prevent build issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      canvas: false,
    };

    return config;
  },
};

export default nextConfig;
