import { MetadataRoute } from 'next'
import { listCompanies } from '../lib/companies'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://founderflow.space'

  const companies = await listCompanies()
  const companySlugs: MetadataRoute.Sitemap = companies.map(c => ({
    url: `${baseUrl}/companies/${c.slug}`,
    lastModified: c.lastPublished ? new Date(c.lastPublished) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
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
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/outreach`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/billing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...companySlugs,
  ]
}
