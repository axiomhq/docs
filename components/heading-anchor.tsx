'use client';

import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Check, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/clipboard';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

// One page-level live region shared by every heading anchor. It can't live
// inside the heading (it would join the heading's accessible name) or as a
// sibling (doc-prose spaces content with `h2 + p`-style rules), and it must
// exist before the first copy so assistive tech reliably announces it.
const LIVE_REGION_ID = 'heading-anchor-live-region';

function ensureLiveRegion(): HTMLElement {
  let region = document.getElementById(LIVE_REGION_ID);
  if (!region) {
    region = document.createElement('span');
    region.id = LIVE_REGION_ID;
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }
  return region;
}

export function HeadingAnchor({ as: Heading, children, id, className, ...props }: HTMLAttributes<HTMLHeadingElement> & { as: HeadingTag; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef(0);

  useEffect(() => {
    ensureLiveRegion();
  }, []);

  async function copyAnchor(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (!id) return;

    // Copy the deep link and reflect it in the URL bar without scrolling the
    // page (replaceState does not scroll, unlike assigning location.hash).
    const url = new URL(window.location.href);
    url.hash = id;
    window.history.replaceState(null, '', url);

    if (await copyToClipboard(url.href)) {
      setCopied(true);
      // The gutter marker is hidden below sm (it would clip off-screen), so
      // phones get the toast for visible confirmation instead.
      if (window.matchMedia('(width < 40rem)').matches) {
        toast.success('Link copied');
      }
      // The visual marker is aria-hidden; announce for assistive tech.
      // Cleared first so back-to-back copies re-announce.
      const region = ensureLiveRegion();
      region.textContent = '';
      requestAnimationFrame(() => {
        region.textContent = 'Link copied';
      });
      window.clearTimeout(copiedTimeout.current);
      copiedTimeout.current = window.setTimeout(() => {
        setCopied(false);
        region.textContent = '';
      }, 1600);
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
          className={cn(
            'anchor-hash absolute right-full top-1/2 -translate-y-1/2 mr-[10px] flex text-(--text-quaternary) opacity-0 translate-x-[3px] transition-[opacity,translate] duration-150 ease-[ease] [.anchor-heading:hover_&]:opacity-100 [.anchor-heading:hover_&]:translate-x-0 [.anchor-heading:has(a:focus-visible)_&]:opacity-100 [.anchor-heading:has(a:focus-visible)_&]:translate-x-0 max-sm:hidden',
            copied && 'opacity-100! translate-x-0! text-(--text-primary)',
          )}
          aria-hidden="true"
        >
          {copied
            ? <Check className="size-[.75em]" strokeWidth={2.25} />
            : <LinkIcon className="size-[.75em]" strokeWidth={2.25} />}
        </span>
        {children}
      </a>
    </Heading>
  );
}
