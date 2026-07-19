'use client';

import { useChat } from '@ai-sdk/react';
import { ArrowUpRight, RefreshCw, Search, Send, Square } from 'lucide-react';
import { type FormEvent, useEffect, useRef } from 'react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Markdown } from '@/components/markdown';

type AssistantSource = {
  title: string;
  url: string;
};

type DocsAssistantPanelProps = {
  open: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onUseSearch: () => void;
};

const chatTransport = new DefaultChatTransport<UIMessage>({
  api: '/api/chat',
  prepareSendMessagesRequest({ messages }) {
    return {
      body: {
        messages,
        currentPath: window.location.pathname.startsWith('/docs')
          ? window.location.pathname
          : '/docs',
      },
    };
  },
});

export function DocsAssistantPanel({
  open,
  draft,
  onDraftChange,
  onUseSearch,
}: DocsAssistantPanelProps) {
  const chat = useChat<UIMessage>({ id: 'axiom-docs-assistant', transport: chatTransport });
  const listRef = useRef<HTMLDivElement>(null);
  const isBusy = chat.status === 'submitted' || chat.status === 'streaming';
  const messages = chat.messages.filter((message) => message.role !== 'system');

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => document.getElementById('docs-assistant-input')?.focus(), 0);
    return () => window.clearTimeout(timeout);
  }, [open]);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat.status, messages]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const question = draft.trim();
    if (!question || isBusy) return;
    onDraftChange('');
    void chat.sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: question }],
    });
  };

  return (
    <section id="docs-assistant-panel" role="tabpanel" aria-labelledby="docs-assistant-tab" className="docs-assistant-panel">
      <div ref={listRef} className="docs-assistant-messages" role="log" aria-live="polite" aria-label="AI assistant conversation">
        {messages.length > 0 && (
          <button type="button" className="docs-search-clear" onClick={() => chat.setMessages([])}>
            Clear conversation
          </button>
        )}
        {messages.length === 0 ? (
          <div className="docs-assistant-empty">
            <strong>Ask Axiom Docs</strong>
            <p>Get an answer assembled from the documentation, with links to the pages used.</p>
            <p className="docs-assistant-note">The assistant searches public documentation only. Don’t include tokens or sensitive data.</p>
          </div>
        ) : (
          messages.map((message) => <AssistantMessage message={message} key={message.id} />)
        )}
        {chat.status === 'submitted' && (
          <div className="docs-assistant-working" role="status"><span /> Searching Axiom Docs…</div>
        )}
        {chat.error && (
          <div className="docs-assistant-error" role="alert">
            <strong>The assistant couldn’t answer.</strong>
            <span>You can retry or continue with regular search.</span>
            <div>
              <button type="button" onClick={() => chat.regenerate()}><RefreshCw size={13} /> Retry</button>
              <button type="button" onClick={onUseSearch}>Use search</button>
            </div>
          </div>
        )}
      </div>
      <form className="docs-assistant-composer" onSubmit={submit}>
        <textarea
          id="docs-assistant-input"
          value={draft}
          rows={2}
          maxLength={4_000}
          aria-label="Ask Axiom Docs"
          placeholder={isBusy ? 'Answering from the documentation…' : 'Ask a question about Axiom…'}
          disabled={isBusy}
          data-ph-no-capture
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) submit(event);
          }}
        />
        {isBusy ? (
          <button type="button" aria-label="Stop answer" onClick={() => chat.stop()}><Square size={13} fill="currentColor" /></button>
        ) : (
          <button type="submit" aria-label="Send question" disabled={!draft.trim()}><Send size={15} /></button>
        )}
        <small>Generated from Axiom documentation. Verify critical details.</small>
      </form>
    </section>
  );
}

function AssistantMessage({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
  const toolParts = message.parts.filter((part) => part.type.startsWith('tool-'));
  const sources = assistantSources(message);

  if (message.role === 'user') {
    return <div className="docs-assistant-message user"><span>You</span><p>{text}</p></div>;
  }

  return (
    <div className="docs-assistant-message assistant">
      <span>Axiom Docs</span>
      {toolParts.map((part, index) => {
        const invocation = part as unknown as { state?: string; input?: { query?: string }; errorText?: string };
        if (invocation.state?.startsWith('output') && invocation.state !== 'output-error') return null;
        const failed = invocation.state === 'output-error' || invocation.state === 'output-denied';
        return (
          <div className={failed ? 'docs-assistant-tool error' : 'docs-assistant-tool'} key={`${part.type}-${index}`}>
            <Search size={12} />
            {failed ? invocation.errorText ?? 'Documentation search failed' : invocation.input?.query ? `Searching “${invocation.input.query}”` : 'Searching documentation'}
          </div>
        );
      })}
      {text && <div className="docs-ai-markdown"><Markdown text={text} /></div>}
      {sources.length > 0 && (
        <div className="docs-assistant-sources">
          <strong>Sources</strong>
          {sources.map((source) => (
            <a href={source.url} key={source.url}>
              <span>{source.title}</span><ArrowUpRight size={12} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function assistantSources(message: UIMessage): AssistantSource[] {
  const sources = new Map<string, AssistantSource>();
  for (const part of message.parts) {
    if (!part.type.startsWith('tool-') || !('output' in part)) continue;
    const output = (part as unknown as { output?: unknown }).output;
    const values = Array.isArray(output) ? output : output && typeof output === 'object' ? [output] : [];
    for (const value of values) {
      if (!value || typeof value !== 'object') continue;
      const candidate = value as { title?: unknown; url?: unknown };
      if (typeof candidate.url !== 'string' || !candidate.url.startsWith('/docs')) continue;
      const pageUrl = candidate.url.split('#', 1)[0];
      if (sources.has(pageUrl)) continue;
      sources.set(pageUrl, {
        title: typeof candidate.title === 'string' ? candidate.title : candidate.url,
        url: candidate.url,
      });
    }
  }
  return [...sources.values()].slice(0, 4);
}
