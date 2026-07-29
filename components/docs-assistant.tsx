'use client';

import { useChat } from '@ai-sdk/react';
import { ArrowUpRight, RefreshCw, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import {
  analyticsTimestamp,
  captureDocsEvent,
  durationBucket,
  safeDocsPath,
} from '@/lib/docs-analytics';
import { docsApiPath } from '@/lib/docs-paths';

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
  api: docsApiPath('/chat'),
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
  const requestStartedAt = useRef<number | null>(null);
  const isBusy = chat.status === 'submitted' || chat.status === 'streaming';
  const messages = chat.messages.filter((message) => message.role !== 'system');

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => document.getElementById('docs-assistant-input')?.focus(), 0);
    return () => window.clearTimeout(timeout);
  }, [open]);
  useEffect(() => {
    const startedAt = requestStartedAt.current;
    if (startedAt === null) return;

    if (chat.status === 'error') {
      requestStartedAt.current = null;
      captureDocsEvent('docs_ai_answer_completed', {
        duration_bucket: durationBucket(analyticsTimestamp() - startedAt),
        outcome: 'error',
        source_count: 0,
      });
      return;
    }

    if (chat.status !== 'ready') return;
    const answer = [...chat.messages].reverse().find((message) => message.role === 'assistant');
    if (!answer) return;
    requestStartedAt.current = null;
    captureDocsEvent('docs_ai_answer_completed', {
      duration_bucket: durationBucket(analyticsTimestamp() - startedAt),
      outcome: 'answered',
      source_count: assistantSources(answer).length,
    });
  }, [chat.messages, chat.status]);

  const submit = (message: PromptInputMessage) => {
    const question = (message.text ?? '').trim();
    if (!question || isBusy) return;
    requestStartedAt.current = analyticsTimestamp();
    captureDocsEvent('docs_ai_question_submitted', {
      submission_type: 'question',
      turn_number: messages.filter((entry) => entry.role === 'user').length + 1,
    });
    onDraftChange('');
    void chat.sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: question }],
    });
  };
  const retry = () => {
    requestStartedAt.current = analyticsTimestamp();
    captureDocsEvent('docs_ai_question_submitted', {
      submission_type: 'retry',
      turn_number: messages.filter((message) => message.role === 'user').length,
    });
    void chat.regenerate();
  };
  const stop = () => {
    const startedAt = requestStartedAt.current;
    requestStartedAt.current = null;
    if (startedAt !== null) {
      captureDocsEvent('docs_ai_answer_completed', {
        duration_bucket: durationBucket(analyticsTimestamp() - startedAt),
        outcome: 'stopped',
        source_count: 0,
      });
    }
    void chat.stop();
  };

  return (
    <section
      id="docs-assistant-panel"
      role="tabpanel"
      aria-labelledby="docs-assistant-tab"
      className="docs-assistant-panel docs-ai-surface"
    >
      <MessageScrollerProvider autoScroll>
        <MessageScroller className="docs-assistant-scroller">
          <MessageScrollerViewport
            className="docs-assistant-messages scroll-fade-t"
            aria-label="AI assistant conversation"
          >
            <MessageScrollerContent className="docs-assistant-thread" aria-busy={isBusy}>
              {messages.length > 0 && (
                <MessageScrollerItem>
                  <button type="button" className="docs-search-clear" onClick={() => chat.setMessages([])}>
                    Clear conversation
                  </button>
                </MessageScrollerItem>
              )}
              {messages.length === 0 ? (
                <MessageScrollerItem className="docs-assistant-empty-item">
                  <div className="docs-assistant-empty">
                    <strong>Ask Axiom Docs</strong>
                    <p>Get an answer assembled from the documentation, with links to the pages used.</p>
                    <p className="docs-assistant-note">The assistant searches public documentation only. Don’t include tokens or sensitive data.</p>
                  </div>
                </MessageScrollerItem>
              ) : (
                messages.map((message, index) => (
                  <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={message.role === 'user'}>
                    <AssistantMessage
                      message={message}
                      active={isBusy && index === messages.length - 1}
                      onRetry={retry}
                    />
                  </MessageScrollerItem>
                ))
              )}
              {chat.status === 'submitted' && (
                <MessageScrollerItem>
                  <div className="docs-assistant-working" role="status">
                    <span />
                    <span className="shimmer shimmer-duration-1600">Searching Axiom Docs…</span>
                  </div>
                </MessageScrollerItem>
              )}
              {chat.error && (
                <MessageScrollerItem>
                  <div className="docs-assistant-error" role="alert">
                    <strong>The assistant couldn’t answer.</strong>
                    <span>You can retry or continue with regular search.</span>
                    <div>
                      <button type="button" onClick={retry}><RefreshCw size={13} /> Retry</button>
                      <button type="button" onClick={onUseSearch}>Use search</button>
                    </div>
                  </div>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton className="docs-assistant-scroll-button" />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="docs-assistant-footer">
      <PromptInput
        className="docs-assistant-composer"
        inputGroupClassName="docs-assistant-input-wrap"
        onSubmit={submit}
      >
        <PromptInputBody>
          <PromptInputTextarea
            id="docs-assistant-input"
            value={draft}
            maxLength={4_000}
            aria-label="Ask Axiom Docs"
            placeholder={isBusy ? 'Answering from the documentation…' : 'Ask a question about Axiom…'}
            data-ph-no-capture
            onChange={(event) => onDraftChange(event.currentTarget.value)}
          />
          <PromptInputSubmit
            status={chat.status}
            onStop={stop}
            disabled={!isBusy && !draft.trim()}
            aria-label={isBusy ? 'Stop answer' : 'Send question'}
          />
        </PromptInputBody>
      </PromptInput>
        <small className="docs-assistant-disclaimer">Generated from Axiom documentation. Verify critical details.</small>
      </div>
    </section>
  );
}

function AssistantMessage({
  message,
  active = false,
  onRetry,
}: {
  message: UIMessage;
  active?: boolean;
  onRetry?: () => void;
}) {
  const rawText = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
  const text = message.role === 'assistant' ? stripPseudoToolCalls(rawText) : rawText;
  const hadPseudoToolCalls = message.role === 'assistant' && rawText !== '' && text === '';
  const toolParts = message.parts.filter((part) => part.type.startsWith('tool-'));
  const chips = toolChips(toolParts);
  const sources = assistantSources(message);

  if (message.role === 'user') {
    return (
      <Message from="user" className="docs-assistant-message user">
        <span>You</span>
        <MessageContent className="docs-assistant-bubble">{text}</MessageContent>
      </Message>
    );
  }

  return (
    <Message from="assistant" className="docs-assistant-message assistant">
      <span>Axiom Docs</span>
      <MessageContent>
        {chips.map((chip) => (
          <div className={chip.failed ? 'docs-assistant-tool error' : 'docs-assistant-tool'} key={chip.key}>
            <Search size={12} />
            {/* In-flight lookups shimmer so a slow tool call reads as progress. */}
            <span className={chip.failed ? undefined : 'shimmer shimmer-duration-1600'}>{chip.label}</span>
          </div>
        ))}
        {/* Tool chips disappear once their call resolves, so without this the
            message sits empty between the last tool finishing and the first
            text delta — which looked like nothing was happening. */}
        {active && !text && chips.length === 0 && (
          <div className="docs-assistant-working" role="status">
            <span />
            <span className="shimmer shimmer-duration-1600">Composing answer…</span>
          </div>
        )}
        {text && (
          // linkSafety defaults to enabled, which renders citations as <button>s
          // behind a confirmation modal. Every URL here comes from our own
          // search_docs/read_docs_page tools and is same-origin /docs, so keep
          // them as real anchors that navigate, as they did before.
          <MessageResponse className="docs-ai-markdown" linkSafety={{ enabled: false }}>
            {text}
          </MessageResponse>
        )}
        {/* The turn finished but left nothing to read — usually because the model
            spent its whole final step emitting tool calls as prose, which
            stripPseudoToolCalls removes. Never leave the message blank: that
            reads as a hang. */}
        {!active && !text && (
          <div className="docs-assistant-error" role="alert">
            <strong>The assistant didn’t finish this answer.</strong>
            <span>
              {hadPseudoToolCalls
                ? 'It kept trying to look things up instead of replying. Retrying usually works.'
                : 'No answer came back for this question.'}
            </span>
            {onRetry && (
              <div>
                <button type="button" onClick={onRetry}><RefreshCw size={13} /> Retry</button>
              </div>
            )}
          </div>
        )}
      </MessageContent>
      {sources.length > 0 && <AssistantSources sources={sources} />}
    </Message>
  );
}

function AssistantSources({ sources }: { sources: AssistantSource[] }) {
  // Controlled: Base UI warns when an uncontrolled Collapsible's default open
  // state changes after init, which it does here as sources stream in.
  const [open, setOpen] = useState(true);

  return (
    <Sources className="docs-assistant-sources" open={open} onOpenChange={setOpen}>
          <SourcesTrigger count={sources.length} />
          <SourcesContent className="docs-assistant-sources-list">
            {sources.map((source, index) => (
              <Source
                href={source.url}
                key={source.url}
                title={source.title}
                onClick={() => captureDocsEvent('docs_ai_source_opened', {
                  destination_path: safeDocsPath(source.url),
                  source_rank: index + 1,
                })}
              >
                <span>{source.title}</span><ArrowUpRight size={9} />
              </Source>
            ))}
      </SourcesContent>
    </Sources>
  );
}

type ToolChip = { key: string; label: string; failed: boolean };

// Every tool failure is reported with the same generic server-side message, so
// several failing calls in one turn would otherwise stack identical chips.
function toolChips(parts: UIMessage['parts']): ToolChip[] {
  const chips: ToolChip[] = [];
  const seen = new Set<string>();

  parts.forEach((part, index) => {
    const invocation = part as unknown as { state?: string; input?: { query?: string }; errorText?: string };
    if (invocation.state?.startsWith('output') && invocation.state !== 'output-error') return;

    const failed = invocation.state === 'output-error' || invocation.state === 'output-denied';
    const label = failed
      ? invocation.errorText ?? 'Documentation search failed'
      : invocation.input?.query
        ? `Searching “${invocation.input.query}”`
        : 'Searching documentation';

    if (seen.has(label)) return;
    seen.add(label);
    chips.push({ key: `${part.type}-${index}`, label, failed });
  });

  return chips;
}

// Some models (currently z-ai/glm-5.2 via OpenRouter) intermittently emit their
// tool calls as literal text instead of structured tool parts, which would
// otherwise render as raw <tool_call>…</tool_call> markup in the answer. Strip
// complete blocks, then any unterminated trailing block still mid-stream.
const TOOL_CALL_BLOCK = /<tool_call>[\s\S]*?<\/tool_call>/g;
const TOOL_CALL_TRAILING = /<tool_call>[\s\S]*$/;
const TOOL_CALL_STRAY_ARGS = /<\/?(?:arg_key|arg_value|tool_call)>/g;

function stripPseudoToolCalls(text: string) {
  return text
    .replace(TOOL_CALL_BLOCK, '')
    .replace(TOOL_CALL_TRAILING, '')
    .replace(TOOL_CALL_STRAY_ARGS, '')
    .trimStart();
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
