import { MetadataRoute } from 'next'
import { listCompanies, listRoleHubs } from '../lib/companies'

// lastModified is only set where there's a real date behind it (the newest listing
// in the data, or a post's publish date). Using the build time for everything
// teaches crawlers to ignore lastmod, so pages with no real date omit it instead.
const toDate = (d: string) => (d ? new Date(d) : undefined)
const maxDate = (dates: string[]) => dates.filter(Boolean).sort().reverse()[0] ?? ''

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.founderflow.space'

  const companies = await listCompanies()
  const latestListing = maxDate(companies.map(c => c.lastPublished))

  const companyUrls: MetadataRoute.Sitemap = companies.map(c => ({
    url: `${baseUrl}/companies/${c.slug}`,
    lastModified: toDate(c.lastPublished),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const roleHubs = await listRoleHubs()
  const roleHubUrls: MetadataRoute.Sitemap = roleHubs.map(h => ({
    url: `${baseUrl}/companies/hiring-for/${h.slug}`,
    lastModified: toDate(maxDate(h.companies.map(c => c.lastPublished))),
    changeFrequency: 'weekly',
    priority: 0.65,
  }))

  return [
    {
      url: baseUrl,
      lastModified: toDate(latestListing),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/opportunities`,
      lastModified: toDate(latestListing),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: toDate(latestListing),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/companies/hiring-for`,
      lastModified: toDate(latestListing),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/data-removal`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date('2026-09-24'),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog/how-we-verify-contact-data`,
      lastModified: new Date('2026-09-24'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...roleHubUrls,
    ...companyUrls,
  ]
}
