'use client';

import Link from 'next/link';
import posthog from 'posthog-js';
import { ArrowLeft, ArrowRight, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import type { AdjacentNavigationItem } from '@/lib/navigation';

type Feedback = 'yes' | 'no';

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
    posthog.capture('docs_page_feedback_submitted', {
      helpful: value === 'yes',
      page_path: pageHref,
      page_title: pageTitle,
    });
  }

  return (
    <footer className="article-footer">
      <div className="page-feedback">
        <span>Was this page helpful?</span>
        <div className="page-feedback-actions">
          <button type="button" aria-label="Yes, this page was helpful" aria-pressed={feedback === 'yes'} disabled={feedback !== null} onClick={() => submitFeedback('yes')}>
            <ThumbsUp size={13} aria-hidden="true" /> Yes
          </button>
          <button type="button" aria-label="No, this page was not helpful" aria-pressed={feedback === 'no'} disabled={feedback !== null} onClick={() => submitFeedback('no')}>
            <ThumbsDown size={13} aria-hidden="true" /> No
          </button>
        </div>
        {feedback && <span className="page-feedback-thanks" role="status">Thanks for the feedback.</span>}
      </div>

      {(previous || next) && (
        <nav className="article-pagination" aria-label="Adjacent documentation pages">
          {previous && (
            <Link href={previous.href} prefetch={false} className="article-previous">
              <ArrowLeft size={15} aria-hidden="true" />
              <span><small>Previous</small><strong>{previous.title}</strong></span>
            </Link>
          )}
          {next && (
            <Link href={next.href} prefetch={false} className="article-next">
              <span><small>Next</small><strong>{next.title}</strong></span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}

      <div className="article-footer-links">
        <a href={editHref} target="_blank" rel="noreferrer">Suggest edits on GitHub</a>
      </div>
    </footer>
  );
}
