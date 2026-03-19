# FounderFlow Growth Implementation Plan

## Context

The growth agent identified three high-leverage experiments to grow FounderFlow's user base. This plan makes each experiment concrete — what files to create/edit, exactly what changes to make, and how they work together.

The three experiments in order of implementation priority:
1. **SEO Founder Profile Pages** — Convert 3,000+ modal-only records into indexed public URLs
2. **Free Cold Email Generator Tool** — Capture high-intent users before signup
3. **Activation Email Sequence** — Fix the leaky bucket so acquired users actually stick

---

## Experiment 1: SEO Founder Profile Pages

### Problem
Every founder in the directory currently only exists as a modal popup triggered from `/opportunities`. Googlebot can't see modal content — so all 3,000+ founder records have zero SEO value. Searches like "[company name] startup founder" or "YC founder looking for [role]" return nothing from FounderFlow.

### What We Build
A public dynamic route `/founders/[slug]` that renders a full, indexable page for each founder.

### Files to Create/Modify

**1. Create `app/founders/[slug]/page.tsx`** (new file)
- Server component that fetches the entry from Firestore by slug
- Slug = URL-safe version of `company` field (e.g., "Acme Inc" → "acme-inc")
- Renders: company name, founder name, role, company description, "looking for" tags, company website link
- **Paywall**: email and LinkedIn URL hidden behind `ContactInfoGate` (exact same pattern as `FounderDetailModal`)
- `generateMetadata()` function for per-page title + OG tags
- CTA: "Generate a personalized outreach message →" → redirects to `/opportunities` with the company pre-selected or to signup

**2. Create `app/sitemap.ts`** (new file)
- Queries Firestore `entry` collection, returns all slugs
- Returns array of `{ url, lastModified }` for Google to crawl
- Next.js auto-serves this at `/sitemap.xml`

**3. Update `app/components/FounderDetailModal.tsx`**
- Add a small "View public profile →" link in the modal footer
- Links to `/founders/[slug]` so users can share individual profiles

**4. Update `app/opportunities/page.tsx`**
- In `EntryCard`, add a link overlay pointing to `/founders/[slug]`
- This ensures every card in the directory is crawlable by Google even before the user clicks

### Slug Generation Logic
```typescript
function toSlug(company: string): string {
  return company
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
```

### Data Already Available
The `entry` Firestore collection has all needed fields: `name`, `company`, `role`, `company_info`, `looking_for`, `company_url`. The `ContactInfoGate` component at `app/components/ContactInfoGate.tsx` handles the paywall automatically — just wrap email/LinkedIn in it.

### Expected Outcome
- 3,000+ new indexed pages within 2-4 weeks of Google crawling
- Organic search traffic from company-name searches, role-based queries, "YC startup [role]" queries

---

## Experiment 2: Free Cold Email Generator Tool

### Problem
Users who don't yet know about FounderFlow search Google for "cold email to startup founder template" or "how to email a startup founder." There is nowhere on FounderFlow to capture this intent. They land on generic blog posts and leave.

### What We Build
A standalone page at `/tools/cold-email-generator` that generates one free outreach message without requiring sign-in. The output quality demonstrates the product, then a CTA converts them to registered users.

### How It Works
1. User fills out a simple form: "Describe the company/founder you're reaching out to" + "Tell us a bit about yourself (2-3 sentences)"
2. Page calls a new lightweight API route that does a single Gemini generation (no auth required, no database save, rate-limited)
3. The generated message appears on page
4. Below the message: "Sign up free to save this, generate unlimited messages, and track your outreach →" with a Clerk `<SignInButton>`

### Files to Create/Modify

**1. Create `app/tools/cold-email-generator/page.tsx`** (new file)
- Client component with a simple 2-field form
- Calls `/api/tools/generate-free` (new route below)
- Shows loading state → result → CTA
- No Clerk auth wrapper (fully public)
- Adds relevant meta tags for SEO: "Free Cold Email Generator for Startup Founders"

**2. Create `app/api/tools/generate-free/route.ts`** (new file)
- Does NOT call `auth()` — public endpoint
- Accepts: `{ companyDescription: string, userDescription: string }`
- Rate limiting: IP-based, max 3 requests per hour (use a simple Firestore counter on the request IP hash)
- Calls the N8N webhook (same pattern as `/api/generate-outreach/route.ts`, lines 1-100) with a simplified prompt
- Does NOT save to database (`saveToDatabase: false` equivalent)
- Returns `{ message: string }`

**3. Update `app/components/Navigation.tsx`**
- Add "Free Tool" link in nav pointing to `/tools/cold-email-generator`
- This gives it internal link equity for SEO and makes it discoverable

### Key Reuse
The N8N webhook call pattern from `app/api/generate-outreach/route.ts` (lines ~200-300) can be copied directly. Only the prompt structure changes — simpler, no resume context, no web scraping enrichment.

### Expected Outcome
- Captures top-of-funnel traffic from "cold email generator" searches
- Users see the quality before any commitment
- Target: 15%+ conversion from page visit to signup

