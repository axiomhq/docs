'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
    setSelectedId(id);
    window.localStorage.setItem(languagePreferenceKey, id);
    window.dispatchEvent(new CustomEvent(languagePreferenceEvent, { detail: id }));
  };

  return (
    <div className="api-code">
      <div className="api-code-head">
        {samples.length > 1 ? (
          <div className="api-code-tabs" role="tablist" aria-label="Request language">
            {samples.map((sample) => (
              <button
                type="button"
                role="tab"
                aria-selected={sample.id === selected.id}
                key={sample.id}
                onClick={() => selectLanguage(sample.id)}
              >
                {sample.label}
              </button>
            ))}
          </div>
        ) : <span>{label ?? selected.label}</span>}
        <CopyButton value={selected.code} />
      </div>
      <div className="api-code-body" role="tabpanel" aria-label={`${selected.label} code example`}>
        {selected.highlighted}
      </div>
    </div>
  );
}
