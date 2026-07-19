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
  createContext,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDocsSearch as useFumadocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import { sanitizeSearchSnippet } from '@/lib/docs-search-rank';

type SearchMode = 'search' | 'assistant';

type DocsSearchContextValue = {
  open: boolean;
  mode: SearchMode;
  openSearch: () => void;
  openAssistant: (draft?: string) => void;
  close: () => void;
  setMode: (mode: SearchMode) => void;
  assistantDraft: string;
  setAssistantDraft: (value: string) => void;
};

const DocsSearchContext = createContext<DocsSearchContextValue | null>(null);

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

export function DocsSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SearchMode>('search');
  const [assistantDraft, setAssistantDraft] = useState('');

  const openSearch = useCallback(() => {
    setMode('search');
    setOpen(true);
  }, []);
  const openAssistant = useCallback((draft = '') => {
    setAssistantDraft(draft);
    setMode('assistant');
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key === 'k' || event.code === 'KeyK') {
        event.preventDefault();
        openSearch();
      }
      if (key === 'i' || event.code === 'KeyI') {
        event.preventDefault();
        openAssistant();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [openAssistant, openSearch]);

  const value = useMemo(
    () => ({
      open,
      mode,
      openSearch,
      openAssistant,
      close,
      setMode,
      assistantDraft,
      setAssistantDraft,
    }),
    [assistantDraft, close, mode, open, openAssistant, openSearch],
  );

  return (
    <DocsSearchContext.Provider value={value}>
      {children}
      <DocsSearchDialog />
    </DocsSearchContext.Provider>
  );
}

export function useDocsSearchController() {
  const context = useContext(DocsSearchContext);
  if (!context) throw new Error('useDocsSearchController must be used inside DocsSearchProvider.');
  return context;
}

function DocsSearchDialog() {
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
      className="docs-search-dialog"
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
              onClick={() => setMode('search')}
            >
              <Search size={14} /> Search
            </button>
            <button
              id="docs-assistant-tab"
              type="button"
              role="tab"
              aria-selected={mode === 'assistant'}
              aria-controls="docs-assistant-panel"
              onClick={() => setMode('assistant')}
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
  const client = useMemo(() => fetchClient({ api: '/api/search?v=2' }), []);
  const { search, setSearch, query } = useFumadocsSearch({ client, delayMs: 300 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = Array.isArray(query.data) ? query.data : [];
  const activeIndex = results.length > 0 ? Math.min(selectedIndex, results.length - 1) : 0;

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timeout);
  }, [open]);
  const navigate = (url: string) => {
    close();
    router.push(url);
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
      navigate(results[activeIndex].url);
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
            setSearch(event.target.value);
          }}
          onKeyDown={handleKeys}
        />
        <kbd>ESC</kbd>
      </div>
      <div id="docs-search-results" className="docs-search-results" role="listbox" aria-label="Search results">
        {search.trim() && (
          <button type="button" className="docs-search-ask-row" onClick={() => openAssistant(search.trim())}>
            <span><BookOpen size={15} /> Ask AI about “{search.trim()}”</span>
            <ArrowUpRight size={14} />
          </button>
        )}
        {!search.trim() && (
          <div className="docs-search-empty">
            <strong>Find anything in Axiom Docs</strong>
            <p>Search exact fields, API paths, APL and MPL functions, concepts, and guides.</p>
            <button type="button" onClick={() => openAssistant()}>
              Ask a question instead <kbd>⌘I</kbd>
            </button>
          </div>
        )}
        {search.trim() && query.isLoading && results.length === 0 && (
          <div className="docs-search-status" role="status">Searching documentation…</div>
        )}
        {search.trim() && !query.isLoading && results.length === 0 && query.data === 'empty' && (
          <div className="docs-search-status">No matching documentation found.</div>
        )}
        {results.map((result, index) => (
          <button
            id={`docs-search-result-${index}`}
            type="button"
            role="option"
            aria-selected={activeIndex === index}
            className="docs-search-result"
            key={result.id}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => navigate(result.url)}
          >
            <SearchBreadcrumbs items={result.breadcrumbs} />
            <span className="docs-search-result-content"><HighlightedText value={result.content} /></span>
          </button>
        ))}
      </div>
      <footer className="docs-search-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
        <span><kbd>↵</kbd> Open</span>
        <button type="button" onClick={() => openAssistant(search.trim())}>Ask AI <kbd>⌘I</kbd></button>
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
