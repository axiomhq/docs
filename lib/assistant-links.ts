import { defaultUrlTransform } from 'streamdown';
import { withDocsBasePath } from './docs-paths';

// Tool URLs are canonical; Markdown within those pages can still contain the
// root-relative paths from before the /docs migration.
export function assistantSourcePaths(urls: string[]) {
  return [...new Set(urls
    .map((url) => url.split(/[?#]/, 1)[0])
    .filter((path) => path === '/docs' || path.startsWith('/docs/')))]
    .sort();
}

export function createAssistantUrlTransform(sourcePaths: string[]): typeof defaultUrlTransform {
  const knownPaths = new Set(sourcePaths);

  return (url, key, node) => {
    const safeUrl = defaultUrlTransform(url, key, node);
    if (!safeUrl || key !== 'href' || safeUrl.startsWith('//')) return safeUrl;

    // Match the article renderer's convention: root-relative links belong to
    // the docs zone. Parse query/hash separately so /docs#section stays intact.
    if (safeUrl.startsWith('/')) {
      const target = new URL(safeUrl, 'https://axiom.co');
      return `${withDocsBasePath(target.pathname)}${target.search}${target.hash}`;
    }

    if (!/^https?:\/\//i.test(safeUrl)) return safeUrl;
    try {
      const target = new URL(safeUrl);
      const docsPath = withDocsBasePath(target.pathname);
      // Only repair absolute URLs backed by retrieval. Marketing pages such
      // as https://axiom.co/pricing and external links keep their destination.
      if (target.hostname === 'axiom.co' && !target.port && knownPaths.has(docsPath)) {
        target.pathname = docsPath;
        return target.href;
      }
    } catch {
      // Leave malformed values to Streamdown's normal sanitization pipeline.
    }
    return safeUrl;
  };
}
