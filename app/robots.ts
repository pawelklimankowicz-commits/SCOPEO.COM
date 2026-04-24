import type { MetadataRoute } from 'next';
import { getSiteBaseUrl } from '@/lib/site-base-url';

/**
 * Wskazanie na sitemap + ograniczenie crawlu obszarów prywatnych / API.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteBaseUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard',
        '/onboarding',
        '/settings',
        '/reset-password',
        // Auth UI — indeksowanie stron logowania zwykle nie wspiera celu SEO
        '/login',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
