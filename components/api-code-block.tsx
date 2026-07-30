'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { captureDocsEvent } from '@/lib/docs-analytics';
import { CopyButton } from './copy-button';

export type ApiCodeSample = {
  id: string;
  label: string;
  code: string;
  highlighted: ReactNode;
};

const languagePreferenceKey = 'axiom-docs-api-language';
const languagePreferenceEvent = 'axiom-docs-api-language-change';

export function ApiCodeBlock({ samples, label }: { samples: ApiCodeSample[]; label?: string }) {
  const availableIds = useMemo(() => new Set(samples.map((sample) => sample.id)), [samples]);
  const [selectedId, setSelectedId] = useState(samples[0]?.id ?? '');
  const selected = samples.find((sample) => sample.id === selectedId) ?? samples[0];

  useEffect(() => {
    const stored = window.localStorage.getItem(languagePreferenceKey);
    const hydrationTimeout = window.setTimeout(() => {
      if (stored && availableIds.has(stored)) setSelectedId(stored);
    }, 0);

    const syncPreference = (event: Event) => {
      const value = event instanceof CustomEvent ? event.detail : window.localStorage.getItem(languagePreferenceKey);
      if (typeof value === 'string' && availableIds.has(value)) setSelectedId(value);
    };
    window.addEventListener('storage', syncPreference);
    window.addEventListener(languagePreferenceEvent, syncPreference);
    return () => {
      window.clearTimeout(hydrationTimeout);
      window.removeEventListener('storage', syncPreference);
      window.removeEventListener(languagePreferenceEvent, syncPreference);
    };
  }, [availableIds]);

  if (!selected) return null;

  const selectLanguage = (id: string) => {
    if (id === selected.id) return;
    setSelectedId(id);
    window.localStorage.setItem(languagePreferenceKey, id);
    window.dispatchEvent(new CustomEvent(languagePreferenceEvent, { detail: id }));
    captureDocsEvent('docs_api_language_selected', { language: id });
  };

  return (
    <div className="api-code mt-4 overflow-hidden border border-(--border-primary) rounded-[4px] bg-(--bg-surface)">
      <div className="api-code-head min-h-[38px] pt-0 pr-2 pb-0 pl-2.5 flex items-center border-b border-b-(--border-primary) text-(--text-tertiary) font-mono text-[12px] leading-4 font-[450]">
        {samples.length > 1 ? (
          <div className="api-code-tabs self-stretch flex items-stretch gap-0.5" role="tablist" aria-label="Request language">
            {samples.map((sample) => (
              <button
                type="button"
                role="tab"
                className="relative px-2 py-0 border-0 text-(--text-quaternary) bg-transparent cursor-pointer font-mono! text-[11px]! leading-4! font-medium! hover:text-(--text-secondary) aria-selected:text-(--text-primary) aria-selected:after:content-[''] aria-selected:after:absolute aria-selected:after:right-2 aria-selected:after:-bottom-px aria-selected:after:left-2 aria-selected:after:h-0.5 aria-selected:after:bg-(--color-accent)"
                aria-selected={sample.id === selected.id}
                key={sample.id}
                onClick={() => selectLanguage(sample.id)}
              >
                {sample.label}
              </button>
            ))}
          </div>
        ) : <span>{label ?? selected.label}</span>}
        <CopyButton
          value={selected.code}
          analytics={{ codeKind: 'api_sample', language: selected.id }}
        />
      </div>
      <div className="api-code-body" role="tabpanel" aria-label={`${selected.label} code example`}>
        {selected.highlighted}
      </div>
    </div>
  );
}
