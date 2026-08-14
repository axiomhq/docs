'use client';

import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
    <Heading id={id} className={cn('anchor-heading relative scroll-mt-[32px]', className)} {...props}>
      <a href={`#${id}`} onClick={copyAnchor} title="Copy link to this section" className="no-underline!">
        {/* Link marker sits in the left gutter (absolute, so the heading never
            shifts) and reveals on hover/focus. Keyed off `.anchor-heading`
            directly rather than `group-hover:`: Tailwind v4 wraps `hover:` in
            `@media (hover: hover)`, which would drop it on coarse pointers.
            Hidden below sm where the gutter would clip off-screen. */}
        <span
          className="anchor-hash absolute right-full top-1/2 -translate-y-1/2 mr-[10px] flex text-(--text-quaternary) opacity-0 translate-x-[3px] transition-[opacity,translate] duration-150 ease-[ease] [.anchor-heading:hover_&]:opacity-100 [.anchor-heading:hover_&]:translate-x-0 [.anchor-heading:has(a:focus-visible)_&]:opacity-100 [.anchor-heading:has(a:focus-visible)_&]:translate-x-0 max-sm:hidden"
          aria-hidden="true"
        >
          <LinkIcon className="size-[.6em]" strokeWidth={2.25} />
        </span>
        {children}
      </a>
    </Heading>
  );
}
