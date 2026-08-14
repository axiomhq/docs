'use client';

import {
  ArrowUpRight,
  BookOpen,
  Search,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDocsSearch as useFumadocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import { useDocsSearchController } from '@/components/docs-search-provider';
import {
  analyticsTimestamp,
  captureDocsEvent,
  durationBucket,
  safeDocsPath,
} from '@/lib/docs-analytics';
import { docsApiPath, withoutDocsBasePath } from '@/lib/docs-paths';
import { sanitizeSearchSnippet } from '@/lib/docs-search-rank';

const LazyAssistantPanel = dynamic(
  () => import('@/components/docs-assistant').then((module) => module.DocsAssistantPanel),
  {
    ssr: false,
    loading: () => (
      <section id="docs-assistant-panel" role="tabpanel" aria-labelledby="docs-assistant-tab" className="docs-assistant-panel min-h-0 flex-1 grid grid-rows-[minmax(0,1fr)_auto] bg-(--bg-canvas)">
        <div className="docs-assistant-messages min-h-0 h-full overflow-y-auto pt-[22px] px-6 pb-7 overscroll-contain max-sm:pt-[18px] max-sm:px-[14px] max-sm:pb-6">
          <div className="docs-assistant-working py-[7px] px-0 flex items-center gap-2 text-(--text-tertiary) font-mono text-[11px] leading-4 font-[450]" role="status">
            <span className="size-1.5 flex-none border border-(--color-accent) animate-[docs-assistant-pulse_1s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:bg-(--color-accent)" /> Loading assistant…
          </div>
        </div>
      </section>
    ),
  },
);

export function DocsSearchDialog() {
  const { open, mode, close, setMode } = useDocsSearchController();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="docs-search-dialog ph-no-capture m-auto h-[min(650px,calc(100dvh_-_64px))] w-[min(720px,calc(100vw_-_32px))] max-h-none max-w-none overflow-hidden rounded-md border border-(--border-strong) bg-(--bg-overlay) p-0 text-(--text-primary) shadow-[0_16px_48px_rgba(0,0,0,.36)] backdrop:bg-[rgba(0,0,0,.58)] backdrop:backdrop-blur-[2px] max-sm:h-[calc(100dvh_-_12px)] max-sm:w-[calc(100vw_-_12px)]"
      aria-label="Search and ask Axiom Docs"
      data-ph-no-capture
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="docs-search-surface flex h-full min-h-0 w-full flex-col">
        <header className="docs-search-dialog-header flex h-12 flex-none items-center gap-2 border-b border-(--border-primary) bg-(--bg-surface) py-0 pr-[10px] pl-[14px] max-sm:h-[52px] max-sm:pr-1.5 max-sm:pl-3">
          <div className="docs-search-mode-tabs flex h-full items-stretch gap-1 max-sm:gap-0.5" role="tablist" aria-label="Search mode">
            <button
              id="docs-search-tab"
              type="button"
              role="tab"
              className="relative inline-flex cursor-pointer items-center gap-[7px] border-0 bg-transparent px-[9px] py-0 font-sans! text-[13px]! leading-4! font-medium! text-(--text-tertiary) transition-[color,background] duration-(--duration-1) ease-(--ease-out) hover:text-(--text-secondary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) active:bg-(--bg-emph-tertiary) aria-selected:font-semibold! aria-selected:text-(--text-primary) aria-selected:after:absolute aria-selected:after:right-0 aria-selected:after:-bottom-px aria-selected:after:left-0 aria-selected:after:h-0.5 aria-selected:after:bg-(--color-accent) aria-selected:after:content-[''] max-sm:min-h-11 max-sm:text-[14px]!"
              aria-selected={mode === 'search'}
              aria-controls="docs-search-panel"
              onClick={() => {
                captureDocsEvent('docs_search_opened', { entry_point: 'mode_tab' });
                setMode('search');
              }}
            >
              <Search size={14} /> Search
            </button>
            <button
              id="docs-assistant-tab"
              type="button"
              role="tab"
              className="relative inline-flex cursor-pointer items-center gap-[7px] border-0 bg-transparent px-[9px] py-0 font-sans! text-[13px]! leading-4! font-medium! text-(--text-tertiary) transition-[color,background] duration-(--duration-1) ease-(--ease-out) hover:text-(--text-secondary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) active:bg-(--bg-emph-tertiary) aria-selected:font-semibold! aria-selected:text-(--text-primary) aria-selected:after:absolute aria-selected:after:right-0 aria-selected:after:-bottom-px aria-selected:after:left-0 aria-selected:after:h-0.5 aria-selected:after:bg-(--color-accent) aria-selected:after:content-[''] max-sm:min-h-11 max-sm:text-[14px]!"
              aria-selected={mode === 'assistant'}
              aria-controls="docs-assistant-panel"
              onClick={() => {
                captureDocsEvent('docs_ai_opened', { entry_point: 'mode_tab' });
                setMode('assistant');
              }}
            >
              <BookOpen size={14} /> Ask AI
            </button>
          </div>
          <button
            type="button"
            className="docs-search-close ml-auto inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[3px] border-0 bg-transparent p-0 text-(--text-tertiary) transition-[color,background] duration-(--duration-1) ease-(--ease-out) hover:bg-(--bg-emph-tertiary) hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) active:bg-(--bg-emph-secondary) max-md:h-11 max-md:w-11"
            aria-label="Close search"
            onClick={close}
          >
            <X size={16} />
          </button>
        </header>
        {mode === 'search' ? <SearchPanel /> : <AssistantPanel />}
      </div>
    </dialog>
  );
}

