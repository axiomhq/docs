import { NextResponse } from 'next/server';
import { getApiOperation, resolveSchema } from '@/lib/openapi';
import { isPersonalAccessToken } from '@/lib/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TryRequest = {
  operation?: unknown;
  token?: unknown;
  orgId?: unknown;
  parameters?: unknown;
  serverVariables?: unknown;
  body?: unknown;
};

function stringRecord(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

function allowedHost(hostname: string) {
  return hostname === 'api.axiom.co' || hostname.endsWith('.edge.axiom.co');
}

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function readPreview(response: Response) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let output = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1_048_576) {
      await reader.cancel();
      throw new RangeError('response-too-large');
    }
    output += decoder.decode(value, { stream: true });
  }
  return output + decoder.decode();
}

export async function POST(request: Request) {
  let input: TryRequest;
  try {
    input = await request.json() as TryRequest;
  } catch {
    return error('The request body must be valid JSON.');
  }

  if (typeof input.operation !== 'string') return error('A documented API operation is required.');
  if (typeof input.token !== 'string' || !input.token.trim()) return error('Enter an API token before running the request.');
  if (input.token.length > 4096) return error('The API token is too long.');
  const personalToken = isPersonalAccessToken(input.token);
  if (personalToken && (typeof input.orgId !== 'string' || !input.orgId.trim())) {
    return error('Enter your organization ID when using a personal access token.');
  }
  const data = getApiOperation(input.operation);
  if (!data) return error('This API operation is not available.');

  const parameterValues = stringRecord(input.parameters);
  const serverValues = stringRecord(input.serverVariables);
  const parameters = [...(data.pathItem.parameters ?? []), ...(data.operation.parameters ?? [])].map((item) => resolveSchema(data.document, item) ?? item);

  const baseUrl = data.baseUrl.replace(/\{([^}]+)\}/g, (_, name: string) => encodeURI(serverValues[name]?.trim() ?? ''));
  if (/\{[^}]+\}/.test(baseUrl) || !baseUrl) return error('Complete the API host fields before running the request.');

  let apiPath = data.path;
  for (const parameter of parameters) {
    const value = parameterValues[parameter.name]?.trim() ?? '';
    if (parameter.required && !value) return error(`Enter a value for ${parameter.name}.`);
    if (parameter.in === 'path' && value) apiPath = apiPath.replace(`{${parameter.name}}`, encodeURIComponent(value));
  }
  if (/\{[^}]+\}/.test(apiPath)) return error('Complete all path parameters before running the request.');

  let target: URL;
  try {
    target = new URL(apiPath.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  } catch {
    return error('The documented API address is invalid.');
  }
  if (target.protocol !== 'https:' || target.username || target.password || (target.port && target.port !== '443') || !allowedHost(target.hostname)) {
    return error('The request target is not an allowed Axiom API host.');
  }
  for (const parameter of parameters) {
    const value = parameterValues[parameter.name]?.trim();
    if (parameter.in === 'query' && value) target.searchParams.set(parameter.name, value);
  }

  const content = data.operation.requestBody?.content as Record<string, unknown> | undefined;
  const contentType = content ? Object.keys(content)[0] : undefined;
  let body: string | undefined;
  if (contentType && typeof input.body === 'string') {
    if (input.body.length > 262_144) return error('The request body is too large.');
    if (contentType.includes('json')) {
      try {
        body = JSON.stringify(JSON.parse(input.body));
      } catch {
        return error('The request body must be valid JSON.');
      }
    } else {
      body = input.body;
    }
  }

  const headers = new Headers({ Authorization: `Bearer ${input.token.trim()}`, Accept: '*/*' });
  if (contentType && body !== undefined) headers.set('Content-Type', contentType);
  if (personalToken && typeof input.orgId === 'string' && input.orgId.trim()) headers.set('X-Axiom-Org-Id', input.orgId.trim());

  try {
    const upstream = await fetch(target, {
      method: data.method.toUpperCase(),
      headers,
      body,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const preview = await readPreview(upstream);
    return NextResponse.json({
      status: upstream.status,
      statusText: upstream.statusText,
      contentType: upstream.headers.get('content-type')?.split(';')[0] ?? '',
      body: preview,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (caught) {
    if (caught instanceof RangeError && caught.message === 'response-too-large') return error('The API response is larger than the 1 MB preview limit.', 413);
    const message = caught instanceof Error && caught.name === 'TimeoutError' ? 'The Axiom API did not respond within 15 seconds.' : 'The Axiom API request could not be completed.';
    return error(message, 502);
  }
}
