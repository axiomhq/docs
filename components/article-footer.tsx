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
            <button type="button" className="h-7 px-2.5 inline-flex items-center gap-1.5 border-0 rounded-md text-(--text-tertiary) bg-(--bg-emph-tertiary) font-sans text-[12px] leading-4 font-medium cursor-pointer transition-[background-color,color] duration-150 ease-[ease] [&:hover:not(:disabled)]:text-(--text-primary) [&:hover:not(:disabled)]:bg-interactive-hover aria-pressed:text-(--text-primary) dark:aria-pressed:text-brand aria-pressed:bg-[color-mix(in_srgb,var(--brand)_13%,transparent)] disabled:cursor-default disabled:aria-[pressed=false]:opacity-45" aria-label="Yes, this page was helpful" aria-pressed={feedback === 'yes'} disabled={feedback !== null} onClick={() => submitFeedback('yes')}>
              <ThumbsUp size={12} aria-hidden="true" />
              Yes
            </button>
            <button type="button" className="h-7 px-2.5 inline-flex items-center gap-1.5 border-0 rounded-md text-(--text-tertiary) bg-(--bg-emph-tertiary) font-sans text-[12px] leading-4 font-medium cursor-pointer transition-[background-color,color] duration-150 ease-[ease] [&:hover:not(:disabled)]:text-(--text-primary) [&:hover:not(:disabled)]:bg-interactive-hover aria-pressed:text-(--text-primary) dark:aria-pressed:text-brand aria-pressed:bg-[color-mix(in_srgb,var(--brand)_13%,transparent)] disabled:cursor-default disabled:aria-[pressed=false]:opacity-45" aria-label="No, this page was not helpful" aria-pressed={feedback === 'no'} disabled={feedback !== null} onClick={() => submitFeedback('no')}>
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
        <nav className="article-pagination mt-8 grid grid-cols-2 gap-3 max-sm:grid-cols-[1fr] max-sm:gap-2" aria-label="Adjacent documentation pages">
          {previous && (
            <Link href={previous.href} prefetch={false} className={cn('article-pagination-link article-previous', 'min-w-0 min-h-[76px] px-4 py-3.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border border-(--border-primary) rounded-[4px] bg-(--bg-surface) no-underline transition-[background-color,border-color] duration-(--duration-1) ease-(--ease-out) [&:hover]:border-(--border-strong) [&:hover]:bg-interactive-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) active:bg-interactive-selected')}>
              <ArrowLeft size={15} aria-hidden="true" className="article-pagination-arrow flex-none text-(--text-quaternary) transition-[color,transform] duration-(--duration-2) ease-(--ease-out) [.article-previous:hover_&]:-translate-x-0.5 [.article-previous:hover_&]:text-brand" />
              <span className="min-w-0 flex flex-col items-start gap-1">
                <small className="text-(--text-quaternary) font-mono text-[10px] leading-[14px] font-medium tracking-[.06em] uppercase transition-colors duration-(--duration-1) ease-(--ease-out) [.article-previous:hover_&]:text-(--text-secondary)">
                  Previous
                </small>
                <strong className="max-w-full text-(--text-primary) font-sans text-[15px] leading-5 font-[550] tracking-[-.008em] line-clamp-2">{previous.title}</strong>
              </span>
            </Link>
          )}
          {next && (
            <Link href={next.href} prefetch={false} className={cn('article-pagination-link article-next col-[2] max-sm:col-[1]', 'min-w-0 min-h-[76px] px-4 py-3.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border border-(--border-primary) rounded-[4px] bg-(--bg-surface) text-right no-underline transition-[background-color,border-color] duration-(--duration-1) ease-(--ease-out) [&:hover]:border-(--border-strong) [&:hover]:bg-interactive-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) active:bg-interactive-selected')}>
              <span className="min-w-0 flex flex-col items-end gap-1">
                <small className="text-(--text-quaternary) font-mono text-[10px] leading-[14px] font-medium tracking-[.06em] uppercase transition-colors duration-(--duration-1) ease-(--ease-out) [.article-next:hover_&]:text-(--text-secondary)">
                  Next
                </small>
                <strong className="max-w-full text-(--text-primary) font-sans text-[15px] leading-5 font-[550] tracking-[-.008em] line-clamp-2">{next.title}</strong>
              </span>
              <ArrowRight size={15} aria-hidden="true" className="article-pagination-arrow flex-none text-(--text-quaternary) transition-[color,transform] duration-(--duration-2) ease-(--ease-out) [.article-next:hover_&]:translate-x-0.5 [.article-next:hover_&]:text-brand" />
            </Link>
          )}
        </nav>
      )}
    </footer>
  );
}
