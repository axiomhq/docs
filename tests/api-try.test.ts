import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/try/route';

function request(body: unknown) {
  return new Request('http://localhost/api/try', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.restoreAllMocks());

describe('API try proxy', () => {
  it('rejects missing credentials and undocumented operations', async () => {
    const missingToken = await POST(request({ operation: 'v2 get /tokens/{id}' }));
    expect(missingToken.status).toBe(400);
    await expect(missingToken.json()).resolves.toEqual({ error: 'Enter an API token before running the request.' });

    const unknown = await POST(request({ operation: 'v2 get https://example.com', token: 'secret' }));
    expect(unknown.status).toBe(400);
    await expect(unknown.json()).resolves.toEqual({ error: 'This API operation is not available.' });
  });

  it('requires documented path parameters before making a request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await POST(request({ operation: 'v2 get /tokens/{id}', token: 'secret', parameters: {} }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Enter a value for id.' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('requires an organization ID for both PAT prefix variants', async () => {
    for (const token of ['xapt-test', 'xaapt-test']) {
      const response = await POST(request({ operation: 'v2 get /tokens/{id}', token, parameters: { id: 'token-id' } }));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Enter your organization ID when using a personal access token.' });
    }
  });

  it('only forwards a documented request to the fixed Axiom host', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"id":"token-id"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }));
    const response = await POST(request({
      operation: 'v2 get /tokens/{id}',
      token: 'secret',
      orgId: 'org-id',
      parameters: { id: 'token id' },
    }));

    expect(response.status).toBe(200);
    const [target, init] = fetchSpy.mock.calls[0];
    expect(String(target)).toBe('https://api.axiom.co/v2/tokens/token%20id');
    expect(init?.method).toBe('GET');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer secret');
    expect(new Headers(init?.headers).get('X-Axiom-Org-Id')).toBe('org-id');
    await expect(response.json()).resolves.toMatchObject({ status: 200, contentType: 'application/json', body: '{"id":"token-id"}' });
  });
});
