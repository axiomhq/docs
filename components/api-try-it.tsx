'use client';

import { ChevronRight, LoaderCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { ZoneLink as Link } from '@/components/zone-link';
import {
  analyticsTimestamp,
  captureDocsEvent,
  durationBucket,
  statusClass,
} from '@/lib/docs-analytics';
import { docsApiPath } from '@/lib/docs-paths';
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

// `.api-try-fields …` in globals.css.
const fieldLabelClass = 'min-w-0 flex flex-col gap-1.5';
const fieldLegendClass = 'text-(--text-secondary) font-mono text-[11px] leading-4 font-medium';
// No `!` on the contested properties below: the surviving unlayered
// `.doc-article .prose :where(strong, b)` (colour) and
// `.doc-article .prose :not(pre) > code` (padding/border/background/font) rules
// out-specify the originals today, so plain utilities must keep losing to them.
const fieldBadgeClass = 'ml-1.5 text-(--color-warning-text) font-mono text-[10px] leading-[14px] font-medium not-italic tracking-[.04em] uppercase';
const fieldNoteClass = 'ml-1.5 p-0 border-0 bg-transparent text-(--text-quaternary) font-mono text-[10px] leading-[14px] font-medium not-italic tracking-[.04em] uppercase';
const fieldControlClass = 'w-full border border-(--border-primary) rounded-[4px] outline-none text-(--text-primary) bg-(--bg-canvas) font-mono! text-[12px]! leading-[18px]! font-normal! focus:border-(--color-accent) focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]';
const fieldInputClass = `${fieldControlClass} h-[34px] px-2.5 py-0 placeholder:text-(--text-quaternary)`;
const fieldTextareaClass = `${fieldControlClass} min-h-[150px] p-2.5 resize-y`;

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
    const startedAt = analyticsTimestamp();
    const analyticsMethod = method.toUpperCase();
    let completionCaptured = false;
    setPending(true);
    setError('');
    setResult(undefined);
    try {
      const response = await fetch(docsApiPath('/try'), {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, token, orgId: personalToken ? orgId : '', parameters: values, serverVariables: variables, body: bodyType ? body : undefined }),
      });
      const payload = await response.json() as TryResult & { error?: string };
      if (!response.ok && payload.error) {
        completionCaptured = true;
        captureDocsEvent('docs_api_try_completed', {
          duration_bucket: durationBucket(analyticsTimestamp() - startedAt),
          method: analyticsMethod,
          operation,
          outcome: response.status === 429
            ? 'rate_limited'
            : response.status === 400
              ? 'validation_error'
              : 'proxy_error',
          status_class: statusClass(response.status),
        });
        throw new Error(payload.error);
      }
      setResult(payload);
      completionCaptured = true;
      captureDocsEvent('docs_api_try_completed', {
        duration_bucket: durationBucket(analyticsTimestamp() - startedAt),
        method: analyticsMethod,
        operation,
        outcome: payload.status >= 200 && payload.status < 300 ? 'success' : 'upstream_error',
        status_class: statusClass(payload.status),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request could not be completed.');
      if (!completionCaptured) {
        captureDocsEvent('docs_api_try_completed', {
          duration_bucket: durationBucket(analyticsTimestamp() - startedAt),
          method: analyticsMethod,
          operation,
          outcome: 'proxy_error',
          status_class: 'unknown',
        });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <details
      className="api-try ph-no-capture group mt-3 border border-(--border-primary) rounded-[4px] bg-(--bg-surface)"
      data-ph-no-capture
      onToggle={(event) => {
        if (event.currentTarget.open) {
          captureDocsEvent('docs_api_try_opened', {
            method: method.toUpperCase(),
            operation,
          });
        }
      }}
    >
      <summary className="min-h-[46px] py-2 px-3 flex items-center gap-[9px] list-none [&::-webkit-details-marker]:hidden text-(--text-secondary) cursor-pointer hover:bg-(--bg-inert)"><span className="api-try-chevron h-5 inline-flex items-center text-(--text-quaternary) transition-transform duration-150 ease-[ease] group-open:rotate-90"><ChevronRight size={14} /></span><span className="flex items-baseline gap-[9px]"><strong className="text-(--text-primary) font-mono text-[12px] leading-[18px] font-semibold">Try it</strong><small className="text-(--text-quaternary) font-sans text-[11px] leading-4 font-normal">Run this request against your Axiom organization</small></span></summary>
      <div className="api-try-panel pt-[14px] px-4 pb-4 border-t border-t-(--border-primary)">
        <p className="mt-0 mx-0 mb-[14px] text-(--text-tertiary) font-sans text-[12px] leading-[19px] font-normal">Credentials stay in this browser tab and are only sent to Axiom when you run the request.</p>
        <div className="api-try-fields grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <label className={fieldLabelClass}><span className={fieldLegendClass}>API token <b className={fieldBadgeClass}>Required</b></span><input className={fieldInputClass} data-ph-no-capture type="password" autoComplete="off" value={token} onChange={(event) => persistCredential(tokenKey, event.target.value, setToken)} placeholder="xaat-…" /></label>
          {personalToken && <label className={fieldLabelClass}><span className={fieldLegendClass}>Organization ID <b className={fieldBadgeClass}>Required for PAT</b></span><input className={fieldInputClass} data-ph-no-capture type="text" autoComplete="off" value={orgId} onChange={(event) => persistCredential(orgKey, event.target.value, setOrgId)} placeholder="Your organization ID" /></label>}
          {serverVariables.map((item) => <label className={fieldLabelClass} key={item.name}><span className={fieldLegendClass}>{item.name} {item.required && <b className={fieldBadgeClass}>Required</b>}</span><input className={fieldInputClass} value={variables[item.name] ?? ''} onChange={(event) => setVariables((current) => ({ ...current, [item.name]: event.target.value }))} placeholder={item.description} /></label>)}
          {visibleParameters.map((item) => <label className={fieldLabelClass} key={`${item.location}-${item.name}`}><span className={fieldLegendClass}>{item.name} <code className={fieldNoteClass}>{item.location}</code>{item.required && <b className={fieldBadgeClass}>Required</b>}</span><input className={fieldInputClass} value={values[item.name] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [item.name]: event.target.value }))} placeholder={item.description} /></label>)}
          {bodyType && <label className={cn('api-try-body col-span-full max-sm:col-auto', fieldLabelClass)}><span className={fieldLegendClass}>Request body <code className={fieldNoteClass}>{bodyType}</code></span><textarea className={fieldTextareaClass} value={body} onChange={(event) => setBody(event.target.value)} spellCheck={false} /></label>}
        </div>
        {personalToken && !orgId && <p className="api-try-guidance mt-3! mx-0! mb-0! py-[9px] px-2.5 border-l-2 border-l-(--amber-500) text-(--text-secondary)! bg-(--bg-inert) font-sans! text-[11px]! leading-[18px]! font-normal!">Personal access tokens require an organization ID. Find it in <strong className="text-(--text-primary) font-semibold">Settings → General</strong> or in your Axiom app URL. <Link className="text-(--text-primary)! underline! underline-offset-2" href="/docs/reference/tokens#determine-organization-id">Learn more</Link>.</p>}
        <div className="api-try-actions mt-[14px] flex justify-end"><button className="h-[30px] px-2.5 py-0 inline-flex items-center gap-[7px] border-0 rounded-[4px] text-(--text-on-inverse-primary) bg-(--bg-emph-primary-inverse) cursor-pointer font-sans! text-[11px]! leading-4! font-semibold! disabled:opacity-45 disabled:cursor-not-allowed" type="button" disabled={pending || !token || (personalToken && !orgId)} onClick={runRequest}>{pending ? <LoaderCircle className="api-try-spinner animate-spin [animation-duration:0.8s]" size={13} /> : <Play size={12} />}{pending ? 'Running…' : `Run ${method.toUpperCase()} request`}</button></div>
        {error && <p className="api-try-error mt-3! mx-0! mb-0! py-[9px] px-2.5 border-l-2 border-l-(--red-400) text-(--red-400)! bg-(--bg-inert) font-mono! text-[11px]! leading-[17px]! font-[450]!" role="alert">{error}</p>}
        {result && <div className="api-try-result mt-[14px] overflow-hidden border border-(--border-primary) rounded-[4px] bg-(--bg-canvas)"><div className="min-h-[34px] py-[7px] px-2.5 flex items-center gap-2 border-b border-b-(--border-primary)"><span className={cn(result.status >= 200 && result.status < 300 ? 'status-dot success bg-(--green-500)' : 'status-dot error bg-(--red-400)', 'size-2 inline-block rounded-[999px]')} /><strong className="text-(--text-secondary) font-mono text-[11px] leading-4 font-[550]">{result.status} {result.statusText}</strong><small className="ml-auto text-(--text-quaternary) font-mono text-[10px] leading-[14px] font-[450] uppercase">{result.contentType}</small></div><pre className="max-h-[420px] m-0! p-[14px]! overflow-auto border-0! bg-transparent! text-(--text-primary)! font-mono! text-[12px]! leading-5! font-normal!"><code className="p-0! border-0! bg-transparent! text-inherit! [font:inherit]!">{prettyBody(result.body, result.contentType)}</code></pre></div>}
      </div>
    </details>
  );
}
