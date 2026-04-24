import type { MetadataRoute } from 'next';
import { getSiteBaseUrl } from '@/lib/site-base-url';

/**
 * Indeksowalne strony publiczne (grupa marketingu). Bez: dashboard, app, noindex, aliasów redirect.
 * Po dodaniu nowej strony w katalogu app/(marketing) — dopisz ścieżkę w tablicy ENTRIES.
 */
type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

const ENTRIES: Array<{
  path: string;
  changeFrequency: ChangeFreq;
  priority: number;
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/cennik', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/produkt', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/jak-dziala', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/slad-weglowy', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/dla-kogo', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/o-nas', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/kontakt', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/wiedza/rynek-i-metodyka', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/regulamin', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/polityka-prywatnosci', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.45 },
  { path: '/dpa', changeFrequency: 'yearly', priority: 0.45 },
  { path: '/klauzule-formularzy', changeFrequency: 'yearly', priority: 0.45 },
  { path: '/kontakt-prawny', changeFrequency: 'yearly', priority: 0.45 },
  { path: '/prawne', changeFrequency: 'yearly', priority: 0.45 },
  // Pomijamy: marka-preview (noindex), carbon-footprint (przekierowanie 301 na slad-weglowy)
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteBaseUrl();
  const now = new Date();
  return ENTRIES.map((e) => ({
    url: `${base}${e.path === '/' ? '' : e.path}`,
    lastModified: now,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
