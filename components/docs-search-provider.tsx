'use client';

import dynamic from 'next/dynamic';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  type AssistantEntryPoint,
  captureDocsEvent,
  type SearchEntryPoint,
} from '@/lib/docs-analytics';

/* The sidebar's open state persists to localStorage so a refresh keeps it
   open (only the open flag — the conversation itself is not persisted yet).
   A useSyncExternalStore-backed store avoids the SSR hydration mismatch a
   lazy useState initializer would cause: the server snapshot is always
   closed, and React re-renders with the stored value after hydration. */
const ASSISTANT_OPEN_KEY = 'axiom-docs-assistant-open';
const assistantOpenListeners = new Set<() => void>();
// Fallback so the sidebar still opens when localStorage is unavailable.
let assistantOpenFallback = false;

function readAssistantOpen() {
  try {
    const stored = window.localStorage.getItem(ASSISTANT_OPEN_KEY);
    if (stored !== null) return stored === '1';
  } catch {
    // Storage access can throw in private browsing modes.
  }
  return assistantOpenFallback;
}

function writeAssistantOpen(value: boolean) {
  assistantOpenFallback = value;
  try {
    window.localStorage.setItem(ASSISTANT_OPEN_KEY, value ? '1' : '0');
  } catch {
    // Keep going with the in-memory fallback.
  }
  assistantOpenListeners.forEach((listener) => listener());
}

function subscribeAssistantOpen(listener: () => void) {
  assistantOpenListeners.add(listener);
  return () => {
    assistantOpenListeners.delete(listener);
  };
}

type DocsSearchContextValue = {
  open: boolean;
  openSearch: (entryPoint?: SearchEntryPoint) => void;
  close: () => void;
  assistantOpen: boolean;
  openAssistant: (draft?: string, entryPoint?: AssistantEntryPoint) => void;
  closeAssistant: () => void;
  assistantDraft: string;
  setAssistantDraft: (value: string) => void;
  /** One-shot question handed off with openAssistant — the panel submits it
      immediately instead of leaving it sitting in the input. */
  pendingQuestion: string;
  clearPendingQuestion: () => void;
};

const DocsSearchContext = createContext<DocsSearchContextValue | null>(null);

const LazyDocsSearchDialog = dynamic(
  () => import('@/components/ui/cmdk/docs-search-command').then((module) => module.DocsSearchDialog),
  { ssr: false },
);

export function DocsSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const assistantOpen = useSyncExternalStore(
    subscribeAssistantOpen,
    readAssistantOpen,
    () => false,
  );
  const [assistantDraft, setAssistantDraft] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState('');

  const openSearch = useCallback((entryPoint: SearchEntryPoint = 'header') => {
    captureDocsEvent('docs_search_opened', { entry_point: entryPoint });
    setOpen(true);
  }, []);
  // The assistant lives in a persistent sidebar, so opening it must not reset
  // conversation state; an empty draft leaves whatever the user already typed.
  // A non-empty draft is a question the user already committed to (search
  // handoffs), so it queues for immediate submission.
  const openAssistant = useCallback((
    draft = '',
    entryPoint: AssistantEntryPoint = 'hero',
  ) => {
    captureDocsEvent('docs_ai_opened', { entry_point: entryPoint });
    if (draft) {
      setAssistantDraft(draft);
      setPendingQuestion(draft);
    }
    setOpen(false);
    writeAssistantOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const closeAssistant = useCallback(() => writeAssistantOpen(false), []);
  const clearPendingQuestion = useCallback(() => setPendingQuestion(''), []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key === 'k' || event.code === 'KeyK') {
        event.preventDefault();
        openSearch('shortcut');
      }
      if (key === 'i' || event.code === 'KeyI') {
        event.preventDefault();
        if (assistantOpen) closeAssistant();
        else openAssistant('', 'shortcut');
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [assistantOpen, closeAssistant, openAssistant, openSearch]);

  const value = useMemo(
    () => ({
      open,
      openSearch,
      close,
      assistantOpen,
      openAssistant,
      closeAssistant,
      assistantDraft,
      setAssistantDraft,
      pendingQuestion,
      clearPendingQuestion,
    }),
    [assistantDraft, assistantOpen, clearPendingQuestion, close, closeAssistant, open, openAssistant, openSearch, pendingQuestion],
  );

  return (
    <DocsSearchContext.Provider value={value}>
      {children}
      {open && <LazyDocsSearchDialog />}
    </DocsSearchContext.Provider>
  );
}

export function useDocsSearchController() {
  const context = useContext(DocsSearchContext);
  if (!context) throw new Error('useDocsSearchController must be used inside DocsSearchProvider.');
  return context;
}
