import type { MetadataRoute } from 'next';

/**
 * Serves staging hosts only. In production the docs app is proxied at
 * axiom.co/docs, and /robots.txt sits outside that prefix — the marketing app
 * owns it. robots.txt is only honoured at an origin root, so this file never
 * runs for axiom.co; declaring the docs sitemap there is a change to www.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://axiom.co';
  return { rules: { userAgent: '*', allow: '/docs/' }, sitemap: `${origin}/docs/sitemap.xml` };
}
