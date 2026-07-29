export type RankableSearchResult = {
  type: string;
  content: string;
  url: string;
  breadcrumbs?: string[];
};

export function plainSearchText(value: string) {
  return value
    .replace(/<\/?mark>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeSearchSnippet(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/g, '')
    .replace(/^\s*[-*+]\s+/g, '')
    .replace(/<(?!\/?mark\b)[^>]*>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ignoredQueryTerms = new Set(['a', 'an', 'and', 'do', 'for', 'how', 'i', 'in', 'is', 'of', 'on', 'or', 'the', 'to', 'with']);

function searchTerms(value: string) {
  return (value.toLowerCase().match(/[a-z0-9_-]+/g) ?? [])
    .filter((term) => term.length > 1 && !ignoredQueryTerms.has(term))
    .map((term) => term.length > 4 && term.endsWith('s') ? term.slice(0, -1) : term);
}

function queryTerms(query: string) {
  return [...new Set(searchTerms(query))];
}

function tokenMatchesTerm(token: string, term: string) {
  return token === term || ['s', 'es', 'ed', 'ing'].some((suffix) => token === `${term}${suffix}`);
}

function resultScore(result: RankableSearchResult, query: string) {
  const content = plainSearchText(result.content).toLowerCase();
  const breadcrumbs = (result.breadcrumbs ?? []).join(' ').toLowerCase();
  const haystack = `${breadcrumbs} ${content} ${result.url.toLowerCase()}`;
  const terms = queryTerms(query);
  const haystackTerms = searchTerms(haystack);
  const matches = terms.filter((term) => haystackTerms.some((token) => tokenMatchesTerm(token, term))).length;
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedTermPhrase = terms.join(' ');
  const normalizedHaystack = haystackTerms
    .map((token) => terms.find((term) => tokenMatchesTerm(token, term)) ?? token)
    .join(' ');
  const coverage = terms.length > 0 ? matches / terms.length : 0;

  return coverage * 100
    + matches * 12
    + (matches === terms.length && terms.length > 1 ? 60 : 0)
    + (haystack.includes(normalizedQuery) ? 180 : 0)
    + (terms.length > 1 && normalizedHaystack.includes(normalizedTermPhrase) ? 220 : 0)
    + (result.type === 'heading' ? 8 : result.type === 'page' ? 4 : 0);
}

export function rankDocsSearchResults<T extends RankableSearchResult>(results: T[], query: string, limit: number) {
  const perPage = new Map<string, number>();
  return [...results]
    .sort((a, b) => resultScore(b, query) - resultScore(a, query))
    .filter((result) => {
      const pageUrl = result.url.split('#', 1)[0];
      const count = perPage.get(pageUrl) ?? 0;
      if (count >= 2) return false;
      perPage.set(pageUrl, count + 1);
      return true;
    })
    .slice(0, limit);
}
