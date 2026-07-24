import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const config = JSON.parse(
  readFileSync(new URL('../docs.json', import.meta.url), 'utf8'),
);

function docsPath(path) {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/docs' || normalized.startsWith('/docs/')) {
    return normalized;
  }
  return `/docs${normalized}`;
}

function sourcePattern(path) {
  return docsPath(path).replace(/\/\*$/, '/:path*');
}

const pageRedirects = config.redirects.map(({ source, destination }) => ({
  source: sourcePattern(source),
  destination: docsPath(destination),
  permanent: true,
}));

/**
 * The machine-readable surface mirrors every page at `<path>.md`, and legacy `.md` URLs are live on
 * production today — `/docs/usage/analyze.md` 307s to `/docs/query-data/datasets.md`. Without these,
 * the `/docs/:path*.md` rewrite in next.config.mjs sends a legacy `.md` URL to `/api/md/<legacy>`,
 * which has no page behind it.
 *
 * Wildcards are skipped: `/docs/a/:path*.md` would only match a `.md` suffix on the final segment,
 * which is not what the wildcard means. External destinations are skipped for the same reason they
 * are left alone above — there is no `.md` twin to point at.
 *
 * The docs root is skipped too. `/docs/:path*.md` in next.config.mjs needs a path segment to rewrite,
 * so `/docs.md` matches nothing and the landing page has no markdown twin to redirect to.
 *
 * Route handlers are skipped as well, and this one bites: redirects run before routes, so a twin at
 * `/docs/llms-apl.md` would shadow the handler serving the 55 KB APL reference and hand readers a
 * 136-byte stub instead. Read from disk so a new handler cannot be shadowed by a stale list.
 */
const isDocsRoot = (target) => target === '/docs' || target === '/docs/';

const appDocsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../app/docs');
const handlerRoutes = new Set(
  readdirSync(appDocsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(appDocsDir, entry.name, 'route.ts')))
    .map((entry) => `/docs/${entry.name}`),
);

const markdownRedirects = pageRedirects
  .filter(
    (redirect) =>
      !redirect.source.includes(':path*') &&
      redirect.destination.startsWith('/docs') &&
      !isDocsRoot(redirect.destination) &&
      !handlerRoutes.has(`${redirect.source}.md`),
  )
  .map((redirect) => ({
    source: `${redirect.source}.md`,
    destination: `${redirect.destination}.md`,
    permanent: true,
  }));

export const redirects = [...pageRedirects, ...markdownRedirects];
