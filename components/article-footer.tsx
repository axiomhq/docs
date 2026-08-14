'use client';

import { ZoneLink as Link } from '@/components/zone-link';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, ArrowUpRight, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { captureDocsEvent } from '@/lib/docs-analytics';
import type { AdjacentNavigationItem } from '@/lib/navigation';

type Feedback = 'yes' | 'no';

// Hover states use `[&:hover]` / explicit-ancestor variants instead of
// `hover:` / `group-hover:`, which Tailwind v4 compiles inside
// `@media (hover: hover)` — coarse-pointer devices (and Playwright's Pixel 7
// project) must keep the unconditional behaviour.

export function ArticleFooter({
  pageHref,
  pageTitle,
  editHref,
  previous,
  next,
}: {
  pageHref: string;
  pageTitle: string;
  editHref: string;
  previous?: AdjacentNavigationItem;
  next?: AdjacentNavigationItem;
}) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function submitFeedback(value: Feedback) {
    if (feedback) return;
    setFeedback(value);
    captureDocsEvent('docs_page_feedback_submitted', {
      helpful: value === 'yes',
      page_path: pageHref,
      page_title: pageTitle,
    });
  }

  return (
    <footer className="article-footer mt-20 text-(--text-quaternary) font-mono text-xs leading-4 font-[450]">
      <div className="article-footer-meta flex items-center justify-between gap-x-6 gap-y-3 flex-wrap">
        <div className="page-feedback flex items-center gap-3 text-(--text-tertiary) max-sm:flex-wrap">
          <span className="text-(--text-secondary) font-sans text-[13px] leading-4 font-[550] max-sm:w-full">Was this page helpful?</span>
          <div className="page-feedback-actions flex gap-1.5">
            <button type="button" className="h-7 px-2.5 inline-flex items-center gap-1.5 border-0 rounded-md text-(--text-tertiary) bg-(--bg-emph-tertiary) font-sans text-[12px] leading-4 font-medium cursor-pointer transition-[background-color,color] duration-150 ease-[ease] [&:hover:not(:disabled)]:text-(--text-primary) [&:hover:not(:disabled)]:bg-(--bg-emph-secondary) aria-pressed:text-(--color-accent-text) aria-pressed:bg-[color-mix(in_srgb,var(--color-accent)_13%,transparent)] disabled:cursor-default disabled:aria-[pressed=false]:opacity-45" aria-label="Yes, this page was helpful" aria-pressed={feedback === 'yes'} disabled={feedback !== null} onClick={() => submitFeedback('yes')}>
              <ThumbsUp size={12} aria-hidden="true" />
              Yes
            </button>
            <button type="button" className="h-7 px-2.5 inline-flex items-center gap-1.5 border-0 rounded-md text-(--text-tertiary) bg-(--bg-emph-tertiary) font-sans text-[12px] leading-4 font-medium cursor-pointer transition-[background-color,color] duration-150 ease-[ease] [&:hover:not(:disabled)]:text-(--text-primary) [&:hover:not(:disabled)]:bg-(--bg-emph-secondary) aria-pressed:text-(--color-accent-text) aria-pressed:bg-[color-mix(in_srgb,var(--color-accent)_13%,transparent)] disabled:cursor-default disabled:aria-[pressed=false]:opacity-45" aria-label="No, this page was not helpful" aria-pressed={feedback === 'no'} disabled={feedback !== null} onClick={() => submitFeedback('no')}>
              <ThumbsDown size={12} aria-hidden="true" />
              No
            </button>
          </div>
          {feedback && <span className="page-feedback-thanks text-(--text-quaternary)" role="status">Thanks for the feedback.</span>}
        </div>
        <div className="article-footer-links">
          <a
            href={editHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-(--text-quaternary) no-underline transition-colors duration-150 ease-[ease] [&:hover]:text-(--text-secondary)"
            onClick={() => captureDocsEvent('docs_edit_opened', { page_path: pageHref })}
          >
            Suggest edits on GitHub
            <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </div>
      </div>

      {(previous || next) && (
        <nav className="article-pagination mt-8 grid grid-cols-2 gap-6 max-sm:grid-cols-[1fr]" aria-label="Adjacent documentation pages">
          {previous && (
            <Link href={previous.href} prefetch={false} className={cn('article-previous items-start', 'min-w-0 -mx-3.5 px-3.5 py-3 flex flex-col-reverse gap-1.5 rounded-[6px] no-underline transition-[background-color] duration-150 ease-[ease] [&:hover]:bg-(--bg-inert)')}>
              <small className="inline-flex items-center gap-1.5 text-(--text-quaternary) font-mono text-[10px] leading-[14px] font-medium tracking-[.05em] uppercase transition-colors duration-150 ease-[ease] [.article-pagination_a:hover_&]:text-(--text-tertiary)">
                <ArrowLeft size={11} aria-hidden="true" className={cn('flex-none transition-transform duration-150 ease-[ease]', '[.article-previous:hover_&]:-translate-x-0.5')} />
                Previous
              </small>
              <strong className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-(--text-secondary) font-sans text-[15px] leading-[21px] font-[550] tracking-[-.008em] transition-colors duration-150 ease-[ease] [.article-pagination_a:hover_&]:text-(--text-primary)">{previous.title}</strong>
            </Link>
          )}
          {next && (
            <Link href={next.href} prefetch={false} className={cn('article-next col-[2] items-end text-right max-sm:col-[1]', 'min-w-0 -mx-3.5 px-3.5 py-3 flex flex-col-reverse gap-1.5 rounded-[6px] no-underline transition-[background-color] duration-150 ease-[ease] [&:hover]:bg-(--bg-inert)')}>
              <small className="inline-flex items-center gap-1.5 text-(--text-quaternary) font-mono text-[10px] leading-[14px] font-medium tracking-[.05em] uppercase transition-colors duration-150 ease-[ease] [.article-pagination_a:hover_&]:text-(--text-tertiary)">
                Next
                <ArrowRight size={11} aria-hidden="true" className={cn('flex-none transition-transform duration-150 ease-[ease]', '[.article-next:hover_&]:translate-x-0.5')} />
              </small>
              <strong className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-(--text-secondary) font-sans text-[15px] leading-[21px] font-[550] tracking-[-.008em] transition-colors duration-150 ease-[ease] [.article-pagination_a:hover_&]:text-(--text-primary)">{next.title}</strong>
            </Link>
          )}
        </nav>
      )}
    </footer>
  );
}
