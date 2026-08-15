export const DOCS_BASE_PATH = '/docs';

export function withDocsBasePath(pathname: string) {
  if (!pathname.startsWith('/') || pathname === DOCS_BASE_PATH || pathname.startsWith(`${DOCS_BASE_PATH}/`)) {
    return pathname;
  }
  return `${DOCS_BASE_PATH}${pathname}`;
}

export function withoutDocsBasePath(pathname: string) {
  if (pathname === DOCS_BASE_PATH) return '/';
  if (pathname.startsWith(`${DOCS_BASE_PATH}/`)) return pathname.slice(DOCS_BASE_PATH.length);
  return pathname;
}

export function docsApiPath(pathname: string) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withDocsBasePath(`/api${normalized}`);
}

// Models routinely hand back an absolute URL or drop the /docs prefix. Rejecting
// those in the input schema turns a recoverable miss into a hard tool error, so
// normalize here instead and let readDocsPage do the real validation — it only
// resolves against source.getPages(), which is an allowlist by construction.
export function normalizeDocsUrl(url: string) {
  let path = url.trim();
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return null;
    }
  }
  if (!path.startsWith('/')) path = `/${path}`;
  if (!path.startsWith('/docs')) path = `/docs${path}`;
  // Reject traversal outright rather than relying on the page lookup to miss.
  // Containment is then self-evident here instead of an emergent property of
  // readDocsPage's allowlist.
  if (path.split('/').includes('..')) return null;
  return path.startsWith('/docs') ? path : null;
}
