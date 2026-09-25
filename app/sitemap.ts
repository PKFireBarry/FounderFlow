import { MetadataRoute } from 'next'
import { listCompanies, listRoleHubs } from '../lib/companies'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.founderflow.space'

  const companies = await listCompanies()
  const companyUrls: MetadataRoute.Sitemap = companies.map(c => ({
    url: `${baseUrl}/companies/${c.slug}`,
    lastModified: c.lastPublished ? new Date(c.lastPublished) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const roleHubs = await listRoleHubs()
  const roleHubUrls: MetadataRoute.Sitemap = roleHubs.map(h => ({
    url: `${baseUrl}/companies/hiring-for/${h.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.65,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/opportunities`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/companies/hiring-for`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/data-removal`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
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
