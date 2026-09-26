import { Metadata } from 'next';
import Link from 'next/link';
import OpportunitiesClient from './OpportunitiesClient';
import Footer from '../components/Footer';
import { listCompanies, listRoleHubs } from '../../lib/companies';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Browse Early-Stage Startup Opportunities | FounderFlow',
  description: 'Browse curated leads at seed-stage startups with verified founder contact info — search by role or skill to find companies actively hiring.',
  openGraph: {
    title: 'Browse Early-Stage Startup Opportunities | FounderFlow',
    description: 'Curated leads at seed-stage startups with verified founder contact info.',
    url: 'https://www.founderflow.space/opportunities',
  },
  alternates: {
    canonical: 'https://www.founderflow.space/opportunities',
  },
};

export default async function OpportunitiesPage() {
  // The directory itself loads client-side (contact details are redacted per
  // viewer), so crawlers would otherwise see almost no HTML here. This section is
  // real, server-rendered content and links; it carries no contact details.
  const [companies, hubs] = await Promise.all([listCompanies(), listRoleHubs()]);
  const recent = companies
    .filter(c => c.lastPublished)
    .sort((a, b) => b.lastPublished.localeCompare(a.lastPublished))
    .slice(0, 24);
  const topHubs = hubs.slice(0, 12);

  return (
    <>
      <OpportunitiesClient />
      <section className="bg-[#08090f] text-neutral-300">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-white mb-3">About this directory</h2>
          <p className="max-w-3xl">
            FounderFlow lists {companies.length.toLocaleString()} early-stage startups along with the
            founders and hiring contacts behind them. Most of these companies never post a public job
            listing, so the directory is built for reaching out directly: filter by role, see when a
            company last listed a need, and contact the person who is actually hiring. Records are
            compiled from public sources and can go stale, which is why every listing shows when it
            was published. See{' '}
            <Link href="/blog/how-we-verify-contact-data" className="text-white underline underline-offset-2">
              how contact data is verified
            </Link>{' '}
            or{' '}
            <Link href="/about" className="text-white underline underline-offset-2">
              who runs FounderFlow
            </Link>.
          </p>

          {topHubs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-3">Browse companies by role</h2>
              <ul className="flex flex-wrap gap-2">
                {topHubs.map(h => (
                  <li key={h.slug}>
                    <Link
                      href={`/companies/hiring-for/${h.slug}`}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs hover:bg-white/10 transition-colors"
                      style={{ border: '1px solid rgba(180,151,214,.25)', color: 'rgba(180,151,214,.9)' }}
                    >
                      {h.role} ({h.companies.length})
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/companies/hiring-for" className="inline-flex items-center px-3 py-1 text-xs text-neutral-400 hover:text-white transition-colors">
                    All roles →
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {recent.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-3">Recently listed companies</h2>
              <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map(c => (
                  <li key={c.slug}>
                    <Link href={`/companies/${c.slug}`} className="hover:text-white transition-colors">
                      {c.displayName}
                    </Link>
                    <span className="text-neutral-500"> · {c.lastPublished}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                <Link href="/companies" className="text-white underline underline-offset-2">
                  Browse all {companies.length.toLocaleString()} companies
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
