'use client';

import { isValidElement, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { DocsCodeBlock, type DocsCodeBlockProps } from '@/components/docs-code-block';
import { captureDocsEvent } from '@/lib/docs-analytics';

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
const trackedFields = new Set<FieldKey>();

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

export function PlaceholderPre({ source: sourceProp, ...props }: DocsCodeBlockProps & { source?: string }) {
  const source = useMemo(() => sourceProp ?? textOf(props.children), [props.children, sourceProp]);
  const usedFields = useMemo(() => fieldKeys.filter((key) => new RegExp(`\\b${key}\\b`).test(source)), [source]);
  const valuesSnapshot = useSyncExternalStore(subscribeValues, getValuesSnapshot, getServerValuesSnapshot);
  const values = useMemo(() => parseValues(valuesSnapshot), [valuesSnapshot]);
  const [hydrated, setHydrated] = useState(false);
  const codeBlockRef = useRef<HTMLDivElement>(null);
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
    if (!trackedFields.has(key)) {
      trackedFields.add(key);
      captureDocsEvent('docs_example_customized', { field_name: key });
    }
  }

  return <>
    <DocsCodeBlock ref={codeBlockRef} {...props} />
    {hydrated && usedFields.length > 0 && <div className="placeholder-config ph-no-capture mt-0 mx-0 mb-6 py-[14px] px-4 flex flex-col gap-2.5 border-x border-b border-(--border-primary) rounded-t-none rounded-b-[4px] bg-(--bg-inert)" aria-label="Customize this example" data-ph-no-capture>
      {usedFields.map((key) => {
        const field = fields[key];
        return <label className="grid grid-cols-[110px_1fr] items-center gap-3 text-(--text-tertiary) font-sans text-[12px] leading-4 font-medium max-sm:grid-cols-[1fr] max-sm:gap-[5px]" key={key}><span>{field.label}</span>{'options' in field ? <span className="relative min-w-0"><select className="min-w-0 h-8 px-2.5 py-0 border border-(--border-primary) rounded-md outline-none text-(--text-secondary) bg-(--bg-canvas) font-mono text-[12px] leading-4 font-normal focus:border-(--color-accent) focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] w-full appearance-none pr-8" value={values[key] ?? ''} onChange={(event) => update(key, event.target.value)}>{field.options.map((option) => <option value={option} key={option}>{option || 'Select edge deployment'}</option>)}</select><ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-(--text-quaternary)" /></span> : <input className="min-w-0 h-8 px-2.5 py-0 border border-(--border-primary) rounded-md outline-none text-(--text-secondary) bg-(--bg-canvas) font-mono text-[12px] leading-4 font-normal focus:border-(--color-accent) focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] font-mono! text-[12px]! leading-4! font-normal!" value={values[key] ?? ''} placeholder={field.placeholder} autoComplete="off" data-1p-ignore data-ph-no-capture onChange={(event) => update(key, event.target.value)} />}</label>;
      })}
    </div>}
  </>;
}
