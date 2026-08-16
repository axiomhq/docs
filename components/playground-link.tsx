'use client';

import { Play } from 'lucide-react';
import type { AnchorHTMLAttributes } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { captureDocsEvent } from '@/lib/docs-analytics';

/**
 * Standalone "Run in Playground" links in prose (ones not adjacent to a code
 * block — those get seated in the block header instead). Rendered as an
 * outline-variant button with just the play glyph.
 */
export function PlaygroundLink({
  children,
  className,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      className={cn(
        buttonVariants({ variant: 'outline' }),
        'playground-link ph-no-capture w-fit cursor-pointer no-underline!',
        className,
      )}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) captureDocsEvent('docs_playground_opened', {});
      }}
    >
      <Play size={12} aria-hidden="true" />
      <span>{children}</span>
    </a>
  );
}
