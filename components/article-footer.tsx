'use client';

import { ZoneLink as Link } from '@/components/zone-link';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { captureDocsEvent } from '@/lib/docs-analytics';
import type { AdjacentNavigationItem } from '@/lib/navigation';

type Feedback = 'yes' | 'no';

// Hover states are written as `[&:hover]` / explicit-ancestor variants instead
// of `hover:` / `group-hover:`, which Tailwind v4 compiles inside
// `@media (hover: hover)` — the hand-written CSS these replace was
// unconditional, and coarse-pointer devices (and Playwright's Pixel 7 project)
// must keep it. Colour/decoration/`<small>` metrics carry `!` because the
// unlayered element defaults (`a { color: inherit; text-decoration: none }`,
// `small { font-size: 12px; line-height: 16px; color: var(--text-tertiary) }`)
// outrank anything Tailwind emits into `@layer utilities`.

// Utilities shared by both adjacent-page cards (was `.article-pagination a`).
const PAGINATION_LINK =
  'min-h-[76px] px-[14px] py-[13px] flex items-center gap-[11px] border border-(--border-primary) rounded-[4px] text-(--text-tertiary)! bg-(--bg-surface) no-underline! transition-[border-color,background,color] duration-150 ease-[ease] [&:hover]:border-(--border-strong) [&:hover]:text-(--text-primary)! [&:hover]:bg-(--bg-raised)';
const PAGINATION_TEXT = 'min-w-0 flex flex-1 flex-col gap-[3px]';
const PAGINATION_KICKER =
  'text-(--text-quaternary)! font-mono text-[10px]! leading-[14px]! font-medium tracking-[.05em] uppercase';
const PAGINATION_TITLE =
  'overflow-hidden text-(--text-secondary) font-sans text-[13px] leading-[18px] font-[550] text-ellipsis whitespace-nowrap [.article-pagination_a:hover_&]:text-(--text-primary)';
const FEEDBACK_BUTTON =
  '[font:inherit] p-0 border-0 text-(--text-tertiary) bg-transparent cursor-pointer underline decoration-(--border-strong) underline-offset-[3px] [&:hover:not(:disabled)]:text-(--text-primary) [&:hover:not(:disabled)]:decoration-(--color-accent) aria-pressed:text-(--text-primary) aria-pressed:decoration-(--color-accent) disabled:cursor-default disabled:aria-[pressed=false]:text-(--text-quaternary) disabled:aria-[pressed=false]:no-underline';

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
    <footer className="article-footer mt-16 pt-6 border-t border-(--border-primary) text-(--text-quaternary) font-mono text-xs leading-4 font-[450]">
      {(previous || next) && (
        <nav className="article-pagination grid grid-cols-2 gap-[10px] max-sm:grid-cols-[1fr]" aria-label="Adjacent documentation pages">
          {previous && (
            <Link href={previous.href} prefetch={false} className={cn('article-previous', PAGINATION_LINK)}>
              <ArrowLeft size={15} aria-hidden="true" />
              <span className={PAGINATION_TEXT}><small className={PAGINATION_KICKER}>Previous</small><strong className={PAGINATION_TITLE}>{previous.title}</strong></span>
            </Link>
          )}
          {next && (
            <Link href={next.href} prefetch={false} className={cn('article-next col-[2] text-right max-sm:col-[1]', PAGINATION_LINK)}>
              <span className={PAGINATION_TEXT}><small className={PAGINATION_KICKER}>Next</small><strong className={PAGINATION_TITLE}>{next.title}</strong></span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}

      <div className="article-footer-meta mt-[18px] flex items-center justify-between gap-x-6 gap-y-2 flex-wrap">
        <div className="page-feedback flex items-center gap-3 text-(--text-tertiary) max-sm:items-start max-sm:flex-wrap">
          <span className="text-(--text-secondary) font-[550] max-sm:w-full">Was this page helpful?</span>
          <div className="page-feedback-actions flex gap-[14px]">
            <button type="button" className={FEEDBACK_BUTTON} aria-label="Yes, this page was helpful" aria-pressed={feedback === 'yes'} disabled={feedback !== null} onClick={() => submitFeedback('yes')}>Yes</button>
            <button type="button" className={FEEDBACK_BUTTON} aria-label="No, this page was not helpful" aria-pressed={feedback === 'no'} disabled={feedback !== null} onClick={() => submitFeedback('no')}>No</button>
          </div>
          {feedback && <span className="page-feedback-thanks text-(--text-quaternary)" role="status">Thanks for the feedback.</span>}
        </div>
        <div className="article-footer-links">
          <a
            href={editHref}
            target="_blank"
            rel="noreferrer"
            className="text-(--text-quaternary)! no-underline! [&:hover]:text-(--text-secondary)! [&:hover]:underline! [&:hover]:decoration-current! [&:hover]:underline-offset-[3px]!"
            onClick={() => captureDocsEvent('docs_edit_opened', { page_path: pageHref })}
          >
            Suggest edits on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
