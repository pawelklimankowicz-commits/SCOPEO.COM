/**
 * Kanoniczny URL witryny (sitemap, robots, open graph).
 * W produkcji ustaw `NEXT_PUBLIC_APP_URL` (np. https://app.scopeo.com).
 */
export function getSiteBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'http://localhost:3000';
}
