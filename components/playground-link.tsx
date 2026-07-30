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
      className={['playground-link', 'ph-no-capture', 'w-fit min-h-6 px-[7px] py-0 inline-flex items-center gap-[5px] border border-(--border-primary) rounded-[3px] text-(--text-secondary)! bg-[color-mix(in_srgb,var(--bg-canvas)_88%,transparent)] font-mono text-[10px] leading-[14px] font-[550] no-underline! hover:border-(--border-strong) hover:text-(--text-primary)! hover:bg-(--bg-raised)', className].filter(Boolean).join(' ')}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) captureDocsEvent('docs_playground_opened', {});
      }}
    >
      <Play size={12} />
      <span>{children}</span>
      <ExternalLink className="text-(--text-quaternary)" size={11} aria-label="Opens in a new tab" />
    </a>
  );
}
