'use client';

import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { toast } from 'sonner';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export function HeadingAnchor({ as: Heading, children, id, className, ...props }: HTMLAttributes<HTMLHeadingElement> & { as: HeadingTag; children?: ReactNode }) {
  async function copyAnchor(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (!id) return;

    const url = new URL(window.location.href);
    url.hash = id;
    window.history.replaceState(null, '', url);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      await navigator.clipboard.writeText(url.href);
      toast.success('Link copied', { description: `#${id}` });
    } catch {
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
