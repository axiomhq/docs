'use client';

import { ChevronRight, LoaderCircle, Play } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { isPersonalAccessToken } from '@/lib/token';

export type ApiTryItParameter = {
  name: string;
  location?: string;
  required: boolean;
  description?: string;
  example?: unknown;
};

type TryResult = {
  status: number;
  statusText: string;
  contentType?: string;
  body: string;
};

const tokenKey = 'axiom-docs-try-token';
const orgKey = 'axiom-docs-try-org';

function initialValues(items: ApiTryItParameter[]) {
  return Object.fromEntries(items.map((item) => [item.name, item.example == null ? '' : String(item.example)]));
}

function prettyBody(value: string, contentType = '') {
  if (!value || !contentType.includes('json')) return value;
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export function ApiTryIt({
  operation,
  method,
  parameters,
  serverVariables,
  bodyType,
  bodyExample,
}: {
  operation: string;
  method: string;
  parameters: ApiTryItParameter[];
  serverVariables: ApiTryItParameter[];
  bodyType?: string;
  bodyExample?: unknown;
}) {
  const [token, setToken] = useState('');
  const [orgId, setOrgId] = useState('');
  const [values, setValues] = useState(() => initialValues(parameters));
  const [variables, setVariables] = useState(() => initialValues(serverVariables));
  const [body, setBody] = useState(() => bodyType ? JSON.stringify(bodyExample, null, 2) : '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TryResult>();

  useEffect(() => {
    const hydrationTimeout = window.setTimeout(() => {
      setToken(window.sessionStorage.getItem(tokenKey) ?? '');
      setOrgId(window.sessionStorage.getItem(orgKey) ?? '');
    }, 0);
    return () => window.clearTimeout(hydrationTimeout);
  }, []);

  const visibleParameters = useMemo(() => parameters.filter((item) => item.location === 'path' || item.location === 'query'), [parameters]);
  const personalToken = isPersonalAccessToken(token);

  function persistCredential(key: string, value: string, update: (next: string) => void) {
    update(value);
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  }

  async function runRequest() {
    setPending(true);
    setError('');
    setResult(undefined);
    try {
      const response = await fetch('/api/try', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, token, orgId, parameters: values, serverVariables: variables, body: bodyType ? body : undefined }),
      });
      const payload = await response.json() as TryResult & { error?: string };
      if (!response.ok && payload.error) throw new Error(payload.error);
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request could not be completed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="api-try">
      <summary><span className="api-try-chevron"><ChevronRight size={14} /></span><span><strong>Try it</strong><small>Run this request against your Axiom organization</small></span></summary>
      <div className="api-try-panel">
        <p>Credentials stay in this browser tab and are only sent to Axiom when you run the request.</p>
        <div className="api-try-fields">
          <label><span>API token <b>Required</b></span><input data-ph-no-capture type="password" autoComplete="off" value={token} onChange={(event) => persistCredential(tokenKey, event.target.value, setToken)} placeholder="xaat-…" /></label>
          <label><span>Organization ID {personalToken ? <b>Required for PAT</b> : <em>Optional for API token</em>}</span><input data-ph-no-capture type="text" autoComplete="off" value={orgId} onChange={(event) => persistCredential(orgKey, event.target.value, setOrgId)} placeholder="Your organization ID" /></label>
          {serverVariables.map((item) => <label key={item.name}><span>{item.name} {item.required && <b>Required</b>}</span><input value={variables[item.name] ?? ''} onChange={(event) => setVariables((current) => ({ ...current, [item.name]: event.target.value }))} placeholder={item.description} /></label>)}
          {visibleParameters.map((item) => <label key={`${item.location}-${item.name}`}><span>{item.name} <code>{item.location}</code>{item.required && <b>Required</b>}</span><input value={values[item.name] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [item.name]: event.target.value }))} placeholder={item.description} /></label>)}
          {bodyType && <label className="api-try-body"><span>Request body <code>{bodyType}</code></span><textarea value={body} onChange={(event) => setBody(event.target.value)} spellCheck={false} /></label>}
        </div>
        {personalToken && !orgId && <p className="api-try-guidance">Personal access tokens require an organization ID. Find it in <strong>Settings → General</strong> or in your Axiom app URL. <Link href="/docs/reference/tokens#determine-organization-id">Learn more</Link>.</p>}
        <div className="api-try-actions"><button type="button" disabled={pending || !token || (personalToken && !orgId)} onClick={runRequest}>{pending ? <LoaderCircle className="api-try-spinner" size={13} /> : <Play size={12} />}{pending ? 'Running…' : `Run ${method.toUpperCase()} request`}</button></div>
        {error && <p className="api-try-error" role="alert">{error}</p>}
        {result && <div className="api-try-result"><div><span className={result.status >= 200 && result.status < 300 ? 'status-dot success' : 'status-dot error'} /><strong>{result.status} {result.statusText}</strong><small>{result.contentType}</small></div><pre><code>{prettyBody(result.body, result.contentType)}</code></pre></div>}
      </div>
    </details>
  );
}
