'use client';

import { Search } from 'lucide-react';
import { useDocsSearchController } from '@/components/docs-search-provider';

export function SearchPrompt() {
  const { openSearch } = useDocsSearchController();
  return (
    <button
      className="hero-search w-full h-10 mt-7 px-[14px] py-0 flex items-center gap-2.5 border border-(--border-strong) rounded-md text-(--text-tertiary) bg-(--bg-surface) cursor-pointer hover:bg-(--bg-raised)"
      onClick={() => openSearch('hero')}
    >
      <Search size={16} />
      <span className="flex-1 text-left font-sans text-[15px] leading-5 font-normal">Search the docs — or ask a question…</span>
      <kbd className="inline-flex h-5 items-center justify-center rounded-sm border border-border bg-muted px-1.5 align-middle font-mono text-xs leading-none font-medium text-muted-foreground">⌘K</kbd>
    </button>
  );
}

export function AskAiPrompt() {
  const { openAssistant } = useDocsSearchController();
  return <button className="p-0 border-0 text-inherit bg-transparent cursor-pointer" onClick={() => openAssistant('', 'hero')}>Ask AI ⌘I</button>;
}
