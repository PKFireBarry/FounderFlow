import { Metadata } from 'next';
import Link from 'next/link';
import { listRoleHubs } from '../../../lib/companies';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'Browse Startups by Role | FounderFlow',
  description: 'Find early-stage startups hiring for a specific role, from engineering to sales to operations.',
  alternates: {
    canonical: 'https://www.founderflow.space/companies/hiring-for',
  },
};

export default async function RoleHubIndexPage() {
  const hubs = await listRoleHubs();

  return (
    <div className="min-h-screen text-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Browse by Role</h1>
        <p className="text-sm text-neutral-400 mb-8">
          Startups in the directory, grouped by the kind of role they&apos;re trying to fill.
        </p>

        <div className="flex flex-wrap gap-2">
          {hubs.map((hub) => (
            <Link
              key={hub.slug}
              href={`/companies/hiring-for/${hub.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors"
              style={{
                border: '1px solid rgba(180,151,214,.25)',
                background: 'rgba(180,151,214,.08)',
                color: 'var(--wisteria)',
              }}
            >
              {hub.role}
              <span className="text-neutral-500">({hub.companies.length})</span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
