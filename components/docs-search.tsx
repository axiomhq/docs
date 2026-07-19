'use client';

import { useChat } from '@ai-sdk/react';
import {
  ArrowUpRight,
  BookOpen,
  RefreshCw,
  Search,
  Send,
  Square,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useDocsSearch as useFumadocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import { Markdown } from '@/components/markdown';
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

type AssistantSource = {
  title: string;
  url: string;
};

const DocsSearchContext = createContext<DocsSearchContextValue | null>(null);

const chatTransport = new DefaultChatTransport<UIMessage>({
  api: '/api/chat',
  prepareSendMessagesRequest({ messages }) {
    return {
      body: {
        messages,
        currentPath: window.location.pathname.startsWith('/docs')
          ? window.location.pathname
          : '/docs',
      },
    };
  },
});

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
  const chat = useChat<UIMessage>({ id: 'axiom-docs-assistant', transport: chatTransport });
  const listRef = useRef<HTMLDivElement>(null);
  const isBusy = chat.status === 'submitted' || chat.status === 'streaming';
  const messages = chat.messages.filter((message) => message.role !== 'system');

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => document.getElementById('docs-assistant-input')?.focus(), 0);
    return () => window.clearTimeout(timeout);
  }, [open]);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat.status, messages]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const question = assistantDraft.trim();
    if (!question || isBusy) return;
    setAssistantDraft('');
    void chat.sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: question }],
    });
  };

  return (
    <section id="docs-assistant-panel" role="tabpanel" aria-labelledby="docs-assistant-tab" className="docs-assistant-panel">
      <div ref={listRef} className="docs-assistant-messages" role="log" aria-live="polite" aria-label="AI assistant conversation">
        {messages.length > 0 && (
          <button
            type="button"
            className="docs-search-clear"
            onClick={() => chat.setMessages([])}
          >
            Clear conversation
          </button>
        )}
        {messages.length === 0 ? (
          <div className="docs-assistant-empty">
            <strong>Ask Axiom Docs</strong>
            <p>Get an answer assembled from the documentation, with links to the pages used.</p>
            <p className="docs-assistant-note">The assistant searches public documentation only. Don’t include tokens or sensitive data.</p>
          </div>
        ) : (
          messages.map((message) => <AssistantMessage message={message} key={message.id} />)
        )}
        {chat.status === 'submitted' && (
          <div className="docs-assistant-working" role="status"><span /> Searching Axiom Docs…</div>
        )}
        {chat.error && (
          <div className="docs-assistant-error" role="alert">
            <strong>The assistant couldn’t answer.</strong>
            <span>You can retry or continue with regular search.</span>
            <div>
              <button type="button" onClick={() => chat.regenerate()}><RefreshCw size={13} /> Retry</button>
              <button type="button" onClick={() => setMode('search')}>Use search</button>
            </div>
          </div>
        )}
      </div>
      <form className="docs-assistant-composer" onSubmit={submit}>
        <textarea
          id="docs-assistant-input"
          value={assistantDraft}
          rows={2}
          maxLength={4_000}
          aria-label="Ask Axiom Docs"
          placeholder={isBusy ? 'Answering from the documentation…' : 'Ask a question about Axiom…'}
          disabled={isBusy}
          data-ph-no-capture
          onChange={(event) => setAssistantDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) submit(event);
          }}
        />
        {isBusy ? (
          <button type="button" aria-label="Stop answer" onClick={() => chat.stop()}><Square size={13} fill="currentColor" /></button>
        ) : (
          <button type="submit" aria-label="Send question" disabled={!assistantDraft.trim()}><Send size={15} /></button>
        )}
        <small>Generated from Axiom documentation. Verify critical details.</small>
      </form>
    </section>
  );
}

function AssistantMessage({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
  const toolParts = message.parts.filter((part) => part.type.startsWith('tool-'));
  const sources = assistantSources(message);

  if (message.role === 'user') {
    return <div className="docs-assistant-message user"><span>You</span><p>{text}</p></div>;
  }

  return (
    <div className="docs-assistant-message assistant">
      <span>Axiom Docs</span>
      {toolParts.map((part, index) => {
        const invocation = part as unknown as { state?: string; input?: { query?: string }; errorText?: string };
        if (invocation.state?.startsWith('output') && invocation.state !== 'output-error') return null;
        const failed = invocation.state === 'output-error' || invocation.state === 'output-denied';
        return (
          <div className={failed ? 'docs-assistant-tool error' : 'docs-assistant-tool'} key={`${part.type}-${index}`}>
            <Search size={12} />
            {failed ? invocation.errorText ?? 'Documentation search failed' : invocation.input?.query ? `Searching “${invocation.input.query}”` : 'Searching documentation'}
          </div>
        );
      })}
      {text && <div className="docs-ai-markdown"><Markdown text={text} /></div>}
      {sources.length > 0 && (
        <div className="docs-assistant-sources">
          <strong>Sources</strong>
          {sources.map((source) => (
            <a href={source.url} key={source.url}>
              <span>{source.title}</span><ArrowUpRight size={12} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function assistantSources(message: UIMessage): AssistantSource[] {
  const sources = new Map<string, AssistantSource>();
  for (const part of message.parts) {
    if (!part.type.startsWith('tool-') || !('output' in part)) continue;
    const output = (part as unknown as { output?: unknown }).output;
    const values = Array.isArray(output) ? output : output && typeof output === 'object' ? [output] : [];
    for (const value of values) {
      if (!value || typeof value !== 'object') continue;
      const candidate = value as { title?: unknown; url?: unknown };
      if (typeof candidate.url !== 'string' || !candidate.url.startsWith('/docs')) continue;
      const pageUrl = candidate.url.split('#', 1)[0];
      if (sources.has(pageUrl)) continue;
      sources.set(pageUrl, {
        title: typeof candidate.title === 'string' ? candidate.title : candidate.url,
        url: candidate.url,
      });
    }
  }
  return [...sources.values()].slice(0, 4);
}
