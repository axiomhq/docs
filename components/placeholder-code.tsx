'use client';

import { isValidElement, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';

const storageKey = 'axiom-docs-placeholders';
const fields = {
  AXIOM_DOMAIN: { label: 'Edge domain', placeholder: 'us-east-1.aws.edge.axiom.co', options: ['', 'us-east-1.aws.edge.axiom.co', 'eu-central-1.aws.edge.axiom.co'] },
  API_TOKEN: { label: 'API token', placeholder: 'xaat-api-token' },
  DATASET_NAME: { label: 'Dataset name', placeholder: 'dataset-name' },
  ORGANIZATION_ID: { label: 'Organization ID', placeholder: 'org-id' },
} as const;

type FieldKey = keyof typeof fields;
type Values = Partial<Record<FieldKey, string>>;

const fieldKeys = Object.keys(fields) as FieldKey[];

function placeholderPattern() {
  return new RegExp(`\\b(${fieldKeys.join('|')})\\b`, 'g');
}

function fieldValue(key: FieldKey, values: Values) {
  return values[key] || key;
}

function replaceSourceText(source: string, values: Values) {
  return source.replace(placeholderPattern(), (key) => fieldValue(key as FieldKey, values));
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

function getValuesSnapshot() {
  return sessionStorage.getItem(storageKey) ?? '{}';
}

function getServerValuesSnapshot() {
  return '{}';
}

function subscribeValues(callback: () => void) {
  window.addEventListener('axiom-placeholder-change', callback);
  return () => window.removeEventListener('axiom-placeholder-change', callback);
}

function parseValues(snapshot: string): Values {
  try { return JSON.parse(snapshot) as Values; } catch { return {}; }
}

export function PlaceholderPre({ source: sourceProp, ...props }: ComponentProps<'pre'> & { source?: string }) {
  const source = useMemo(() => sourceProp ?? textOf(props.children), [props.children, sourceProp]);
  const usedFields = useMemo(() => fieldKeys.filter((key) => new RegExp(`\\b${key}\\b`).test(source)), [source]);
  const valuesSnapshot = useSyncExternalStore(subscribeValues, getValuesSnapshot, getServerValuesSnapshot);
  const values = useMemo(() => parseValues(valuesSnapshot), [valuesSnapshot]);
  const [hydrated, setHydrated] = useState(false);
  const codeBlockRef = useRef<HTMLElement>(null);
  const originalText = useRef(new WeakMap<Text, string>());

  useEffect(() => {
    const timeout = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useLayoutEffect(() => {
    if (!hydrated) return;
    const pre = codeBlockRef.current?.querySelector('pre');
    if (!pre) return;

    const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const text = current as Text;
      const original = originalText.current.get(text) ?? text.data;
      originalText.current.set(text, original);
      text.data = replaceSourceText(original, values);
      current = walker.nextNode();
    }
  }, [hydrated, values]);

  function update(key: FieldKey, value: string) {
    const next = { ...values, [key]: value || undefined };
    sessionStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event('axiom-placeholder-change'));
  }

  return <>
    <CodeBlock ref={codeBlockRef} {...props}><Pre>{props.children}</Pre></CodeBlock>
    {hydrated && usedFields.length > 0 && <div className="placeholder-config" aria-label="Customize this example" data-ph-no-capture>
      {usedFields.map((key) => {
        const field = fields[key];
        return <label key={key}><span>{field.label}</span>{'options' in field ? <select value={values[key] ?? ''} onChange={(event) => update(key, event.target.value)}>{field.options.map((option) => <option value={option} key={option}>{option || 'Select edge deployment'}</option>)}</select> : <input value={values[key] ?? ''} placeholder={field.placeholder} autoComplete="off" data-1p-ignore data-ph-no-capture onChange={(event) => update(key, event.target.value)} />}</label>;
      })}
    </div>}
  </>;
}
