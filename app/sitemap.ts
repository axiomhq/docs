import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://axiom.co';
  return [{ url: `${origin}/docs`, priority: 1 }, ...source.getPages().filter((page) => !page.data.noindex).map((page) => ({ url: `${origin}${page.url}`, priority: 0.7 }))];
}
