'use client';

import { ExternalLink, Play } from 'lucide-react';
import type { AnchorHTMLAttributes } from 'react';
import { captureDocsEvent } from '@/lib/docs-analytics';

export function PlaygroundLink({
  children,
  className,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      className={['playground-link', 'ph-no-capture', className].filter(Boolean).join(' ')}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) captureDocsEvent('docs_playground_opened', {});
      }}
    >
      <Play size={12} />
      <span>{children}</span>
      <ExternalLink size={11} aria-label="Opens in a new tab" />
    </a>
  );
}
