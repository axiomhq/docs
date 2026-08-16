'use client';

import { Close, TrashCan } from '@carbon/icons-react';
import { useRouter } from 'next/navigation';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useRef,
  useState,
} from 'react';
import { SparkleIcon } from '@/assets/icons';
import { DocsAssistantPanel } from '@/components/docs-assistant';
import { useDocsSearchController } from '@/components/docs-search-provider';
import { Button } from '@/components/ui/button';
import { withoutDocsBasePath } from '@/lib/docs-paths';
import { cn } from '@/lib/utils';


/**
 * Persistent Ask AI sidebar. Mounted once from the docs shell (which lives in
 * the root layout), so the conversation, draft, and any in-flight answer
 * survive page navigations. Closing only hides it — the panel stays mounted
 * after its first open so nothing is lost on reopen.
 */
export function DocsAssistantSidebar() {
  const {
    assistantOpen,
    closeAssistant,
    assistantDraft,
    setAssistantDraft,
    openSearch,
    pendingQuestion,
    clearPendingQuestion,
  } = useDocsSearchController();
  const router = useRouter();
  // Filled in by the assistant panel once it loads; clears the conversation.
  const clearConversationRef = useRef<(() => void) | null>(null);
  // Render-time latch: once opened, stay mounted forever so the conversation
  // survives close/reopen.
  const [everOpened, setEverOpened] = useState(false);
  if (assistantOpen && !everOpened) setEverOpened(true);

  if (!assistantOpen && !everOpened) return null;

  // Answers and source chips render plain /docs anchors; route them through
  // the client router so following a citation doesn't reload the app and wipe
  // the conversation this sidebar exists to preserve.
  const handleLinkClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor || anchor.target === '_blank') return;
    const href = anchor.getAttribute('href');
    if (!href?.startsWith('/docs')) return;
    event.preventDefault();
    router.push(withoutDocsBasePath(href));
  };
  const handleEscape = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    closeAssistant();
  };

  return (
    <aside
      className={cn(
        // Fills the resizable panel on desktop; the panel and its drag handle
        // own the width and the divider line there.
        'docs-assistant-sidebar ph-no-capture h-full w-full flex-col bg-background',
        'max-xl:fixed max-xl:top-14 max-xl:right-0 max-xl:bottom-0 max-xl:z-[65] max-xl:h-auto max-xl:w-[min(400px,92vw)] max-xl:border-l max-xl:border-border/50 max-xl:shadow-[-12px_0_48px_rgba(0,0,0,.35)]',
        // Phones: the overlay owns the whole viewport width.
        'max-sm:left-0 max-sm:w-auto max-sm:border-l-0 max-sm:shadow-none',
        assistantOpen ? 'flex' : 'hidden',
      )}
      aria-label="Ask AI"
      data-ph-no-capture
      onClick={handleLinkClick}
      onKeyDown={handleEscape}
    >
      <header className="flex h-12 flex-none items-center gap-2 pl-4 pr-2.5">
        <SparkleIcon aria-hidden="true" className="size-3.5 text-foreground" />
        <span className="font-sans text-[13px] leading-none font-medium text-foreground">
          Ask AI
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto"
          aria-label="Clear conversation"
          onClick={() => clearConversationRef.current?.()}
        >
          <TrashCan size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close Ask AI"
          onClick={closeAssistant}
        >
          <Close size={16} />
        </Button>
      </header>
      <DocsAssistantPanel
        open={assistantOpen}
        draft={assistantDraft}
        clearRef={clearConversationRef}
        pendingQuestion={pendingQuestion}
        onPendingQuestionConsumed={clearPendingQuestion}
        onDraftChange={setAssistantDraft}
        onUseSearch={() => openSearch('assistant_handoff')}
      />
    </aside>
  );
}
