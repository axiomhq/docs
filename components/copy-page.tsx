'use client';

import { useRef, useState } from 'react';
import { Check, ChevronDown, Copy, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { captureDocsEvent } from '@/lib/docs-analytics';

// Assistant links must reference the production origin: a preview or localhost
// URL is unreachable from the assistant's fetcher.
const SITE_ORIGIN = 'https://axiom.co';

export function CopyPageMenu({ markdownPath }: { markdownPath: string }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const resetTimer = useRef<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const markdownUrl = `${SITE_ORIGIN}${markdownPath}`;
  const assistantPrompt = encodeURIComponent(`Read ${markdownUrl} so I can ask questions about it.`);

  async function copyPage() {
    menu.current?.removeAttribute('open');
    try {
      const response = await fetch(markdownPath);
      if (!response.ok) throw new Error(`${response.status}`);
      await navigator.clipboard.writeText(await response.text());
      setCopied(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000);
      captureDocsEvent('docs_page_context_action', { action: 'copy_markdown' });
    } catch {
      toast.error('Couldn’t copy page');
    }
  }

  function chooseAction(action: 'view_markdown' | 'open_chatgpt' | 'open_claude' | 'open_perplexity') {
    menu.current?.removeAttribute('open');
    captureDocsEvent('docs_page_context_action', { action });
  }

  return (
    <div className="copy-page">
      <button type="button" className="copy-page-main" onClick={copyPage}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
        <span>{copied ? 'Copied' : 'Copy page'}</span>
      </button>
      <details className="copy-page-menu" ref={menu}>
        <summary role="button" aria-haspopup="menu" aria-label="More page actions"><ChevronDown size={13} /></summary>
        <div className="copy-page-popover" role="menu" aria-label="Page actions">
          <button type="button" role="menuitem" onClick={copyPage}><Copy size={13} /><span>Copy page as Markdown</span></button>
          <a role="menuitem" href={markdownPath} target="_blank" rel="noreferrer" onClick={() => chooseAction('view_markdown')}><FileText size={13} /><span>View as Markdown</span></a>
          <hr />
          <a role="menuitem" href={`https://chatgpt.com/?hints=search&q=${assistantPrompt}`} target="_blank" rel="noreferrer" onClick={() => chooseAction('open_chatgpt')}><ExternalLink size={13} /><span>Open in ChatGPT</span></a>
          <a role="menuitem" href={`https://claude.ai/new?q=${assistantPrompt}`} target="_blank" rel="noreferrer" onClick={() => chooseAction('open_claude')}><ExternalLink size={13} /><span>Open in Claude</span></a>
          <a role="menuitem" href={`https://www.perplexity.ai/search?q=${assistantPrompt}`} target="_blank" rel="noreferrer" onClick={() => chooseAction('open_perplexity')}><ExternalLink size={13} /><span>Open in Perplexity</span></a>
        </div>
      </details>
    </div>
  );
}
