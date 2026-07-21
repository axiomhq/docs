import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { takeAiRequest } from '@/lib/ai-rate-limit';
import { rankDocsSearchResults, sanitizeSearchSnippet } from '@/lib/docs-search-rank';

vi.mock('@/lib/docs-search', () => ({
  searchDocs: vi.fn(async () => []),
  readDocsPage: vi.fn(async () => null),
}));

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
      expect(takeAiRequest(id, 1_000).allowed).toBe(true);
    }
    const blocked = takeAiRequest(id, 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
    expect(takeAiRequest(id, 61_001).allowed).toBe(true);
  });
});