function SearchPanel() {
  const router = useRouter();
  const { close, open, openAssistant } = useDocsSearchController();
  const client = useMemo(() => fetchClient({ api: `${docsApiPath('/search')}?v=2` }), []);
  const { search, setSearch, query } = useFumadocsSearch({ client, delayMs: 300 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchStartedAt = useRef(0);
  const searchWasLoading = useRef(false);
  const results = Array.isArray(query.data) ? query.data : [];
  const activeIndex = results.length > 0 ? Math.min(selectedIndex, results.length - 1) : 0;

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timeout);
  }, [open]);
  useEffect(() => {
    if (!open || results.length === 0) return;
    document.getElementById(`docs-search-result-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, query.data, results.length]);
  useEffect(() => {
    if (query.isLoading) {
      searchWasLoading.current = true;
      return;
    }
    if (!search.trim() || !searchWasLoading.current) return;

    searchWasLoading.current = false;
    captureDocsEvent('docs_search_completed', {
      duration_bucket: durationBucket(analyticsTimestamp() - searchStartedAt.current),
      outcome: results.length > 0 ? 'results' : 'empty',
      result_count: results.length,
    });
  }, [query.data, query.isLoading, results.length, search]);

  const navigate = (url: string, resultRank: number, inputMethod: 'keyboard' | 'pointer') => {
    captureDocsEvent('docs_search_result_opened', {
      destination_path: safeDocsPath(url),
      input_method: inputMethod,
      result_rank: resultRank,
    });
    close();
    router.push(withoutDocsBasePath(url));
  };
  const handoff = (
    entryPoint: 'search_handoff' | 'search_empty_state' | 'search_footer',
    draft = '',
  ) => {
    captureDocsEvent('docs_search_ai_handoff', {
      entry_point: entryPoint,
      result_count: results.length,
    });
    openAssistant(draft, entryPoint);
  };
  const handleKeys = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % results.length);
    }
    if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault();
      setSelectedIndex((index) => (index - 1 + results.length) % results.length);
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      navigate(results[activeIndex].url, activeIndex + 1, 'keyboard');
    }
  };

  return (
    <section
      id="docs-search-panel"
      role="tabpanel"
      aria-labelledby="docs-search-tab"
      className="docs-search-panel grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto]"
    >
      <div className="docs-search-input-row flex h-[52px] items-center gap-2.5 border-b border-(--border-secondary) bg-(--bg-canvas) px-4 py-0 text-(--icon-secondary) max-sm:h-14 max-sm:px-[13px]">
        <Search size={17} aria-hidden="true" />
        <input
          ref={inputRef}
          value={search}
          className="min-w-0 flex-1 border-0 bg-transparent font-sans! text-[15px]! leading-5! font-[450]! tracking-[-.01em] text-(--text-primary) outline-0 placeholder:text-(--text-tertiary) placeholder:opacity-100"
          role="combobox"
          aria-label="Search documentation"
          aria-autocomplete="list"
          aria-controls="docs-search-results"
          aria-expanded={results.length > 0}
          aria-activedescendant={results[activeIndex] ? `docs-search-result-${activeIndex}` : undefined}
          placeholder="Search pages, APIs, APL, and MPL…"
          data-ph-no-capture
          onChange={(event) => {
            setSelectedIndex(0);
            searchStartedAt.current = analyticsTimestamp();
            setSearch(event.target.value);
          }}
          onKeyDown={handleKeys}
        />
        <kbd className="max-sm:hidden">ESC</kbd>
      </div>
      <div
        className="docs-search-results min-h-0 overflow-y-auto overscroll-contain bg-(--bg-canvas) p-2 max-sm:p-1.5"
        aria-busy={query.isLoading}
      >
        {search.trim() && (
          <button
            type="button"
            className="docs-search-ask-row mb-1.5 flex min-h-[42px] w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-(--border-primary) bg-(--bg-inert) px-[11px] py-0 text-left font-sans! text-[13px]! leading-[18px]! font-medium! text-(--text-secondary) transition-[color,border-color,background] duration-(--duration-1) ease-(--ease-out) hover:border-(--border-strong) hover:bg-(--bg-raised) hover:text-(--text-primary) focus-visible:border-(--color-accent) focus-visible:bg-(--bg-raised) focus-visible:text-(--text-primary) focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent) active:bg-(--bg-emph-secondary) max-md:min-h-11 max-sm:text-[14px]!"
            onClick={() => handoff('search_handoff', search.trim())}
          >
            <span className="inline-flex min-w-0 items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap"><BookOpen size={15} /> Ask AI about “{search.trim()}”</span>
            <ArrowUpRight size={14} />
          </button>
        )}
        {!search.trim() && (
          <div className="docs-search-empty flex h-full min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center text-(--text-tertiary)">
            <strong className="font-sans text-[15px] leading-5 font-semibold text-(--text-primary)">Find anything in Axiom Docs</strong>
            <p className="mx-0 mt-[7px] mb-[18px] max-w-[390px] font-sans text-[13px] leading-5 font-normal">Search exact fields, API paths, APL and MPL functions, concepts, and guides.</p>
            <button
              type="button"
              className="cursor-pointer rounded-[3px] border-0 bg-(--bg-emph-tertiary) px-2 py-1.5 font-sans! text-[12px]! leading-4! font-medium! text-(--text-secondary) transition-[color,background] duration-(--duration-1) ease-(--ease-out) hover:bg-(--bg-emph-secondary) hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) active:bg-(--bg-emph-primary) max-md:min-h-11 max-sm:text-[14px]!"
              onClick={() => handoff('search_empty_state')}
            >
              Ask a question instead <kbd>⌘I</kbd>
            </button>
          </div>
        )}
        {search.trim() && query.isLoading && results.length === 0 && (
          <div className="docs-search-status px-3 py-[38px] text-center font-mono text-[12px] leading-[18px] font-[450] text-(--text-tertiary)" role="status">Searching documentation…</div>
        )}
        {search.trim() && !query.isLoading && results.length === 0 && query.data === 'empty' && (
          <div className="docs-search-status px-3 py-[38px] text-center font-mono text-[12px] leading-[18px] font-[450] text-(--text-tertiary)" role="status">No matching documentation found.</div>
        )}
        <div id="docs-search-results" className="docs-search-result-list min-w-0" role="listbox" aria-label="Search results">
          {results.map((result, index) => (
            <button
              id={`docs-search-result-${index}`}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={activeIndex === index}
              className="docs-search-result flex min-h-[58px] w-full cursor-pointer flex-col justify-center gap-[3px] rounded-md border-0 bg-transparent px-[11px] py-2 text-left text-(--text-secondary) transition-[color,background] duration-(--duration-1) ease-(--ease-out) hover:bg-(--bg-emph-tertiary) hover:text-(--text-primary) hover:outline-0 focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)] aria-selected:bg-(--bg-emph-tertiary) aria-selected:text-(--text-primary) aria-selected:outline-0 max-sm:min-h-16"
              key={result.id}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => navigate(result.url, index + 1, 'pointer')}
            >
              <SearchBreadcrumbs items={result.breadcrumbs} />
              <span className="docs-search-result-content line-clamp-2 font-sans text-[13px] leading-[18px] font-[450] max-sm:text-[14px] max-sm:leading-5"><HighlightedText value={result.content} /></span>
            </button>
          ))}
        </div>
      </div>
      <footer className="docs-search-footer flex min-h-[38px] items-center gap-[14px] border-t border-(--border-primary) bg-(--bg-surface) px-3 py-[7px] font-mono text-[10px] leading-[14px] font-[450] text-(--text-tertiary) max-sm:justify-end">
        <span className="inline-flex items-center gap-1 max-sm:hidden"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
        <span className="inline-flex items-center gap-1 max-sm:hidden"><kbd>↵</kbd> Open</span>
        <button
          type="button"
          className="ml-auto cursor-pointer border-0 bg-transparent p-0 font-sans! text-[11px]! leading-4! font-medium! text-(--text-tertiary) transition-[color] duration-(--duration-1) ease-(--ease-out) hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) active:text-(--color-accent) max-md:min-h-11 max-sm:ml-0 max-sm:text-[13px]!"
          onClick={() => handoff('search_footer', search.trim())}
        >Ask AI <kbd>⌘I</kbd></button>
      </footer>
    </section>
  );
}

function HighlightedText({ value }: { value: string }) {
  const safeValue = sanitizeSearchSnippet(value);
  return safeValue.split(/(<mark>.*?<\/mark>)/gi).map((part, index) => {
    const match = part.match(/^<mark>(.*?)<\/mark>$/i);
    return match ? (
      <mark key={index} className="bg-transparent font-semibold text-(--color-accent-text)">{match[1]}</mark>
    ) : <span key={index}>{part}</span>;
  });
}

function SearchBreadcrumbs({ items = [] }: { items?: string[] }) {
  const breadcrumbs = items.length > 0 ? items : ['Axiom Docs'];
  const fullPath = breadcrumbs.join(' / ');
  const compactPath = breadcrumbs.length > 3
    ? `${breadcrumbs[0]} / … / ${breadcrumbs.at(-1)}`
    : fullPath;

  return (
    <span
      className="docs-search-result-path overflow-hidden font-mono text-[10px] leading-[14px] font-[450] text-ellipsis whitespace-nowrap text-(--text-tertiary)"
      title={fullPath}
    >
      {compactPath}
    </span>
  );
}

function AssistantPanel() {
  const { open, assistantDraft, setAssistantDraft, setMode } = useDocsSearchController();
  return (
    <LazyAssistantPanel
      open={open}
      draft={assistantDraft}
      onDraftChange={setAssistantDraft}
      onUseSearch={() => setMode('search')}
    />
  );
}
