'use client';

import { type ComponentProps, forwardRef, useRef } from 'react';
import { CheckIcon, CopyIcon } from '@/assets/icons';
import { CodeGlyphIcon, resolveCodeLanguage } from '@/components/ai/code-languages';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@mantine/hooks';
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
};

const LANGUAGE_CLASS = /language-([\w#+-]+)/;

export const DocsCodeBlock = forwardRef<HTMLDivElement, DocsCodeBlockProps>(
  function DocsCodeBlock({ icon, className, children, ...preProps }, ref) {
    const preRef = useRef<HTMLPreElement>(null);
    const { copied, copy } = useClipboard({ timeout: 1000 });
    const lang = className?.match(LANGUAGE_CLASS)?.[1];
    const { label, Icon } = resolveCodeLanguage(lang);

    return (
      <div
        ref={ref}
        className="docs-code-block not-fumadocs-codeblock group my-0 overflow-hidden rounded-md border border-(--border-primary) bg-(--bg-surface) [&:has(+.placeholder-config)]:rounded-b-none"
      >
        <div className="flex h-8 items-center gap-[7px] border-b-[0.5px] border-(--border-primary) pr-1.5 pl-3 font-mono text-[11px] leading-none font-[450] text-(--text-primary)">
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
          {label}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-code-copy
            className="ml-auto h-6 w-6 rounded text-(--text-tertiary) active:scale-90 hover:text-(--text-primary) dark:hover:bg-[#232323]!"
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