---

## Experiment 3: Activation Email Sequence

### Problem
There is no Clerk webhook handler in the codebase. When a user signs up, nothing happens automatically. Users who don't understand the product on first visit are lost forever. The "leaky bucket" means acquisition spend is wasted.

### What We Build
A Clerk `user.created` webhook → 3-email drip sequence via a transactional email service (Resend — free tier covers 3,000 emails/month).

### Email Sequence

| Email | Timing | Subject | Goal |
|-------|--------|---------|------|
| #1 | Immediately on signup | "Here's how to get a response from a startup founder in 10 min" | Drive first message generation |
| #2 | Day 2 (if no message generated) | "The founders on FounderFlow aren't on job boards — here's why" | Education + second chance to activate |
| #3 | Day 5 (if still no message) | "Real example: cold email that got a YC founder to respond" | Social proof + final nudge |

Emails #2 and #3 only send if `outreach_records` has no records for this userId (check Firestore before sending).

### Files to Create/Modify

**1. Create `app/api/webhooks/clerk/route.ts`** (new file)
- Receives Clerk `user.created` webhook events
- Validates webhook signature using `svix` package (Clerk's webhook library)
- On `user.created`: triggers Email #1 via Resend API, stores `{ userId, email, signupAt }` in a new `email_sequences` Firestore collection

**2. Create `app/api/cron/activation-emails/route.ts`** (new file)
- Called daily by a cron job (Vercel Cron, free tier, once/day)
- Queries `email_sequences` for users who signed up 2 days ago with no outreach records → sends Email #2
- Queries for users who signed up 5 days ago with no outreach records → sends Email #3
- Marks emails as sent to prevent duplicates

**3. Add `vercel.json` cron config** (new file or edit if exists)
```json
{
  "crons": [{
    "path": "/api/cron/activation-emails",
    "schedule": "0 9 * * *"
  }]
}
```

**4. Add environment variables**
- `CLERK_WEBHOOK_SECRET` — from Clerk dashboard
- `RESEND_API_KEY` — from Resend dashboard (free tier)
- `RESEND_FROM_EMAIL` — e.g., "hello@founderflow.space"

### New Firestore Collection
`email_sequences/{userId}`:
```typescript
{
  userId: string,
  email: string,
  signupAt: Timestamp,
  email1SentAt: Timestamp | null,
  email2SentAt: Timestamp | null,
  email3SentAt: Timestamp | null,
}
```

### Expected Outcome
- Recover a significant % of signups who browse once and leave
- Target: 60% of signups generate their first message within 7 days (up from likely <20% currently)

---

## Implementation Order

1. **Experiment 1 first** (highest SEO leverage, no external dependencies, 1-2 days)
2. **Experiment 3 second** (fix the leaky bucket before driving more traffic, 1 day)
3. **Experiment 2 last** (adds a new traffic source, most effective after activation is working, 4-6 hours)

---

## Verification

### Experiment 1
- Visit `/founders/acme-inc` (or any slug) — page should render with paywall on email/LinkedIn
- Visit `/sitemap.xml` — should list all founder slugs
- Use Google Search Console → URL Inspection on a `/founders/` URL to confirm indexability

### Experiment 2
- Visit `/tools/cold-email-generator` without being signed in
- Fill the form, submit — should get a generated message within ~10 seconds
- Submit 4+ times from same IP — should get rate-limited (429)
- Click the sign-up CTA — should go through Clerk signup flow

### Experiment 3
- Trigger a test Clerk webhook event from the Clerk dashboard → confirm Email #1 sends via Resend logs
- Manually call `/api/cron/activation-emails` — confirm it queries correctly without sending duplicates
- Check `email_sequences` Firestore collection is populated on new signups

---

## Critical Files

| File | Status | Purpose |
|------|--------|---------|
| `app/founders/[slug]/page.tsx` | Create | SEO founder profile pages |
| `app/sitemap.ts` | Create | Google sitemap for all founders |
| `app/tools/cold-email-generator/page.tsx` | Create | Free tool landing page |
| `app/api/tools/generate-free/route.ts` | Create | Unauthenticated generation endpoint |
| `app/api/webhooks/clerk/route.ts` | Create | Clerk user.created webhook handler |
| `app/api/cron/activation-emails/route.ts` | Create | Daily drip email cron job |
| `app/components/FounderDetailModal.tsx` | Edit | Add public profile link |
| `app/opportunities/page.tsx` | Edit | Add crawlable links on EntryCards |
| `app/components/Navigation.tsx` | Edit | Add "Free Tool" nav link |

## Key Reuse (Existing Code)
- `app/components/ContactInfoGate.tsx` — Use as-is in founder profile pages
- `app/api/generate-outreach/route.ts` (N8N call pattern, lines ~200-300) — Reuse in free generator API
- `app/hooks/useSubscription.tsx` — Use in founder profile page for paywall logic
- `app/components/PaywallModal.tsx` — Reuse in founder profile page CTAs
