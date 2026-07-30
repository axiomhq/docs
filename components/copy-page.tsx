'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Copy, FileText, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { captureDocsEvent } from '@/lib/docs-analytics';
import { copyToClipboard } from '@/lib/clipboard';
import { useDocsSearchController } from '@/components/docs-search-provider';

// Assistant links must reference the production origin: a preview or localhost
// URL is unreachable from the assistant's fetcher.
const SITE_ORIGIN = 'https://axiom.co';

// Hover states are written as `[&:hover]` / explicit-ancestor variants instead
// of `hover:` / `group-hover:`: Tailwind v4 wraps those in
// `@media (hover: hover)`, while the hand-written CSS they replace applied on
// every pointer type. `!` marks the declarations that would otherwise lose to
// unlayered element defaults (`button { font: inherit }`,
// `a { color: inherit; text-decoration: none }`, `small { … }`, `hr { … }`),
// which always beat Tailwind's `@layer utilities` regardless of specificity.

// Utilities shared by every row / icon in the popover (was
// `.copy-page-popover button, .copy-page-popover a` and friends).
const POPOVER_ITEM =
  'w-full px-[9px] py-2 flex items-start gap-[11px] border-0 rounded-[4px] text-(--text-secondary)! bg-transparent text-left no-underline! cursor-pointer [&:hover]:bg-(--bg-emph-tertiary) focus-visible:outline-2 focus-visible:outline-(--color-accent) focus-visible:outline-offset-[-2px]';
const POPOVER_ITEM_TEXT = 'min-w-0 flex flex-col gap-0.5';
const POPOVER_ITEM_TITLE =
  'text-(--text-primary) font-sans text-[13px] leading-[17px] font-[550] tracking-[-.006em]';
const POPOVER_ITEM_DESC = 'text-(--text-tertiary)! font-sans text-xs! leading-4! font-normal';
const POPOVER_ICON =
  'flex-none mt-0.5 text-(--icon-secondary) [.copy-page-popover_button:hover_&]:text-(--text-primary) [.copy-page-popover_a:hover_&]:text-(--text-primary)';
const POPOVER_BRAND = `copy-page-brand w-[15px] h-[15px] ${POPOVER_ICON}`;
// Shared by the copy button and the menu trigger.
const TRIGGER_FOCUS =
  'focus-visible:outline-2 focus-visible:outline-(--color-accent) focus-visible:outline-offset-2 focus-visible:z-[1]';

// Monochrome brand marks (currentColor). Anthropic + OpenAI from simple-icons;
// Grok from svgl. External AI links open the page as context in that tool.
function ClaudeIcon() {
  return (
    <svg className={POPOVER_BRAND} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
    </svg>
  );
}
function ChatGptIcon() {
  return (
    <svg className={POPOVER_BRAND} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  );
}
function GrokIcon() {
  return (
    <svg className={POPOVER_BRAND} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M395.479 633.828L735.91 381.105C752.599 368.715 776.454 373.548 784.406 392.792C826.26 494.285 807.561 616.253 724.288 699.996C641.016 783.739 525.151 802.104 419.247 760.277L303.556 814.143C469.49 928.202 670.987 899.995 796.901 773.282C896.776 672.843 927.708 535.937 898.785 412.476L899.047 412.739C857.105 231.37 909.358 158.874 1016.4 10.6326C1018.93 7.11771 1021.47 3.60279 1024 0L883.144 141.651V141.212L395.392 633.916" />
      <path d="M325.226 695.251C206.128 580.84 226.662 403.776 328.285 301.668C403.431 226.097 526.549 195.254 634.026 240.596L749.454 186.994C728.657 171.88 702.007 155.623 671.424 144.2C533.19 86.9942 367.693 115.465 255.323 228.382C147.234 337.081 113.244 504.215 171.613 646.833C215.216 753.423 143.739 828.818 71.7385 904.916C46.2237 931.893 20.6216 958.87 0 987.429L325.139 695.339" />
    </svg>
  );
}

