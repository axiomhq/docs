'use client';

import { ZoneLink as Link } from '@/components/zone-link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { captureDocsEvent } from '@/lib/docs-analytics';
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
    captureDocsEvent('docs_page_feedback_submitted', {
      helpful: value === 'yes',
      page_path: pageHref,
      page_title: pageTitle,
    });
  }

  return (
    <footer className="article-footer">
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

      <div className="article-footer-meta">
        <div className="page-feedback">
          <span>Was this page helpful?</span>
          <div className="page-feedback-actions">
            <button type="button" aria-label="Yes, this page was helpful" aria-pressed={feedback === 'yes'} disabled={feedback !== null} onClick={() => submitFeedback('yes')}>Yes</button>
            <button type="button" aria-label="No, this page was not helpful" aria-pressed={feedback === 'no'} disabled={feedback !== null} onClick={() => submitFeedback('no')}>No</button>
          </div>
          {feedback && <span className="page-feedback-thanks" role="status">Thanks for the feedback.</span>}
        </div>
        <div className="article-footer-links">
          <a
            href={editHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => captureDocsEvent('docs_edit_opened', { page_path: pageHref })}
          >
            Suggest edits on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
