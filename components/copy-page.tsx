'use client';

import { useRef, useState } from 'react';
import { CaretDown, Chat, Checkmark, Copy, Document } from '@carbon/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { captureDocsEvent } from '@/lib/docs-analytics';
import { copyToClipboard } from '@/lib/clipboard';
import { useDocsSearchController } from '@/components/docs-search-provider';

// Assistant links must reference the production origin: a preview or localhost
// URL is unreachable from the assistant's fetcher.
const SITE_ORIGIN = 'https://axiom.co';

// `!` marks declarations that would otherwise lose to unlayered element
// defaults (`button { font: inherit }` and `a { color: inherit; … }`), which
// always beat Tailwind's `@layer utilities` regardless of specificity.

// Monochrome brand marks (currentColor). Anthropic + OpenAI from simple-icons;
// Grok from svgl. External AI links open the page as context in that tool.
function ClaudeIcon() {
  return (
    <svg className="copy-page-brand w-[15px] h-[15px] flex-none text-(--icon-secondary) [.copy-page-popover_button:hover_&]:text-(--text-primary) [.copy-page-popover_a:hover_&]:text-(--text-primary)" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
    </svg>
  );
}
function ChatGptIcon() {
  return (
    <svg className="copy-page-brand w-[15px] h-[15px] flex-none text-(--icon-secondary) [.copy-page-popover_button:hover_&]:text-(--text-primary) [.copy-page-popover_a:hover_&]:text-(--text-primary)" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  );
}
function GrokIcon() {
  return (
    <svg className="copy-page-brand w-[15px] h-[15px] flex-none text-(--icon-secondary) [.copy-page-popover_button:hover_&]:text-(--text-primary) [.copy-page-popover_a:hover_&]:text-(--text-primary)" viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M395.479 633.828L735.91 381.105C752.599 368.715 776.454 373.548 784.406 392.792C826.26 494.285 807.561 616.253 724.288 699.996C641.016 783.739 525.151 802.104 419.247 760.277L303.556 814.143C469.49 928.202 670.987 899.995 796.901 773.282C896.776 672.843 927.708 535.937 898.785 412.476L899.047 412.739C857.105 231.37 909.358 158.874 1016.4 10.6326C1018.93 7.11771 1021.47 3.60279 1024 0L883.144 141.651V141.212L395.392 633.916" />
      <path d="M325.226 695.251C206.128 580.84 226.662 403.776 328.285 301.668C403.431 226.097 526.549 195.254 634.026 240.596L749.454 186.994C728.657 171.88 702.007 155.623 671.424 144.2C533.19 86.9942 367.693 115.465 255.323 228.382C147.234 337.081 113.244 504.215 171.613 646.833C215.216 753.423 143.739 828.818 71.7385 904.916C46.2237 931.893 20.6216 958.87 0 987.429L325.139 695.339" />
    </svg>
  );
}

export function CopyPageMenu({ markdownPath }: { markdownPath: string }) {
  const resetTimer = useRef<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const { openAssistant } = useDocsSearchController();

  const markdownUrl = `${SITE_ORIGIN}${markdownPath}`;
  const assistantPrompt = encodeURIComponent(`Read ${markdownUrl} so I can ask questions about it.`);

  async function copyPage() {
    try {
      const response = await fetch(markdownPath);
      if (!response.ok) throw new Error(`${response.status}`);
      if (!(await copyToClipboard(await response.text()))) throw new Error('copy failed');
      setCopied(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000);
      captureDocsEvent('docs_page_context_action', { action: 'copy_markdown' });
    } catch {
      toast.error('Couldn’t copy page');
    }
  }

  function askAiAboutPage() {
    captureDocsEvent('docs_page_context_action', { action: 'ask_ai' });
    openAssistant('', 'copy_page_menu');
  }

  function chooseAction(action: 'view_markdown' | 'open_claude' | 'open_chatgpt' | 'open_grok') {
    captureDocsEvent('docs_page_context_action', { action });
  }

  const itemClassName = 'copy-page-action min-h-8 cursor-pointer gap-2.5 rounded-md px-2.5 py-1.5 text-(--text-primary)! text-[13px] leading-[17px] font-medium tracking-[-.006em] no-underline! hover:bg-interactive-hover focus:bg-interactive-selected';
  const actionIconClassName = 'size-4 flex-none text-(--icon-secondary) group-hover/dropdown-menu-item:text-(--text-primary) group-focus/dropdown-menu-item:text-(--text-primary)';

  return (
    <div className="copy-page relative ml-auto flex shrink-0 max-sm:hidden">
      <Button
        type="button"
        variant="outline"
        aria-label={copied ? 'Copied' : 'Copy page'}
        className="copy-page-main h-[30px] gap-[7px] rounded-r-none border-r-0 bg-(--bg-surface) px-[11px] py-0 font-sans! text-[13px]! leading-4! font-medium! text-(--text-tertiary) hover:bg-interactive-hover hover:text-(--text-primary) focus-visible:z-10 dark:bg-(--bg-surface)"
        onClick={copyPage}
      >
        {copied ? (
          <Checkmark aria-hidden="true" data-slot="copy-page-copy-icon" />
        ) : (
          <Copy aria-hidden="true" data-slot="copy-page-copy-icon" />
        )}
        <span aria-hidden="true" data-slot="copy-page-label" className="grid h-4 items-center">
          <span className={copied ? 'col-start-1 row-start-1 invisible' : 'col-start-1 row-start-1'}>Copy page</span>
          <span className={copied ? 'col-start-1 row-start-1' : 'col-start-1 row-start-1 invisible'}>Copied</span>
        </span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="More page actions"
              className="copy-page-menu h-[30px] w-[27px] rounded-l-none bg-(--bg-surface) text-(--text-quaternary) hover:bg-interactive-hover hover:text-(--text-primary) focus-visible:z-10 dark:bg-(--bg-surface)"
            />
          )}
        >
          <CaretDown aria-hidden="true" data-slot="copy-page-menu-icon" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          aria-label="Page actions"
          className="copy-page-popover w-[220px] rounded-md border border-border bg-popover p-1 shadow-none ring-0"
        >
          <DropdownMenuItem
            className={itemClassName}
            render={(
              <a
                href={markdownPath}
                target="_blank"
                rel="noreferrer"
                onClick={() => chooseAction('view_markdown')}
              />
            )}
          >
            <Document aria-hidden="true" data-slot="copy-page-action-icon" className={actionIconClassName} />
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">View as Markdown</span>
          </DropdownMenuItem>
          <DropdownMenuItem className={itemClassName} onClick={askAiAboutPage}>
            <Chat aria-hidden="true" data-slot="copy-page-action-icon" className={actionIconClassName} />
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">Ask AI about this page</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="mx-1 bg-border" />
          <DropdownMenuItem
            className={itemClassName}
            render={(
              <a
                href={`https://claude.ai/new?q=${assistantPrompt}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => chooseAction('open_claude')}
              />
            )}
          >
            <ClaudeIcon />
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">Open in Claude</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className={itemClassName}
            render={(
              <a
                href={`https://chatgpt.com/?hints=search&q=${assistantPrompt}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => chooseAction('open_chatgpt')}
              />
            )}
          >
            <ChatGptIcon />
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">Open in ChatGPT</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className={itemClassName}
            render={(
              <a
                href={`https://grok.com/?q=${assistantPrompt}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => chooseAction('open_grok')}
              />
            )}
          >
            <GrokIcon />
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">Open in Grok</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
