'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { CheckIcon, CopyIcon } from '@/assets/icons';
import { CodeGlyphIcon, resolveCodeLanguage } from '@/components/ai/code-languages';
import { useCopy } from '@/components/ai/use-copy';
import { Button } from '@/components/ui/button';
import { captureDocsEvent } from '@/lib/docs-analytics';

export type ApiCodeSample = {
  id: string;
  label: string;
  code: string;
  highlighted: ReactNode;
};

const languagePreferenceKey = 'axiom-docs-api-language';
const languagePreferenceEvent = 'axiom-docs-api-language-change';

/**
 * Request/response samples in the article code-field chrome (docs-code-block
 * CSS carries the line numbers, gutter rule, and shiki theme mapping). The
 * header holds sans language tabs instead of a single label when a request
 * has several sample languages.
 */
export function ApiCodeBlock({ samples, label }: { samples: ApiCodeSample[]; label?: string }) {
  const availableIds = useMemo(() => new Set(samples.map((sample) => sample.id)), [samples]);
  const [selectedId, setSelectedId] = useState(samples[0]?.id ?? '');
  const selected = samples.find((sample) => sample.id === selectedId) ?? samples[0];
  const { copied, copy } = useCopy();

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

  const single = resolveCodeLanguage(selected.id, selected.code);
  const SingleIcon = single.Icon ?? CodeGlyphIcon;

  return (
    <div className="docs-code-block not-fumadocs-codeblock api-code group mt-4 overflow-hidden rounded-md border border-(--border-primary) bg-(--bg-surface)">
      <div className="flex h-8 items-center gap-[7px] border-b-[0.5px] border-(--border-primary) pr-1 pl-3">
        {samples.length > 1 ? (
          <div
            className="flex h-full items-stretch gap-0.5"
            role="tablist"
            aria-label="Request language"
          >
            {samples.map((sample) => (
              <button
                type="button"
                role="tab"
                className="relative cursor-pointer border-0 bg-transparent px-2 py-0 font-sans text-[13px] leading-[18px] font-medium whitespace-nowrap text-(--text-tertiary) transition-colors hover:text-(--text-primary) aria-selected:text-(--text-primary) aria-selected:after:absolute aria-selected:after:right-2 aria-selected:after:-bottom-[0.5px] aria-selected:after:left-2 aria-selected:after:h-[1.5px] aria-selected:after:bg-(--color-accent) aria-selected:after:content-['']"
                aria-selected={sample.id === selected.id}
                key={sample.id}
                onClick={() => selectLanguage(sample.id)}
              >
                {sample.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center gap-[7px] font-mono text-[11px] leading-none font-[450] text-(--text-primary)">
            <SingleIcon className="size-3 flex-none text-(--text-tertiary)" aria-hidden="true" />
            <span>{label ?? selected.label}</span>
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-code-copy
          className="ml-auto h-6 w-6 rounded text-(--text-tertiary) active:scale-90 hover:text-(--text-primary) dark:hover:bg-[#232323]!"
          aria-label={copied ? 'Copied' : 'Copy code'}
          onClick={async () => {
            // Only report copies that actually reached the clipboard.
            if (!(await copy(selected.code))) return;
            captureDocsEvent('docs_code_copied', {
              code_kind: 'api_sample',
              language: selected.id,
            });
          }}
        >
          {copied ? <CheckIcon className="size-[11px]" /> : <CopyIcon className="size-[11px]" />}
        </Button>
      </div>
      <div
        className="docs-code-body relative overflow-x-auto py-2 pl-2.5 text-[13px] leading-[21px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tabpanel"
        aria-label={`${selected.label} code example`}
      >
        {selected.highlighted}
      </div>
    </div>
  );
}
