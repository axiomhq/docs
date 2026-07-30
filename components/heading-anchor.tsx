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
    <Heading id={id} className={['anchor-heading scroll-mt-[88px]', className].filter(Boolean).join(' ')} {...props}>
      <a href={`#${id}`} onClick={copyAnchor} title="Copy link to this section" className="inline-flex items-baseline gap-[.35em] no-underline!">
        <span>{children}</span>
        {/* The reveal is keyed off `.anchor-heading` directly rather than
            `group-hover:` / `group-focus-visible:`: Tailwind v4 wraps `hover:`
            in `@media (hover: hover)`, which would drop the marker on
            coarse-pointer devices where the original CSS showed it. */}
        <span
          className="anchor-hash text-(--text-quaternary) font-mono text-[.72em] font-medium opacity-0 translate-x-[-3px] transition-[opacity,translate] duration-150 ease-[ease] [.anchor-heading:hover_&]:opacity-100 [.anchor-heading:hover_&]:translate-x-0 [.anchor-heading:has(a:focus-visible)_&]:opacity-100 [.anchor-heading:has(a:focus-visible)_&]:translate-x-0"
          aria-hidden="true"
        >
          #
        </span>
      </a>
    </Heading>
  );
}
