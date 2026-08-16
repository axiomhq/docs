'use client';

import { ArrowUpRight, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDocsSearch as useFumadocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import {
  ApiIntroductionIcon,
  ArrowUpRightIcon,
  ConsoleIcon,
  MethodsIcon,
  QueryIntroductionIcon,
  QuickStartIcon,
} from '@/assets/icons';
import { useDocsSearchController } from '@/components/docs-search-provider';
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/cmdk/command';
import {
  analyticsTimestamp,
  captureDocsEvent,
  durationBucket,
  safeDocsPath,
} from '@/lib/docs-analytics';
import { docsApiPath, withoutDocsBasePath } from '@/lib/docs-paths';
import { sanitizeSearchSnippet } from '@/lib/docs-search-rank';

const SUGGESTED_PAGES = [
  { title: 'Quickstart', section: 'Platform overview', href: '/getting-started', Icon: QuickStartIcon },
  { title: 'Send data', section: 'Methods', href: '/send-data/methods', Icon: MethodsIcon },
  { title: 'Query with APL', section: 'Query reference', href: '/apl/introduction', Icon: QueryIntroductionIcon },
  { title: 'API reference', section: 'REST API', href: '/restapi/introduction', Icon: ApiIntroductionIcon },
  { title: 'Explore data', section: 'Query data', href: '/query-data/explore', Icon: ConsoleIcon },
];

const ASK_VALUE = 'ask-ai';

/**
 * Docs search as a command menu (ui/cmdk primitives). The old Search/Ask AI
 * tab strip is gone — Ask AI lives as a button beside the input, twinned with
 * the footer control. cmdk owns keyboard navigation; results stay server-side
 * (shouldFilter=false).
 */
export function DocsSearchDialog() {
  const router = useRouter();
  const { open, close, openAssistant } = useDocsSearchController();
  const client = useMemo(() => fetchClient({ api: `${docsApiPath('/search')}?v=2` }), []);
  const { search, setSearch, query } = useFumadocsSearch({ client, delayMs: 300 });
  const [value, setValue] = useState('');
  const searchStartedAt = useRef(0);
  const searchWasLoading = useRef(false);
  // cmdk fires the same onSelect for clicks and Enter; a pointerdown latch
  // keeps the analytics input_method distinction the old dialog reported.
  const pointerSelect = useRef(false);
  const results = Array.isArray(query.data) ? query.data : [];
  const hasQuery = Boolean(search.trim());

  // Keep Enter meaning "open the first result": the Ask AI row sits above the
  // results but must not steal the default selection when results land.
  useEffect(() => {
    setValue(results[0] ? `result:${results[0].id}` : hasQuery ? ASK_VALUE : `suggested:${SUGGESTED_PAGES[0].href}`);
  }, [hasQuery, query.data]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const inputMethod = () => {
    const method = pointerSelect.current ? 'pointer' : 'keyboard';
    pointerSelect.current = false;
    return method as 'keyboard' | 'pointer';
  };
  const navigate = (url: string, resultRank: number) => {
    captureDocsEvent('docs_search_result_opened', {
      destination_path: safeDocsPath(url),
      input_method: inputMethod(),
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

  return (
    <CommandDialog
      title="Search Axiom Docs"
      description="Search documentation or hand the question to Ask AI."
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      className="docs-search-dialog ph-no-capture"
    >
      <Command
        shouldFilter={false}
        loop
        value={value}
        onValueChange={setValue}
        data-ph-no-capture
        onPointerDown={() => {
          pointerSelect.current = true;
        }}
        onKeyDown={() => {
          pointerSelect.current = false;
        }}
      >
        <CommandInput
          autoFocus
          value={search}
          placeholder="Search pages, APIs, APL, and MPL…"
          aria-label="Search documentation"
          data-ph-no-capture
          onValueChange={(next) => {
            searchStartedAt.current = analyticsTimestamp();
            setSearch(next);
          }}
          trailing={
            <button
              type="button"
              className="inline-flex flex-none cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-sans text-[11px] leading-4 font-medium text-(--text-tertiary) transition-[color] duration-(--duration-1) ease-(--ease-out) hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) active:text-(--color-accent)"
              onClick={() => openAssistant(search.trim(), 'mode_tab')}
            >
              Ask AI
              <span className="inline-flex items-center gap-1">
                <kbd className="kbd-cmd">⌘</kbd>
                <kbd>I</kbd>
              </span>
            </button>
          }
        />
        <CommandList className="docs-search-results" aria-busy={query.isLoading}>
          {hasQuery && (
            <CommandItem
              value={ASK_VALUE}
              className="docs-search-ask-row mb-1.5 justify-between gap-3 border border-(--border-primary) bg-(--bg-inert) font-medium data-[selected=true]:border-(--border-strong)"
              onSelect={() => handoff('search_handoff', search.trim())}
            >
              <span className="inline-flex min-w-0 items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                <BookOpen size={15} /> Ask AI about “{search.trim()}”
              </span>
              <ArrowUpRight size={14} />
            </CommandItem>
          )}
          {!hasQuery && (
            <CommandGroup heading="Suggested">
              {SUGGESTED_PAGES.map(({ title, section, href, Icon }) => (
                <CommandItem
                  key={href}
                  value={`suggested:${href}`}
                  className="group/suggested"
                  onSelect={() => {
                    close();
                    router.push(href);
                  }}
                >
                  <span className="flex size-4 items-center justify-center text-(--icon-secondary) [&>svg]:size-3.5">
                    <Icon />
                  </span>
                  {title}
                  <CommandShortcut className="gap-2">
                    <span className="font-mono text-[10px] leading-[14px] font-[450] text-(--text-tertiary) max-sm:hidden">{section}</span>
                    <ArrowUpRightIcon
                      aria-hidden="true"
                      className="size-2 text-(--text-tertiary) opacity-0 transition-opacity duration-200 group-data-[selected=true]/suggested:opacity-100"
                    />
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {hasQuery && query.isLoading && results.length === 0 && (
            <div className="docs-search-status px-3 py-[38px] text-center font-mono text-[12px] leading-[18px] font-[450] text-(--text-tertiary)" role="status">Searching documentation…</div>
          )}
          {hasQuery && !query.isLoading && results.length === 0 && query.data === 'empty' && (
            <div className="docs-search-status px-3 py-[38px] text-center font-mono text-[12px] leading-[18px] font-[450] text-(--text-tertiary)" role="status">No matching documentation found.</div>
          )}
          {results.map((result, index) => (
            <CommandItem
              key={result.id}
              value={`result:${result.id}`}
              className="docs-search-result min-h-[52px] flex-col items-stretch justify-center gap-[3px] max-sm:min-h-14"
              onSelect={() => navigate(result.url, index + 1)}
            >
              <SearchBreadcrumbs items={result.breadcrumbs} />
              <span className="docs-search-result-content line-clamp-2 max-sm:leading-5">
                <HighlightedText value={result.content} />
              </span>
            </CommandItem>
          ))}
        </CommandList>
        <footer className="docs-search-footer flex min-h-[34px] flex-none items-center gap-[14px] border-t border-(--border-primary) bg-(--bg-surface) px-3 py-1.5 font-mono text-[10px] leading-[14px] font-[450] text-(--text-tertiary) max-sm:hidden">
          <span className="inline-flex items-center gap-1"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span className="inline-flex items-center gap-1"><kbd>↵</kbd> Open</span>
        </footer>
      </Command>
    </CommandDialog>
  );
}

function HighlightedText({ value }: { value: string }) {
  const safeValue = sanitizeSearchSnippet(value);
  return safeValue.split(/(<mark>.*?<\/mark>)/gi).map((part, index) => {
    const match = part.match(/^<mark>(.*?)<\/mark>$/i);
    return match ? (
      <mark key={index} className="bg-transparent font-semibold text-(--brand)">{match[1]}</mark>
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
