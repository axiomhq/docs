// @vitest-environment node

import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { redirects } from '@/lib/redirects.mjs';

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function documentationRoutes() {
  const docsRoot = path.join(process.cwd(), 'content/docs');
  return new Set(
    walk(docsRoot)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) =>
        `/${path
          .relative(docsRoot, file)
          .replace(/^\([^/]+\)\//, '')
          .replace(/\.mdx$/, '')
          .replace(/\/index$/, '')}`,
      ),
  );
}

describe('legacy redirects', () => {
  // A floor, not a fixed count: adding redirects is routine, losing them breaks inbound links.
  it('keeps redirects app-relative so Next can apply the /docs base path', () => {
    expect(redirects.length).toBeGreaterThanOrEqual(117);
    expect(redirects.every((redirect) => redirect.source.startsWith('/') && !redirect.source.startsWith('/docs/'))).toBe(true);
    expect(redirects.every((redirect) => (redirect.destination.startsWith('/') && !redirect.destination.startsWith('/docs/')) || redirect.destination.startsWith('http'))).toBe(true);
  });

  it('is permanent, so inbound ranking signal is passed on', () => {
    expect(redirects.every((redirect) => redirect.permanent)).toBe(true);
  });

  it('has no duplicate sources, which would make the later entry unreachable', () => {
    const sources = redirects.map((redirect) => redirect.source);
    expect(sources).toHaveLength(new Set(sources).size);
  });

  it('never redirects a path to itself', () => {
    expect(redirects.filter((redirect) => redirect.source === redirect.destination)).toEqual([]);
  });

  it('translates wildcards to Next.js path parameters', () => {
    const wildcard = redirects.find((redirect) => redirect.source.includes(':path*'));
    expect(wildcard?.source.endsWith('/:path*')).toBe(true);
  });

  it('ultimately resolves every internal destination to a documentation page', () => {
    const pages = documentationRoutes();
    const pageRedirects = new Map(
      redirects
        .filter((redirect) => !redirect.source.endsWith('.md'))
        .map((redirect) => [redirect.source, redirect.destination]),
    );
    const unresolved = [];

    for (const [sourcePath, firstDestination] of pageRedirects) {
      if (sourcePath.includes(':path*')) continue;
      let destination = firstDestination;
      const visited = new Set([sourcePath]);

      while (
        destination.startsWith('/') &&
        !pages.has(destination) &&
        destination !== '/'
      ) {
        if (visited.has(destination)) break;
        visited.add(destination);
        const next = pageRedirects.get(destination);
        if (!next) break;
        destination = next;
      }

      if (
        destination.startsWith('/') &&
        destination !== '/' &&
        !pages.has(destination)
      ) {
        unresolved.push({ source: sourcePath, destination });
      }
    }

    expect(unresolved).toEqual([]);
  });
});

// Route handlers under app serve real URLs; a redirect at one of those paths would shadow it,
// because redirects run before routes. Kept here so both suites below describe the same rule.
const HANDLER_ROUTES = ['/llms.txt', '/llms-full.txt', '/llms-apl.md'];

describe('legacy .md redirects', () => {
  it('mirrors every non-wildcard redirect at its .md twin', () => {
    // Two deliberate exclusions: the app root, which has no markdown twin, and any source whose
    // twin would land on a route handler.
    const appRoot = (path: string) => path === '/';
    const pages = redirects.filter(
      (redirect) =>
        !redirect.source.endsWith('.md') &&
        !redirect.source.includes(':path*') &&
        !appRoot(redirect.destination) &&
        !HANDLER_ROUTES.includes(`${redirect.source}.md`),
    );
    const markdown = new Set(redirects.filter((redirect) => redirect.source.endsWith('.md')).map((redirect) => redirect.source));
    const missing = pages.filter((redirect) => !markdown.has(`${redirect.source}.md`));
    expect(missing).toEqual([]);
  });

  it('never produces a .md twin for the docs root', () => {
    expect(redirects.filter((redirect) => redirect.destination === '/.md')).toEqual([]);
  });

  it('points .md sources at .md destinations', () => {
    const markdown = redirects.filter((redirect) => redirect.source.endsWith('.md'));
    expect(markdown.length).toBeGreaterThan(0);
    expect(markdown.every((redirect) => redirect.destination.endsWith('.md'))).toBe(true);
  });
});

describe('route handlers are not shadowed', () => {
  // Redirects run before routes, so a redirect at a handler's own URL makes the handler
  // unreachable. /docs/llms-apl.md once served a 136-byte stub instead of the 55 KB APL reference.
  it('never registers a redirect at a route handler path', () => {
    expect(redirects.filter((redirect) => HANDLER_ROUTES.includes(redirect.source))).toEqual([]);
  });
});
