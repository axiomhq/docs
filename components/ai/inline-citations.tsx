import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Compact citation footer, adapted from aicss.dev's Inline Citations
 * (module.css converted to Tailwind, palette on our tokens). We use its reference-list
 * half: numbered marks with title · path rows and a hover arrow. The
 * superscript in-prose markers need the model to emit [n] citations, which
 * the docs assistant's prompt doesn't do (it cites with markdown links) — a
 * follow-up if that contract changes.
 */
export type Citation = {
  title: string;
  url: string;
};

export function InlineCitations({
  citations,
  className,
  onOpen,
}: {
  citations: Citation[];
  className?: string;
  onOpen?: (citation: Citation, rank: number) => void;
}) {
  if (citations.length === 0) return null;

  return (
    <div
      className={cn(
        'mt-3 flex flex-col gap-1.5 border-t border-(--border-secondary) pt-2.5',
        className,
      )}
    >
      {citations.map((citation, index) => (
        <a
          key={citation.url}
          href={citation.url}
          title={citation.title}
          className="group/cite flex min-w-0 items-center gap-1.5 font-sans text-[12px] leading-[18px] text-(--text-tertiary) no-underline!"
          onClick={() => onOpen?.(citation, index + 1)}
        >
          <span className="inline-flex size-3 flex-none items-center justify-center rounded-[4px] bg-(--bg-emph-tertiary) text-[9px] leading-none font-semibold text-(--text-tertiary)">
            {index + 1}
          </span>
          <span className="min-w-0 flex-none truncate font-[450] text-(--text-primary)">
            {citation.title}
          </span>
          <span className="flex-none text-(--text-quaternary)">·</span>
          <span className="min-w-0 truncate text-(--text-tertiary) transition-colors duration-200 group-hover/cite:text-(--text-primary)">
            {citation.url.replace(/^\//, '')}
          </span>
          <ArrowUpRight
            size={10}
            aria-hidden="true"
            className="-ml-0.5 flex-none translate-x-[-2px] translate-y-[2px] text-(--text-quaternary) opacity-0 transition-[opacity,transform] duration-200 group-hover/cite:translate-x-0 group-hover/cite:translate-y-0 group-hover/cite:opacity-100"
          />
        </a>
      ))}
    </div>
  );
}
