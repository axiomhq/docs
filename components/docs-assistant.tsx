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
import { cn } from '@/lib/utils';

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
      className="docs-assistant-panel min-h-0 flex-1 grid grid-rows-[minmax(0,1fr)_auto] bg-(--bg-canvas) [&_*]:border-border [&_*::before]:border-border [&_*::after]:border-border"
    >
      <MessageScrollerProvider autoScroll>
        <MessageScroller className="docs-assistant-scroller relative min-h-0">
          <MessageScrollerViewport
            className="docs-assistant-messages scroll-fade-t min-h-0 h-full overflow-y-auto pt-[22px] px-6 pb-7 overscroll-contain max-sm:pt-[18px] max-sm:px-[14px] max-sm:pb-6"
            aria-label="AI assistant conversation"
          >
            <MessageScrollerContent
              className="docs-assistant-thread min-h-full flex flex-col gap-[22px]"
              aria-busy={isBusy}
            >
              {messages.length > 0 && (
                <MessageScrollerItem>
                  <button
                    type="button"
                    className="docs-search-clear ml-auto py-1 px-[7px] border-0 rounded-[3px] text-(--text-tertiary) bg-transparent font-sans text-[12px] leading-4 font-medium cursor-pointer hover:text-(--text-primary) hover:bg-(--bg-emph-tertiary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) max-md:min-h-11 max-sm:text-[14px]"
                    onClick={() => chat.setMessages([])}
                  >
                    Clear conversation
                  </button>
                </MessageScrollerItem>
              )}
              {messages.length === 0 ? (
                <MessageScrollerItem className="docs-assistant-empty-item flex flex-auto shrink items-center justify-center">
                  <div className="docs-assistant-empty flex flex-col items-center justify-center text-center">
                    <strong className="text-(--text-primary) font-sans text-[18px] leading-6 font-semibold tracking-[-.01em]">Ask Axiom Docs</strong>
                    <p className="max-w-[420px] m-0 mt-2 text-(--text-tertiary) font-sans text-[13px] leading-5 font-normal">Get an answer assembled from the documentation, with links to the pages used.</p>
                    <p className="docs-assistant-note max-w-[460px] m-0 mt-5 text-(--text-quaternary) font-mono text-[11px] leading-[17px] font-[450]">The assistant searches public documentation only. Don’t include tokens or sensitive data.</p>
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
                  <div
                    className="docs-assistant-working py-[7px] px-0 flex items-center gap-2 text-(--text-tertiary) font-mono text-[11px] leading-4 font-[450]"
                    role="status"
                  >
                    <span className="size-1.5 flex-none border border-brand bg-brand/50 motion-safe:animate-pulse" />
                    <span className="shimmer shimmer-duration-1600">Searching Axiom Docs…</span>
                  </div>
                </MessageScrollerItem>
              )}
              {chat.error && (
                <MessageScrollerItem>
                  <div
                    className="docs-assistant-error px-[11px] py-[10px] flex flex-col gap-1 border border-[color-mix(in_srgb,var(--color-destructive)_50%,transparent)] rounded-md text-(--text-tertiary) bg-[color-mix(in_srgb,var(--color-destructive)_7%,transparent)] font-sans text-[12px] leading-[18px] font-[450]"
                    role="alert"
                  >
                    <strong className="text-(--text-primary) font-semibold">The assistant couldn’t answer.</strong>
                    <span>You can retry or continue with regular search.</span>
                    <div className="mt-[5px] flex gap-1.5">
                      <button type="button" onClick={retry} className="px-[7px] py-1 inline-flex items-center gap-[5px] border border-(--border-primary) rounded-[3px] text-(--text-secondary) bg-(--bg-surface) font-sans text-[11px] leading-4 font-medium cursor-pointer max-md:min-h-[44px]"><RefreshCw size={13} /> Retry</button>
                      <button type="button" onClick={onUseSearch} className="px-[7px] py-1 inline-flex items-center gap-[5px] border border-(--border-primary) rounded-[3px] text-(--text-secondary) bg-(--bg-surface) font-sans text-[11px] leading-4 font-medium cursor-pointer max-md:min-h-[44px]">Use search</button>
                    </div>
                  </div>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton className="docs-assistant-scroll-button absolute right-4 bottom-3 data-[direction=end]:bottom-3 z-[2]" />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="docs-assistant-footer bg-(--bg-surface)">
      <PromptInput
        className="docs-assistant-composer [box-shadow:none]"
        inputGroupClassName="docs-assistant-input-wrap min-h-[64px] h-auto py-3 pr-3 pl-4 flex items-start gap-2 border-0 border-t border-(--border-strong) rounded-none has-[textarea]:rounded-none bg-transparent dark:bg-transparent [box-shadow:none] transition-[border-color] duration-(--duration-1) ease-(--ease-out) focus-within:border-(--color-accent) has-[[data-slot=input-group-control]:focus-visible]:border-(--color-accent) has-[[data-slot=input-group-control]:focus-visible]:ring-0 max-sm:pl-3"
        onSubmit={submit}
      >
        <PromptInputBody>
          <PromptInputTextarea
            id="docs-assistant-input"
            className="w-full max-h-[128px] min-h-[44px] py-0.5 px-0 resize-none border-0 outline-0 text-(--text-primary) bg-transparent dark:bg-transparent font-sans text-[14px] md:text-[14px] leading-[21px] font-[450] placeholder:text-(--text-tertiary) placeholder:opacity-100"
            value={draft}
            maxLength={4_000}
            aria-label="Ask Axiom Docs"
            placeholder={isBusy ? 'Answering from the documentation…' : 'Ask a question about Axiom…'}
            data-ph-no-capture
            onChange={(event) => onDraftChange(event.currentTarget.value)}
          />
          <PromptInputSubmit
            className={cn(
              // `.docs-assistant-input-wrap button` — matched every button, both
              // states. outline-solid is required: Button's base `outline-none`
              // sets --tw-outline-style: none, which outline-2 alone inherits.
              'hover:not-disabled:opacity-[.88] active:not-disabled:opacity-[.72] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-(--color-accent) focus-visible:outline-offset-2 disabled:text-(--text-quaternary) disabled:bg-(--bg-emph-tertiary) disabled:cursor-default max-md:size-11',
              // `.docs-assistant-input-wrap button[type='submit']` — PromptInputSubmit
              // renders type="button" while streaming, so this half of the rule
              // never applied to the stop button. Gated to keep that behaviour.
              !isBusy &&
                'flex-none size-8 p-0 inline-flex items-center justify-center border border-(--border-primary) focus-visible:border-(--border-primary) rounded-md text-(--text-on-inverse-primary) bg-(--bg-emph-primary-inverse) hover:bg-(--bg-emph-primary-inverse) cursor-pointer transition-[opacity,background] duration-(--duration-1) ease-(--ease-out)',
            )}
            status={chat.status}
            onStop={stop}
            disabled={!isBusy && !draft.trim()}
            aria-label={isBusy ? 'Stop answer' : 'Send question'}
          />
        </PromptInputBody>
      </PromptInput>
        <small className="docs-assistant-disclaimer block mt-2 px-4 pb-2.5 text-(--text-tertiary) font-mono text-[10px] leading-[14px] font-[450] max-sm:px-3">Generated from Axiom documentation. Verify critical details.</small>
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
      <Message from="user" className="docs-assistant-message user gap-[7px] max-w-[82%] max-sm:max-w-[92%] ml-auto items-end">
        <span className="text-(--text-tertiary) font-mono text-[10px] leading-[14px] font-semibold tracking-[.06em] uppercase">You</span>
        <MessageContent className="docs-assistant-bubble border border-(--border-primary) group-[.is-user]:rounded-md group-[.is-user]:px-3 group-[.is-user]:py-[10px] group-[.is-user]:text-(--text-secondary) group-[.is-user]:bg-(--bg-surface) font-sans text-[13px] leading-5 font-[450] whitespace-pre-wrap">{text}</MessageContent>
      </Message>
    );
  }

  return (
    <Message from="assistant" className="docs-assistant-message assistant gap-[7px] max-w-[670px]">
      <span className="text-(--text-tertiary) font-mono text-[10px] leading-[14px] font-semibold tracking-[.06em] uppercase">Axiom Docs</span>
      <MessageContent>
        {chips.map((chip) => (
          <div
            className={cn(
              'docs-assistant-tool w-fit px-[7px] py-1 inline-flex items-center gap-1.5 border border-(--border-secondary) rounded-[3px] text-(--text-tertiary) bg-(--bg-inert) font-mono text-[10px] leading-[14px] font-[450]',
              chip.failed && 'error text-(--text-destructive)',
            )}
            key={chip.key}
          >
            <Search size={12} />
            {/* In-flight lookups shimmer so a slow tool call reads as progress. */}
            <span className={chip.failed ? undefined : 'shimmer shimmer-duration-1600'}>{chip.label}</span>
          </div>
        ))}
        {/* Tool chips disappear once their call resolves, so without this the
            message sits empty between the last tool finishing and the first
            text delta — which looked like nothing was happening. */}
        {active && !text && chips.length === 0 && (
          <div
            className="docs-assistant-working py-[7px] px-0 flex items-center gap-2 text-(--text-tertiary) font-mono text-[11px] leading-4 font-[450]"
            role="status"
          >
            <span className="size-1.5 flex-none border border-brand bg-brand/50 motion-safe:animate-pulse" />
            <span className="shimmer shimmer-duration-1600">Composing answer…</span>
          </div>
        )}
        {text && (
          // linkSafety defaults to enabled, which renders citations as <button>s
          // behind a confirmation modal. Every URL here comes from our own
          // search_docs/read_docs_page tools and is same-origin /docs, so keep
          // them as real anchors that navigate, as they did before.
          <MessageResponse
            className={cn(
              'docs-ai-markdown text-(--text-secondary) font-sans text-[14px] leading-[22px] font-normal',
              '[&>:first-child]:mt-0! [&>:last-child]:mb-0!',
              '[&_:is(h1,h2,h3,h4,h5,h6)]:text-(--text-primary) [&_:is(h1,h2,h3,h4,h5,h6)]:font-sans [&_:is(h1,h2,h3,h4,h5,h6)]:font-medium [&_:is(h1,h2,h3,h4,h5,h6)]:tracking-[-.01em]',
              '[&_h1]:mt-[22px] [&_h1]:mb-2 [&_h1]:text-[16px] [&_h1]:leading-6',
              '[&_h2]:mt-[18px] [&_h2]:mb-[7px] [&_h2]:text-[14px] [&_h2]:leading-[21px]',
              '[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-[13px] [&_h3]:leading-5',
              '[&_:is(h4,h5,h6)]:mt-[14px] [&_:is(h4,h5,h6)]:mb-[5px] [&_:is(h4,h5,h6)]:text-[12px] [&_:is(h4,h5,h6)]:leading-[18px]',
              '[&_:is(h1,h2,h3):first-child]:mt-0',
              '[&_:where(p,ul,ol)]:m-0 [&_:where(p,ul,ol)]:mb-[11px] [&_:where(ul,ol)]:ps-[18px]',
              '[&_li]:my-[3px] [&_li]:ps-0.5 [&_li]:marker:text-(--text-quaternary) [&_li>p]:m-0 [&_li>p]:mb-1 [&_li:last-child]:mb-0',
              '[&_:is(ul,ol)_:is(ul,ol)]:m-0 [&_:is(ul,ol)_:is(ul,ol)]:mt-[3px]',
              '[&_hr]:my-4 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-t-(--border-secondary)',
              '[&_blockquote]:m-0 [&_blockquote]:mb-[11px] [&_blockquote]:ps-[11px] [&_blockquote]:border-l-2 [&_blockquote]:border-l-(--border-strong) [&_blockquote]:text-(--text-tertiary)',
              '[&_table]:w-full [&_table]:m-0 [&_table]:mb-3 [&_table]:border-collapse [&_table]:text-[12.5px]',
              '[&_:where(th,td)]:py-[5px] [&_:where(th,td)]:px-2 [&_:where(th,td)]:border [&_:where(th,td)]:border-(--border-secondary) [&_:where(th,td)]:text-left',
              '[&_th]:text-(--text-primary) [&_th]:bg-(--bg-inert) [&_th]:font-semibold',
              '[&_strong]:text-(--text-primary) [&_strong]:font-semibold',
              '[&_a]:text-(--text-primary) [&_a]:underline [&_a]:decoration-(--border-strong) [&_a]:underline-offset-[3px] [&_a:hover]:decoration-(--color-accent)',
              '[&_code:not(pre_code)]:py-px [&_code:not(pre_code)]:px-1 [&_code:not(pre_code)]:border [&_code:not(pre_code)]:border-(--border-primary) [&_code:not(pre_code)]:rounded-[3px] [&_code:not(pre_code)]:text-(--text-primary) [&_code:not(pre_code)]:bg-(--bg-inert) [&_code:not(pre_code)]:font-mono [&_code:not(pre_code)]:text-[12px] [&_code:not(pre_code)]:leading-[18px] [&_code:not(pre_code)]:font-[450]',
              "[&_[data-streamdown='code-block']]:my-3 [&_[data-streamdown='code-block']]:p-0 [&_[data-streamdown='code-block']]:gap-2 [&_[data-streamdown='code-block']]:overflow-hidden [&_[data-streamdown='code-block']]:border [&_[data-streamdown='code-block']]:border-(--border-primary) [&_[data-streamdown='code-block']]:rounded-md [&_[data-streamdown='code-block']]:bg-(--bg-surface)",
              "[&_[data-streamdown='code-block-header']]:py-0 [&_[data-streamdown='code-block-header']]:px-3 [&_[data-streamdown='code-block-header']]:text-(--text-tertiary) [&_[data-streamdown='code-block-header']]:font-mono [&_[data-streamdown='code-block-header']]:text-[11px] [&_[data-streamdown='code-block-header']]:leading-4 [&_[data-streamdown='code-block-header']]:font-[450]",
              "[&_[data-streamdown='code-block-header']>span]:ms-0 [&_[data-streamdown='code-block-header']+div]:pe-2",
              "[&_[data-streamdown='code-block-actions']]:border-(--border-secondary) [&_[data-streamdown='code-block-actions']]:bg-(--bg-raised)",
              "[&_[data-streamdown='code-block-body']]:m-0 [&_[data-streamdown='code-block-body']]:pt-0 [&_[data-streamdown='code-block-body']]:px-3 [&_[data-streamdown='code-block-body']]:pb-3 [&_[data-streamdown='code-block-body']]:border-0 [&_[data-streamdown='code-block-body']]:rounded-none [&_[data-streamdown='code-block-body']]:bg-transparent",
              '[&_pre]:m-0! [&_pre]:p-0 [&_pre]:bg-transparent!',
              '[&_:is(pre,pre_code)]:font-mono [&_:is(pre,pre_code)]:text-[12px] [&_:is(pre,pre_code)]:leading-[19px] [&_:is(pre,pre_code)]:font-[450]',
            )}
            linkSafety={{ enabled: false }}
          >
            {text}
          </MessageResponse>
        )}
        {/* The turn finished but left nothing to read — usually because the model
            spent its whole final step emitting tool calls as prose, which
            stripPseudoToolCalls removes. Never leave the message blank: that
            reads as a hang. */}
        {!active && !text && (
          <div
            className="docs-assistant-error px-[11px] py-[10px] flex flex-col gap-1 border border-[color-mix(in_srgb,var(--color-destructive)_50%,transparent)] rounded-md text-(--text-tertiary) bg-[color-mix(in_srgb,var(--color-destructive)_7%,transparent)] font-sans text-[12px] leading-[18px] font-[450]"
            role="alert"
          >
            <strong className="text-(--text-primary) font-semibold">The assistant didn’t finish this answer.</strong>
            <span>
              {hadPseudoToolCalls
                ? 'It kept trying to look things up instead of replying. Retrying usually works.'
                : 'No answer came back for this question.'}
            </span>
            {onRetry && (
              <div className="mt-[5px] flex gap-1.5">
                <button type="button" onClick={onRetry} className="px-[7px] py-1 inline-flex items-center gap-[5px] border border-(--border-primary) rounded-[3px] text-(--text-secondary) bg-(--bg-surface) font-sans text-[11px] leading-4 font-medium cursor-pointer max-md:min-h-[44px]"><RefreshCw size={13} /> Retry</button>
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
    <Sources
      className="docs-assistant-sources mt-1 mb-0 pt-[11px] block border-t border-(--border-secondary)"
      open={open}
      onOpenChange={setOpen}
    >
          <SourcesTrigger
            count={sources.length}
            className="mb-2 p-0 border-0 text-(--text-tertiary) bg-transparent font-mono text-[10px] leading-[14px] font-semibold tracking-[.06em] uppercase cursor-pointer hover:text-(--text-primary) [&_p]:[font:inherit] [&_p]:[letter-spacing:inherit]"
          />
          <SourcesContent className="docs-assistant-sources-list w-full max-w-full mt-0 flex flex-row flex-wrap gap-[5px]">
            {sources.map((source, index) => (
              <Source
                href={source.url}
                key={source.url}
                title={source.title}
                className="max-w-full px-1.5 py-0.5 inline-flex items-center gap-1 border border-(--border-primary) rounded-[3px] text-(--text-tertiary) bg-(--bg-inert) font-sans text-[10px] leading-[15px] font-medium hover:border-(--border-strong) hover:text-(--text-primary) hover:bg-(--bg-raised) max-md:min-h-[44px]"
                onClick={() => captureDocsEvent('docs_ai_source_opened', {
                  destination_path: safeDocsPath(source.url),
                  source_rank: index + 1,
                })}
              >
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{source.title}</span><ArrowUpRight size={9} className="flex-none size-[9px] opacity-75" />
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
