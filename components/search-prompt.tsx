'use client';

import { Search } from 'lucide-react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';

export function SearchPrompt() {
  const { setOpenSearch } = useSearchContext();
  return (
    <button className="hero-search" onClick={() => setOpenSearch(true)}>
      <Search size={16} />
      <span>Search the docs — or ask a question…</span>
      <kbd>⌘K</kbd>
    </button>
  );
}

export function AskAiPrompt() {
  const { setOpenSearch } = useSearchContext();
  return <button onClick={() => setOpenSearch(true)}>Ask AI ⌘I</button>;
}