export function CopyPageMenu({ markdownPath }: { markdownPath: string }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const resetTimer = useRef<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const { openAssistant } = useDocsSearchController();

  const markdownUrl = `${SITE_ORIGIN}${markdownPath}`;
  const assistantPrompt = encodeURIComponent(`Read ${markdownUrl} so I can ask questions about it.`);

  function closeMenu() {
    menu.current?.removeAttribute('open');
  }

  // Native <details> only closes on summary click; dismiss it on an outside
  // pointer or Escape like a real menu, returning focus to the trigger.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const el = menu.current;
      if (el?.open && !el.contains(event.target as Node)) el.removeAttribute('open');
    }
    function onKeyDown(event: KeyboardEvent) {
      const el = menu.current;
      if (event.key === 'Escape' && el?.open) {
        el.removeAttribute('open');
        el.querySelector<HTMLElement>('summary')?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  async function copyPage() {
    closeMenu();
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
    closeMenu();
    captureDocsEvent('docs_page_context_action', { action: 'ask_ai' });
    openAssistant('', 'copy_page_menu');
  }

  function chooseAction(action: 'view_markdown' | 'open_claude' | 'open_chatgpt' | 'open_grok') {
    closeMenu();
    captureDocsEvent('docs_page_context_action', { action });
  }

  return (
    <div className="copy-page relative ml-auto flex shrink-0 max-sm:hidden">
      <button type="button" className={cn('copy-page-main h-[30px] px-[11px] py-0 inline-flex items-center gap-[7px] border border-(--border-primary) rounded-l-[4px] rounded-r-none text-(--text-tertiary) bg-(--bg-surface) font-sans! text-[13px]! leading-4! font-medium! cursor-pointer [&:hover]:text-(--text-primary) [&:hover]:bg-(--bg-inert)', TRIGGER_FOCUS)} onClick={copyPage}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span>{copied ? 'Copied' : 'Copy page'}</span>
      </button>
      <details className="copy-page-menu group/menu" ref={menu}>
        <summary role="button" aria-haspopup="menu" aria-label="More page actions" className={cn('h-[30px] w-[27px] inline-flex items-center justify-center border border-(--border-primary) border-l-0 rounded-l-none rounded-r-[4px] text-(--text-quaternary) bg-(--bg-surface) cursor-pointer list-none [&::-webkit-details-marker]:hidden [&:hover]:text-(--text-primary) [&:hover]:bg-(--bg-inert) group-open/menu:text-(--text-primary) group-open/menu:bg-(--bg-inert)', TRIGGER_FOCUS)}><ChevronDown size={14} /></summary>
        <div className="copy-page-popover hidden group-open/menu:block absolute top-[34px] right-0 z-[70] w-[296px] p-[5px] border border-(--border-primary) rounded-[6px] bg-(--bg-overlay) shadow-[0_8px_28px_rgba(0,0,0,.28)]" role="menu" aria-label="Page actions">
          <button type="button" role="menuitem" className={POPOVER_ITEM} onClick={copyPage}>
            <Copy size={15} className={POPOVER_ICON} />
            <span className={POPOVER_ITEM_TEXT}><strong className={POPOVER_ITEM_TITLE}>Copy page</strong><small className={POPOVER_ITEM_DESC}>Copy this page as Markdown for LLMs</small></span>
          </button>
          <a role="menuitem" className={POPOVER_ITEM} href={markdownPath} target="_blank" rel="noreferrer" onClick={() => chooseAction('view_markdown')}>
            <FileText size={15} className={POPOVER_ICON} />
            <span className={POPOVER_ITEM_TEXT}><strong className={POPOVER_ITEM_TITLE}>View as Markdown</strong><small className={POPOVER_ITEM_DESC}>Open this page as plain text</small></span>
          </a>
          <button type="button" role="menuitem" className={POPOVER_ITEM} onClick={askAiAboutPage}>
            <MessageSquare size={15} className={POPOVER_ICON} />
            <span className={POPOVER_ITEM_TEXT}><strong className={POPOVER_ITEM_TITLE}>Ask AI about this page</strong><small className={POPOVER_ITEM_DESC}>Chat with this page as context</small></span>
          </button>
          <hr className="my-[5px]! mx-[3px]! border-0! border-t! border-t-(--border-primary)!" />
          <a role="menuitem" className={POPOVER_ITEM} href={`https://claude.ai/new?q=${assistantPrompt}`} target="_blank" rel="noreferrer" onClick={() => chooseAction('open_claude')}>
            <ClaudeIcon />
            <span className={POPOVER_ITEM_TEXT}><strong className={POPOVER_ITEM_TITLE}>Open in Claude</strong><small className={POPOVER_ITEM_DESC}>Ask Claude about this page</small></span>
          </a>
          <a role="menuitem" className={POPOVER_ITEM} href={`https://chatgpt.com/?hints=search&q=${assistantPrompt}`} target="_blank" rel="noreferrer" onClick={() => chooseAction('open_chatgpt')}>
            <ChatGptIcon />
            <span className={POPOVER_ITEM_TEXT}><strong className={POPOVER_ITEM_TITLE}>Open in ChatGPT</strong><small className={POPOVER_ITEM_DESC}>Ask ChatGPT about this page</small></span>
          </a>
          <a role="menuitem" className={POPOVER_ITEM} href={`https://grok.com/?q=${assistantPrompt}`} target="_blank" rel="noreferrer" onClick={() => chooseAction('open_grok')}>
            <GrokIcon />
            <span className={POPOVER_ITEM_TEXT}><strong className={POPOVER_ITEM_TITLE}>Open in Grok</strong><small className={POPOVER_ITEM_DESC}>Ask Grok about this page</small></span>
          </a>
        </div>
      </details>
    </div>
  );
}
