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
      <section id="docs-assistant-panel" role="tabpanel" aria-labelledby="docs-assistant-tab" className="docs-assistant-panel">
        <div className="docs-assistant-messages">
          <div className="docs-assistant-working" role="status"><span /> Loading assistant…</div>
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
      className="docs-search-dialog ph-no-capture"
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
      <div className="docs-search-surface">
        <header className="docs-search-dialog-header">
          <div className="docs-search-mode-tabs" role="tablist" aria-label="Search mode">
            <button
              id="docs-search-tab"
              type="button"
              role="tab"
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
          <button type="button" className="docs-search-close" aria-label="Close search" onClick={close}>
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
    <section id="docs-search-panel" role="tabpanel" aria-labelledby="docs-search-tab" className="docs-search-panel">
      <div className="docs-search-input-row">
        <Search size={17} aria-hidden="true" />
        <input
          ref={inputRef}
          value={search}
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
        <kbd>ESC</kbd>
      </div>
      <div className="docs-search-results" aria-busy={query.isLoading}>
        {search.trim() && (
          <button type="button" className="docs-search-ask-row" onClick={() => handoff('search_handoff', search.trim())}>
            <span><BookOpen size={15} /> Ask AI about “{search.trim()}”</span>
            <ArrowUpRight size={14} />
          </button>
        )}
        {!search.trim() && (
          <div className="docs-search-empty">
            <strong>Find anything in Axiom Docs</strong>
            <p>Search exact fields, API paths, APL and MPL functions, concepts, and guides.</p>
            <button type="button" onClick={() => handoff('search_empty_state')}>
              Ask a question instead <kbd>⌘I</kbd>
            </button>
          </div>
        )}
        {search.trim() && query.isLoading && results.length === 0 && (
          <div className="docs-search-status" role="status">Searching documentation…</div>
        )}
        {search.trim() && !query.isLoading && results.length === 0 && query.data === 'empty' && (
          <div className="docs-search-status" role="status">No matching documentation found.</div>
        )}
        <div id="docs-search-results" className="docs-search-result-list" role="listbox" aria-label="Search results">
          {results.map((result, index) => (
            <button
              id={`docs-search-result-${index}`}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={activeIndex === index}
              className="docs-search-result"
              key={result.id}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => navigate(result.url, index + 1, 'pointer')}
            >
              <SearchBreadcrumbs items={result.breadcrumbs} />
              <span className="docs-search-result-content"><HighlightedText value={result.content} /></span>
            </button>
          ))}
        </div>
      </div>
      <footer className="docs-search-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
        <span><kbd>↵</kbd> Open</span>
        <button type="button" onClick={() => handoff('search_footer', search.trim())}>Ask AI <kbd>⌘I</kbd></button>
      </footer>
    </section>
  );
}

function HighlightedText({ value }: { value: string }) {
  const safeValue = sanitizeSearchSnippet(value);
  return safeValue.split(/(<mark>.*?<\/mark>)/gi).map((part, index) => {
    const match = part.match(/^<mark>(.*?)<\/mark>$/i);
    return match ? <mark key={index}>{match[1]}</mark> : <span key={index}>{part}</span>;
  });
}

function SearchBreadcrumbs({ items = [] }: { items?: string[] }) {
  const breadcrumbs = items.length > 0 ? items : ['Axiom Docs'];
  const fullPath = breadcrumbs.join(' / ');
  const compactPath = breadcrumbs.length > 3
    ? `${breadcrumbs[0]} / … / ${breadcrumbs.at(-1)}`
    : fullPath;

  return <span className="docs-search-result-path" title={fullPath}>{compactPath}</span>;
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
