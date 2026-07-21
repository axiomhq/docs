'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

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
    <aside className="floating-toc" aria-label="On this page">
      <strong>On this page</strong>
      {items.map((item) => (
        <a
          className={item.url === activeUrl ? 'active' : undefined}
          aria-current={item.url === activeUrl ? 'location' : undefined}
          href={item.url}
          key={item.url}
          style={{ paddingLeft: 10 + Math.max(0, item.depth - 2) * 10 }}
        >
          {item.title}
        </a>
      ))}
    </aside>
  );
}
