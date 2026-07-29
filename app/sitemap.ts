import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://axiom.co';
  // `url` pages are link-out redirects, not documents — listing them advertises a 307 as content.
  const pages = source.getPages().filter((page) => !page.data.noindex && !page.data.url);

  // No <priority>: Google has stated it ignores the field, and a uniform 0.7 carries no information
  // anyway. No <lastmod> either — see the note in lib/structured-data.ts. The migration rewrote every
  // file, so the only date available is the migration's own, and stamping all 625 URLs with one
  // timestamp would replace production's genuine per-page dates with a claim no crawler should trust.
  return [{ url: `${origin}/docs` }, ...pages.map((page) => ({ url: `${origin}${page.url}` }))];
}
