'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { captureDocsEvent } from '@/lib/docs-analytics';
import { copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

export function CopyButton({
  value,
  label = 'Copy',
  analytics,
  className,
}: {
  value: string;
  label?: string;
  analytics?: {
    codeKind: 'api_sample' | 'endpoint_path';
    language?: string;
  };
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={cn(
        'copy-button ml-auto p-1 inline-flex items-center gap-1.5 border-0 text-(--text-quaternary) bg-transparent cursor-pointer font-mono! text-[11px]! leading-4! font-[450]! hover:text-(--text-primary)',
        className,
      )}
      type="button"
      aria-label={`${label} to clipboard`}
      onClick={async () => {
        if (!(await copyToClipboard(value))) return;
        if (analytics) {
          captureDocsEvent('docs_code_copied', {
            code_kind: analytics.codeKind,
            language: analytics.language,
          });
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}{label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}
