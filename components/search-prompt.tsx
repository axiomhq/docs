'use client';

import { Search } from 'lucide-react';
import { useDocsSearchController } from '@/components/docs-search-provider';

export function SearchPrompt() {
  const { openSearch } = useDocsSearchController();
  return (
    <button className="hero-search" onClick={openSearch}>
      <Search size={16} />
      <span>Search the docs — or ask a question…</span>
      <kbd>⌘K</kbd>
    </button>
  );
}

export function AskAiPrompt() {
  const { openAssistant } = useDocsSearchController();
  return <button onClick={() => openAssistant()}>Ask AI ⌘I</button>;
}
