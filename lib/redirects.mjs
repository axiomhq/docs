import { readFileSync } from 'node:fs';

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

export const redirects = config.redirects.map(({ source, destination }) => ({
  source: sourcePattern(source),
  destination: docsPath(destination),
  permanent: true,
}));
