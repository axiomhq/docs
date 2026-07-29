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
