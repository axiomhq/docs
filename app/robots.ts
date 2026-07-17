import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://axiom.co';
  return { rules: { userAgent: '*', allow: '/docs/' }, sitemap: `${origin}/sitemap.xml` };
}
