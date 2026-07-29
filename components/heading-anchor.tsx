'use client';

import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export function HeadingAnchor({ as: Heading, children, id, className, ...props }: HTMLAttributes<HTMLHeadingElement> & { as: HeadingTag; children?: ReactNode }) {
  async function copyAnchor(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (!id) return;

    // Copy the deep link and reflect it in the URL bar without scrolling the
    // page (replaceState does not scroll, unlike assigning location.hash).
    const url = new URL(window.location.href);
    url.hash = id;
    window.history.replaceState(null, '', url);

    if (await copyToClipboard(url.href)) {
      toast.success('Link copied', { description: `#${id}` });
    } else {
      toast.error('Couldn’t copy link');
    }
  }

  if (!id) return <Heading className={className} {...props}>{children}</Heading>;

  return (
    <Heading id={id} className={['anchor-heading', className].filter(Boolean).join(' ')} {...props}>
      <a href={`#${id}`} onClick={copyAnchor} title="Copy link to this section">
        <span>{children}</span>
        <span className="anchor-hash" aria-hidden="true">#</span>
      </a>
    </Heading>
  );
}
