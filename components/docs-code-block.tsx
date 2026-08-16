'use client';

import {
  Children,
  type ComponentProps,
  forwardRef,
  isValidElement,
  type ReactNode,
  useRef,
} from 'react';
import { Play } from 'lucide-react';
import { CheckIcon, CopyIcon } from '@/assets/icons';
import { CodeGlyphIcon, resolveCodeLanguage } from '@/components/ai/code-languages';
import { useCopy } from '@/components/ai/use-copy';
import { Button } from '@/components/ui/button';
import { captureDocsEvent } from '@/lib/docs-analytics';
import { cn } from '@/lib/utils';

/**
 * Article code block with the assistant sidebar's chrome: a header row with
 * the fence language's icon + label and a copy button, then the shiki body
 * with line numbers and a gutter rule (globals.css `.docs-code-block`).
 *
 * `icon` is fumadocs' per-language SVG string from its rehype transformer;
 * our language map takes precedence (it knows kusto is APL), the transformer
 * icon covers the rest, and the generic glyph is the last resort.
 */
export type DocsCodeBlockProps = Omit<ComponentProps<'pre'>, 'ref'> & {
  icon?: string;
  /** Playground URL hoisted from the adjacent link by rehype-playground-code. */
  'data-playground'?: string;
};

const LANGUAGE_CLASS = /language-([\w#+-]+)/;

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

// addLanguageClass puts `language-*` on the code element, so the fence
// language lives on a child rather than the pre itself.
function findLanguage(children: ReactNode): string | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = child.props as { className?: string; children?: ReactNode };
    const match = props.className?.match(LANGUAGE_CLASS);
    if (match) return match[1];
    const nested = findLanguage(props.children);
    if (nested) return nested;
  }
  return undefined;
}

export const DocsCodeBlock = forwardRef<HTMLDivElement, DocsCodeBlockProps>(
  function DocsCodeBlock(
    { icon, className, children, 'data-playground': playgroundHref, ...preProps },
    ref,
  ) {
    const preRef = useRef<HTMLPreElement>(null);
    const { copied, copy } = useCopy();
    const lang = className?.match(LANGUAGE_CLASS)?.[1] ?? findLanguage(children);
    const { label, Icon } = resolveCodeLanguage(lang, textOf(children));

    return (
      <div
        ref={ref}
        className="docs-code-block not-fumadocs-codeblock group my-0 overflow-hidden rounded-md border border-(--border-primary) bg-(--bg-surface) [&:has(+.placeholder-config)]:rounded-b-none"
      >
        <div className="flex h-8 items-center gap-[7px] border-b-[0.5px] border-(--border-primary) pr-1 pl-3 font-mono text-[11px] leading-none font-[450] text-(--text-primary)">
          {Icon ? (
            <Icon className="size-3 flex-none text-(--text-tertiary)" aria-hidden="true" />
          ) : icon ? (
            <span
              aria-hidden="true"
              className="inline-flex size-3 flex-none items-center justify-center text-(--text-tertiary) [&>svg]:size-3 [&>svg]:fill-current"
              dangerouslySetInnerHTML={{ __html: icon }}
            />
          ) : (
            <CodeGlyphIcon className="size-3 flex-none text-(--text-tertiary)" aria-hidden="true" />
          )}
          <span className="capitalize">{label}</span>
          {playgroundHref && (
            <>
              <a
                href={playgroundHref}
                target="_blank"
                rel="noreferrer"
                className="playground-link ph-no-capture ml-auto inline-flex h-6 cursor-pointer items-center gap-1.5 rounded px-1.5 font-mono text-[11px] leading-none font-[450] text-(--text-tertiary) no-underline! transition-colors hover:bg-interactive-hover hover:text-(--text-primary) dark:hover:bg-[#232323]!"
                onClick={() => captureDocsEvent('docs_playground_opened', {})}
              >
                <Play size={11} aria-hidden="true" />
                Run in Playground
              </a>
              <span
                aria-hidden="true"
                className="mx-0.5 h-3.5 w-px flex-none bg-(--border-primary)"
              />
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-code-copy
            className={cn(
              'h-6 w-6 rounded text-(--text-tertiary) active:scale-90 hover:text-(--text-primary) dark:hover:bg-[#232323]!',
              !playgroundHref && 'ml-auto',
            )}
            aria-label={copied ? 'Copied' : 'Copy code'}
            // Copies the rendered text so placeholder substitutions
            // (AXIOM_DOMAIN → the reader's value) come along.
            onClick={() => copy(preRef.current?.innerText ?? '')}
          >
            {copied ? <CheckIcon className="size-[11px]" /> : <CopyIcon className="size-[11px]" />}
          </Button>
        </div>
        <div className="docs-code-body relative overflow-x-auto py-2 pl-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <pre ref={preRef} className={cn(className, 'm-0! bg-transparent! p-0')} {...preProps}>
            {children}
          </pre>
        </div>
      </div>
    );
  },
);
