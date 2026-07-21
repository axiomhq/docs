import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';
import { plainSearchText, rankDocsSearchResults } from '@/lib/docs-search-rank';

export type DocsSearchResult = {
  type: string;
  title: string;
  content: string;
  url: string;
  breadcrumbs: string[];
};

export type DocsPageContext = {
  title: string;
  url: string;
  content: string;
};

export const docsSearch = createFromSource(source);
const pageTitles = new Map(source.getPages().map((page) => [page.url, page.data.title]));

export async function searchDocs(query: string, limit = 8): Promise<DocsSearchResult[]> {
  const normalizedQuery = query.trim().slice(0, 240);
  if (!normalizedQuery) return [];

  const requestedLimit = Math.min(Math.max(limit, 1), 12);
  const results = await docsSearch.search(normalizedQuery, { limit: 80 });
  const ranked = rankDocsSearchResults(results, normalizedQuery, requestedLimit);

  return ranked.map((result) => {
    const content = plainSearchText(result.content);
    const breadcrumbs = result.breadcrumbs ?? [];
    const pageUrl = result.url.split('#', 1)[0];

    return {
      type: result.type,
      title: pageTitles.get(pageUrl) ?? (result.type === 'page' ? content : breadcrumbs.at(-1) ?? content),
      content: content.slice(0, 1_600),
      url: result.url,
      breadcrumbs,
    };
  });
}

export async function readDocsPage(url: string): Promise<DocsPageContext | null> {
  if (!url.startsWith('/docs')) return null;
  const pathname = url.split('#', 1)[0].split('?', 1)[0];
  const page = source.getPages().find((candidate) => candidate.url === pathname);
  if (!page || !('getText' in page.data)) return null;

  const content = await page.data.getText('processed');
  return {
    title: page.data.title,
    url: page.url,
    content: content.slice(0, 18_000),
  };
}
