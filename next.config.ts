import type { NextConfig } from "next";

// Verified live on production (2026-09-25) with zero violations across homepage,
// /opportunities, /companies, a company detail page, and the Clerk sign-in modal
// (the highest-risk flow — cross-origin Google OAuth button + iframes). Now enforced.
const CONTENT_SECURITY_POLICY = [
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
          { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
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
