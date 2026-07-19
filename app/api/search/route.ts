import { docsSearch } from '@/lib/docs-search';
import {
  plainSearchText,
  rankDocsSearchResults,
  sanitizeSearchSnippet,
} from '@/lib/docs-search-rank';
import { source } from '@/lib/source';

const SEARCH_CANDIDATE_LIMIT = 500;
const SEARCH_RESULT_LIMIT = 40;
const pageByUrl = new Map(source.getPages().map((page) => [page.url, page]));

function wordCount(value: string) {
  return plainSearchText(sanitizeSearchSnippet(value)).match(/[\p{L}\p{N}_-]+/gu)?.length ?? 0;
}

function shorten(value: string, limit = 18) {
  const words = plainSearchText(sanitizeSearchSnippet(value)).split(/\s+/).filter(Boolean);
  return words.slice(0, limit).join(' ').replace(/[.,;:!?]+$/, '');
}

function contextualSnippet(result: { type: string; content: string; url: string }) {
  const content = sanitizeSearchSnippet(result.content);
  if (wordCount(content) > 2) return content;

  const [pageUrl, anchor] = result.url.split('#', 2);
  const page = pageByUrl.get(pageUrl);
  if (!page) return content;

  if (result.type === 'page' && page.data.description && wordCount(page.data.description) > 4) {
    return `${content} — ${shorten(page.data.description)}…`;
  }

  const related = page.data.structuredData.contents.filter((item) => item.heading === anchor);
  const normalizedContent = plainSearchText(content).toLowerCase();
  const currentIndex = related.findIndex(
    (item) => plainSearchText(sanitizeSearchSnippet(item.content)).toLowerCase() === normalizedContent,
  );
  const ordered = currentIndex >= 0
    ? [...related.slice(currentIndex + 1), ...related.slice(0, currentIndex)]
    : related;
  const paragraph = ordered.find((item) => wordCount(item.content) > 4);

  return paragraph ? `${content} — ${shorten(paragraph.content)}…` : content;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('query')?.trim().slice(0, 240) ?? '';
  if (!query) return Response.json([]);

  const candidates = await docsSearch.search(query, { limit: SEARCH_CANDIDATE_LIMIT });
  const pageBreadcrumbs = new Map(
    candidates
      .filter((candidate) => candidate.type === 'page')
      .map((candidate) => [
        candidate.url,
        [...(candidate.breadcrumbs ?? []), plainSearchText(candidate.content)],
      ]),
  );
  const results = rankDocsSearchResults(candidates, query, SEARCH_RESULT_LIMIT).map((result) => ({
    ...result,
    content: contextualSnippet(result),
    breadcrumbs: result.breadcrumbs?.length
      ? result.breadcrumbs
      : pageBreadcrumbs.get(result.url.split('#', 1)[0]),
  }));

  return Response.json(results, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
