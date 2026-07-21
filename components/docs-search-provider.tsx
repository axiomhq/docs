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
} from 'react';

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

const LazyDocsSearchDialog = dynamic(
  () => import('@/components/docs-search').then((module) => module.DocsSearchDialog),
  { ssr: false },
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
      {open && <LazyDocsSearchDialog />}
    </DocsSearchContext.Provider>
  );
}

export function useDocsSearchController() {
  const context = useContext(DocsSearchContext);
  if (!context) throw new Error('useDocsSearchController must be used inside DocsSearchProvider.');
  return context;
}
