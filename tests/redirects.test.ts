// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { redirects } from '@/lib/redirects.mjs';

describe('legacy redirects', () => {
  // A floor, not a fixed count: adding redirects is routine, losing them breaks inbound links.
  it('keeps every configured redirect under the /docs deployment root', () => {
    expect(redirects.length).toBeGreaterThanOrEqual(117);
    expect(redirects.every((redirect) => redirect.source.startsWith('/docs'))).toBe(true);
    expect(redirects.every((redirect) => redirect.destination.startsWith('/docs') || redirect.destination.startsWith('http'))).toBe(true);
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
});

describe('legacy .md redirects', () => {
  it('mirrors every non-wildcard redirect at its .md twin', () => {
    const pages = redirects.filter((redirect) => !redirect.source.endsWith('.md') && !redirect.source.includes(':path*'));
    const markdown = new Set(redirects.filter((redirect) => redirect.source.endsWith('.md')).map((redirect) => redirect.source));
    const missing = pages.filter((redirect) => !markdown.has(`${redirect.source}.md`));
    expect(missing).toEqual([]);
  });

  it('points .md sources at .md destinations', () => {
    const markdown = redirects.filter((redirect) => redirect.source.endsWith('.md'));
    expect(markdown.length).toBeGreaterThan(0);
    expect(markdown.every((redirect) => redirect.destination.endsWith('.md'))).toBe(true);
  });
});
