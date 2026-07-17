// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { redirects } from '@/lib/redirects.mjs';

describe('legacy redirects', () => {
  it('keeps every configured redirect under the /docs deployment root', () => {
    expect(redirects).toHaveLength(115);
    expect(redirects.every((redirect) => redirect.source.startsWith('/docs'))).toBe(true);
    expect(redirects.every((redirect) => redirect.destination.startsWith('/docs') || redirect.destination.startsWith('http'))).toBe(true);
  });

  it('translates wildcards to Next.js path parameters', () => {
    const wildcard = redirects.find((redirect) => redirect.source.includes(':path*'));
    expect(wildcard?.source.endsWith('/:path*')).toBe(true);
  });
});
