import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getCompanyBySlug, listCompanies, getRelatedCompanies, listRoleHubs, roleToSlug } from '../../../lib/companies';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import CompanyActions from './CompanyActions';
import CompanyPageTabs from './CompanyPageTabs';
import BackButton from './BackButton';

export const dynamicParams = true;

export async function generateStaticParams() {
  const companies = await listCompanies();
  return companies.slice(0, 500).map(c => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCompanyBySlug(slug);
  if (!result) return { title: 'Company not found | FounderFlow' };
  const { company } = result;
  return {
    title: `${company.displayName} — Open roles & hiring history | FounderFlow`,
    description: company.bestCompanyInfo || `See all roles and contacts at ${company.displayName} on FounderFlow.`,
    alternates: { canonical: `https://www.founderflow.space/companies/${slug}` },
    openGraph: {
      title: `${company.displayName} | FounderFlow`,
      description: company.bestCompanyInfo || `Hiring history and contacts for ${company.displayName}.`,
      url: `https://www.founderflow.space/companies/${slug}`,
    },
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCompanyBySlug(slug);
  if (!result) notFound();

  const { company, entries, contacts } = result;
  const faviconUrl = company.domain
    ? `https://icons.duckduckgo.com/ip3/${company.domain}.ico`
    : null;
  const relatedCompanies = await getRelatedCompanies(slug);
  const roleHubs = await listRoleHubs();
  const hubbedRoles = new Set(roleHubs.map(h => h.role));

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentEntries = entries.filter(e => e.published && new Date(e.published) >= ninetyDaysAgo);
  const olderEntries = entries.filter(e => !e.published || new Date(e.published) < ninetyDaysAgo);

  // JobPosting markup was removed: FounderFlow isn't the hiringOrganization and these
  // pages have no apply flow, so per-posting JobPosting schema can't meet Google's
  // policy requirements (see 2026-09-22 SEO audit — sitewide "n/a" titles, missing
  // validThrough/employmentType/baseSalary, manual-action risk at ~2,091-page scale).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: company.displayName,
        url: entries.find(e => e.company_url)?.company_url,
        logo: faviconUrl ?? undefined,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.founderflow.space' },
          { '@type': 'ListItem', position: 2, name: 'Companies', item: 'https://www.founderflow.space/companies' },
          { '@type': 'ListItem', position: 3, name: company.displayName, item: `https://www.founderflow.space/companies/${slug}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-16">
        <BackButton />

        {/* Company header card */}
        <div
          className="card-elevated mt-5 mb-6 p-5 sm:p-6"
          style={{ boxShadow: '0 -2px 30px rgba(0,0,0,.4), 0 0 60px rgba(180,151,214,.05)' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="card-initials h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-xl font-bold"
            >
              {faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={faviconUrl} alt="" width={40} height={40} className="w-9 h-9 rounded-sm" />
              ) : (
                <span>{company.displayName[0]?.toUpperCase() ?? '?'}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl sm:text-2xl">{company.displayName}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(180,151,214,.10)', border: '1px solid rgba(180,151,214,.20)', color: 'rgba(180,151,214,.8)' }}
                    >
                      {company.roleCount} role{company.roleCount !== 1 ? 's' : ''}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.45)' }}
                    >
                      {company.contactCount} contact{company.contactCount !== 1 ? 's' : ''}
                    </span>
                    {company.lastPublished && (
                      <span style={{ color: 'rgba(255,255,255,.25)' }}>Last seen {company.lastPublished}</span>
                    )}
                    {company.domain && (
                      <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline transition-colors"
                        style={{ color: 'rgba(180,151,214,.7)' }}
                      >
                        {company.domain} ↗
                      </a>
                    )}
                  </div>
                </div>
                <CompanyActions slug={slug} company={company} />
              </div>

              {company.bestCompanyInfo && (
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.5)' }}>
                  {company.bestCompanyInfo}
                </p>
              )}

              {company.firstPublished && company.firstPublished !== company.lastPublished && (
                <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,.3)' }}>
                  Hiring history: first listed {company.firstPublished}, {company.roleCount} roles posted through {company.lastPublished}.
                </p>
              )}

              {company.roleKeywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {company.roleKeywords.map((role) =>
                    hubbedRoles.has(role) ? (
                      <Link
                        key={role}
                        href={`/companies/hiring-for/${roleToSlug(role)}`}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] transition-colors hover:bg-white/10"
                        style={{ border: '1px solid rgba(180,151,214,.2)', color: 'rgba(180,151,214,.75)' }}
                      >
                        {role}
                      </Link>
                    ) : (
                      <span
                        key={role}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px]"
                        style={{ border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.4)' }}
                      >
                        {role}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed content */}
        <CompanyPageTabs
          entries={entries}
          contacts={contacts}
          recentEntries={recentEntries}
          olderEntries={olderEntries}
          companyDisplayName={company.displayName}
          companyInfo={company.bestCompanyInfo}
        />

        {relatedCompanies.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Other companies hiring for similar roles
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {relatedCompanies.map((related) => (
                <Link
                  key={related.slug}
                  href={`/companies/${related.slug}`}
                  className="rounded-lg p-3 text-sm transition-colors hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)' }}
                >
                  {related.displayName}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
