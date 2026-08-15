import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { docsApiPath, normalizeDocsUrl, withDocsBasePath, withoutDocsBasePath } from '@/lib/docs-paths';
import { rankDocsSearchResults, sanitizeSearchSnippet } from '@/lib/docs-search-rank';
import { hashRateLimitIdentifier, takeLocalRateLimit } from '@/lib/request-rate-limit';

vi.mock('@/lib/docs-search', () => ({
  searchDocs: vi.fn(async () => []),
  readDocsPage: vi.fn(async () => null),
}));

describe('documentation zone paths', () => {
  it('keeps public routes under /docs without double-prefixing them', () => {
    expect(withDocsBasePath('/getting-started')).toBe('/docs/getting-started');
    expect(withDocsBasePath('/docs/getting-started')).toBe('/docs/getting-started');
    expect(withoutDocsBasePath('/docs/getting-started')).toBe('/getting-started');
    expect(docsApiPath('/search')).toBe('/docs/api/search');
  });
});

function chatRequest(body: string, client = crypto.randomUUID()) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': client },
    body,
  });
}

afterEach(() => vi.unstubAllEnvs());

describe('documentation AI retrieval', () => {
  it('ranks multi-term documentation matches ahead of partial keyword matches', async () => {
    const results = rankDocsSearchResults([
      { type: 'text', content: 'Search for a term over the dataset in scope.', url: '/docs/apl/search#dataset', breadcrumbs: ['APL', 'search'] },
      { type: 'heading', content: 'Set default dataset retention period', url: '/docs/reference/organization-settings#set-default-dataset-retention-period', breadcrumbs: ['Reference', 'Organization settings'] },
      { type: 'text', content: 'Specify the default dataset retention period.', url: '/docs/reference/organization-settings#set-default-dataset-retention-period', breadcrumbs: ['Reference', 'Organization settings'] },
    ], 'dataset retention', 3);

    expect(results[0].url).toContain('organization-settings');
    expect(results[1].url).toContain('organization-settings');
    expect(results[2].url).toContain('/apl/search');
  });

  it('promotes results that match filter and array over array-only function pages', () => {
    const results = rankDocsSearchResults([
      { type: 'page', content: '<mark>array</mark>_sum', url: '/docs/apl/array-sum', breadcrumbs: ['APL', 'Array functions'] },
      { type: 'page', content: '<mark>array</mark>_rotate_left', url: '/docs/apl/array-rotate-left', breadcrumbs: ['APL', 'Array functions'] },
      { type: 'text', content: 'Use array_iff to <mark>filter</mark> values in an <mark>array</mark> by condition.', url: '/docs/apl/array-iff#examples', breadcrumbs: ['APL', 'Array functions', 'array_iff'] },
      { type: 'text', content: 'Use array_select_dict when filtering dictionaries in an array.', url: '/docs/apl/array-select-dict', breadcrumbs: ['APL', 'Array functions', 'array_select_dict'] },
    ], 'filter array', 4);

    expect(results.slice(0, 2).map((result) => result.url)).toEqual([
      '/docs/apl/array-iff#examples',
      '/docs/apl/array-select-dict',
    ]);
  });

  it('removes Markdown formatting without removing highlighted search terms', () => {
    expect(sanitizeSearchSnippet('**<mark>Splunk</mark>:** Use `search` with [APL](/docs/apl).')).toBe(
      '<mark>Splunk</mark>: Use search with APL.',
    );
  });
});

describe('documentation icon mapping', () => {
  it('maps every <Icon> name used in content to a real lucide glyph', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { FA_TO_LUCIDE, resolveDocIcon } = await import('@/lib/doc-icons');

    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.mdx')) files.push(full);
      }
    };
    walk('content');

    const used = new Set<string>();
    for (const file of files) {
      for (const match of readFileSync(file, 'utf8').matchAll(/<Icon[^>]*\bicon="([^"]+)"/g)) {
        used.add(match[1]);
      }
    }

    expect(used.size).toBeGreaterThan(20);
    // A name with no mapping renders nothing at all, silently dropping the glyph the
    // surrounding sentence refers to — so an unmapped name must fail CI, not ship.
    expect([...used].filter((name) => !resolveDocIcon(name))).toEqual([]);
    // And no mapping should point at a lucide export that does not exist.
    expect(Object.keys(FA_TO_LUCIDE).filter((name) => !resolveDocIcon(name))).toEqual([]);
  });
});

describe('documentation page tool input', () => {
  it('accepts the URL shapes a model actually produces', () => {
    expect(normalizeDocsUrl('/docs/query-data/datasets')).toBe('/docs/query-data/datasets');
    expect(normalizeDocsUrl('https://axiom.co/docs/apps/grafana')).toBe('/docs/apps/grafana');
    expect(normalizeDocsUrl('/apps/grafana')).toBe('/docs/apps/grafana');
    expect(normalizeDocsUrl('apps/grafana')).toBe('/docs/apps/grafana');
    expect(normalizeDocsUrl('  /docs/getting-started  ')).toBe('/docs/getting-started');
  });

  it('never resolves outside /docs, whatever it is handed', () => {
    const hostile = [
      '../../etc/passwd',
      '/../../etc/passwd',
      'https://evil.example.com/../../etc/passwd',
      'https://evil.example.com/steal',
      'javascript:alert(1)',
      'file:///etc/passwd',
      '//evil.example.com/steal',
      'data:text/html,<script>alert(1)</script>',
      '',
    ];

    for (const input of hostile) {
      const result = normalizeDocsUrl(input);
      // Containment is the invariant the removed schema regex used to provide:
      // every accepted path stays under /docs, and readDocsPage then exact-matches
      // it against source.getPages() before reading anything.
      expect(result === null || result.startsWith('/docs')).toBe(true);
      expect(result === null || !result.split('/').includes('..')).toBe(true);
    }
  });

  it('rejects traversal instead of leaning on the page lookup to miss', () => {
    expect(normalizeDocsUrl('../../etc/passwd')).toBeNull();
    expect(normalizeDocsUrl('/docs/../../../etc/passwd')).toBeNull();
    expect(normalizeDocsUrl('/docs/query-data/../query-data/datasets')).toBeNull();
  });
});

describe('documentation AI request controls', () => {
  it('requires server-side provider configuration', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const response = await POST(chatRequest(JSON.stringify({ messages: [] })));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'The documentation assistant is not configured.' });
  });

  it('rejects invalid and oversized requests before contacting a model', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');

    const invalid = await POST(chatRequest('{', 'invalid-body'));
    expect(invalid.status).toBe(400);

    const oversized = await POST(chatRequest('x'.repeat(65 * 1024), 'oversized-body'));
    expect(oversized.status).toBe(413);
  });

  it('rate limits repeated assistant requests without storing message content', () => {
    const id = `test-${crypto.randomUUID()}`;
    for (let index = 0; index < 12; index += 1) {
      expect(takeLocalRateLimit('chat', id, 1_000).allowed).toBe(true);
    }
    const blocked = takeLocalRateLimit('chat', id, 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
    expect(takeLocalRateLimit('chat', id, 61_001).allowed).toBe(true);
  });

  it('hashes client identifiers before they can be used as Redis keys', () => {
    const identifier = '203.0.113.42';
    const hashed = hashRateLimitIdentifier(identifier);
    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
    expect(hashed).not.toContain(identifier);
  });
});
