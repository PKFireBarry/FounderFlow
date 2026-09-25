import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { listRoleHubs, getRoleHubBySlug } from '../../../../lib/companies';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';

export const dynamicParams = true;

export async function generateStaticParams() {
  const hubs = await listRoleHubs();
  return hubs.map(h => ({ role: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params;
  const hub = await getRoleHubBySlug(role);
  if (!hub) return { title: 'Role not found | FounderFlow' };
  return {
    title: `${hub.role} roles at early-stage startups | FounderFlow`,
    description: `${hub.companies.length} early-stage startups currently looking to fill ${hub.role} roles, with direct founder contact info.`,
    alternates: { canonical: `https://www.founderflow.space/companies/hiring-for/${hub.slug}` },
    openGraph: {
      title: `${hub.role} roles at early-stage startups | FounderFlow`,
      description: `${hub.companies.length} early-stage startups hiring for ${hub.role} roles.`,
      url: `https://www.founderflow.space/companies/hiring-for/${hub.slug}`,
    },
  };
}

export default async function RoleHubPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const hub = await getRoleHubBySlug(role);
  if (!hub) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.founderflow.space' },
      { '@type': 'ListItem', position: 2, name: 'Companies', item: 'https://www.founderflow.space/companies' },
      { '@type': 'ListItem', position: 3, name: 'Browse by Role', item: 'https://www.founderflow.space/companies/hiring-for' },
      { '@type': 'ListItem', position: 4, name: hub.role, item: `https://www.founderflow.space/companies/hiring-for/${hub.slug}` },
    ],
  };

  return (
    <div className="min-h-screen text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-16">
        <p className="text-sm text-neutral-500 mb-2">
          <Link href="/companies/hiring-for" className="hover:text-neutral-300 transition-colors">Browse by Role</Link>
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{hub.role} roles</h1>
        <p className="text-sm text-neutral-400 mb-8">
          {hub.companies.length} early-stage {hub.companies.length === 1 ? 'startup' : 'startups'} currently looking to fill {hub.role} roles.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {hub.companies.map((company) => (
            <Link
              key={company.slug}
              href={`/companies/${company.slug}`}
              className="rounded-lg p-4 transition-colors hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)' }}
            >
              <div className="text-sm font-medium text-white">{company.displayName}</div>
              {company.bestCompanyInfo && (
                <div className="mt-1 text-xs text-neutral-500 line-clamp-2">{company.bestCompanyInfo}</div>
              )}
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
