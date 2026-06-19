import type { MetadataRoute } from 'next'

const base = 'https://sealed2016.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: base, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/sample`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/contact`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
  ]
}
