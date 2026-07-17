'use client';

import { cloneElement, isValidElement, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
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

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

function replaceText(node: ReactNode, values: Values): ReactNode {
  if (typeof node === 'string') {
    const keys = Object.keys(fields) as FieldKey[];
    const pattern = new RegExp(`(${keys.join('|')})`, 'g');
    return node.split(pattern).map((part, index) => keys.includes(part as FieldKey) ? <span className="axiom-placeholder-highlight" key={`${part}-${index}`}>{values[part as FieldKey] || part}</span> : part);
  }
  if (Array.isArray(node)) return node.map((child, index) => {
    const replaced = replaceText(child, values);
    return isValidElement(replaced) && replaced.key == null
      ? cloneElement(replaced, { key: `code-node-${index}` })
      : replaced;
  });
  if (isValidElement<{ children?: ReactNode }>(node)) return cloneElement(node as ReactElement<{ children?: ReactNode }>, { ...node.props, children: replaceText(node.props.children, values) });
  return node;
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
  const usedFields = useMemo(() => (Object.keys(fields) as FieldKey[]).filter((key) => source.includes(key)), [source]);
  const valuesSnapshot = useSyncExternalStore(subscribeValues, getValuesSnapshot, getServerValuesSnapshot);
  const values = useMemo(() => parseValues(valuesSnapshot), [valuesSnapshot]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  function update(key: FieldKey, value: string) {
    const next = { ...values, [key]: value || undefined };
    sessionStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event('axiom-placeholder-change'));
  }

  return <>
    <CodeBlock {...props}><Pre>{hydrated ? replaceText(props.children, values) : props.children}</Pre></CodeBlock>
    {hydrated && usedFields.length > 0 && <div className="placeholder-config" aria-label="Customize this example">
      {usedFields.map((key) => {
        const field = fields[key];
        return <label key={key}><span>{field.label}</span>{'options' in field ? <select value={values[key] ?? ''} onChange={(event) => update(key, event.target.value)}>{field.options.map((option) => <option value={option} key={option}>{option || 'Select edge deployment'}</option>)}</select> : <input value={values[key] ?? ''} placeholder={field.placeholder} autoComplete="off" data-1p-ignore onChange={(event) => update(key, event.target.value)} />}</label>;
      })}
    </div>}
  </>;
}
