'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

// Was `.floating-toc a` / `.floating-toc a.active` (+ its ::before marker). The
// colour and weight are split across the two branches rather than layered, so
// the active state never depends on stylesheet ordering to win.
//
// Every colour carries `!` because the unlayered `a { color: inherit }` in
// app/globals.css outranks anything Tailwind emits into `@layer utilities`;
// without it all three states would collapse to the inherited body colour.
// Hover uses `[&:hover]` rather than `hover:` so it is not gated behind
// `@media (hover: hover)`, matching the unconditional rule it replaces.
const TOC_LINK =
  'relative block py-[5px] overflow-hidden font-sans text-[13px] leading-[17px] tracking-[-.006em] text-ellipsis whitespace-nowrap transition-[color] duration-150 ease-[ease] [&:hover]:text-foreground!';
const TOC_LINK_IDLE = 'text-muted-foreground! font-[450]';
const TOC_LINK_ACTIVE =
  "active text-foreground! font-[550] before:absolute before:left-px before:top-1/2 before:-translate-y-1/2 before:w-[5px] before:h-[9px] before:bg-current before:content-['']";

export type TocItem = {
  title: ReactNode;
  url: string;
  depth: number;
};

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeUrl, setActiveUrl] = useState(items[0]?.url ?? '');

  useEffect(() => {
    const headings = items
      .map((item) => ({ item, element: document.getElementById(item.url.slice(1)) }))
      .filter((entry): entry is { item: TocItem; element: HTMLElement } => entry.element !== null);

    if (headings.length === 0) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Match the heading scroll offset, with a little tolerance for
        // sub-pixel layout so hash navigation activates the target heading.
        const readingLine = 116;
        let current = headings[0].item.url;

        for (const heading of headings) {
          if (heading.element.getBoundingClientRect().top > readingLine) break;
          current = heading.item.url;
        }

        const atPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        setActiveUrl(atPageEnd ? headings.at(-1)!.item.url : current);
      });
    };

    frame = requestAnimationFrame(update);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [items]);

  return (
    <aside
      className="floating-toc sticky top-28 hidden h-fit max-h-[calc(100svh_-_144px)] w-[210px] self-start flex-col bg-transparent p-0 xl:flex [&_a_code]:text-inherit! [&_a_code]:[font-size:inherit]"
      aria-label="On this page"
    >
      {/* The heading stays outside the scroller so the scroll-fade mask never
          dims it — only the link list scrolls and fades at its edges. */}
      <strong className="mb-[9px] block flex-none font-mono text-[11px] leading-[14px] font-semibold tracking-[.08em] text-secondary-foreground uppercase">On this page</strong>
      <div className="min-h-0 flex-1 overflow-auto scroll-fade-t scroll-fade-b">
        {items.map((item) => (
          <a
            className={cn(TOC_LINK, item.url === activeUrl ? TOC_LINK_ACTIVE : TOC_LINK_IDLE)}
            aria-current={item.url === activeUrl ? 'location' : undefined}
            href={item.url}
            key={item.url}
            style={{ paddingLeft: 10 + Math.max(0, item.depth - 2) * 10 }}
          >
            {item.title}
          </a>
        ))}
      </div>
    </aside>
  );
}
